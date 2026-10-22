import { HttpAuthStore } from "./http_store.ts";
import { AuthService } from "./service.ts";
import { serveAsterAsset } from "./aster_assets.ts";
import type { AuthConfig } from "./config.ts";
import type { Identity, OAuthTransaction, SessionRecord } from "./types.ts";

function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}

function equal(actual: unknown, expected: unknown, message = "Values differ") {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`,
    );
  }
}

async function rejects(
  action: () => unknown | Promise<unknown>,
): Promise<Error> {
  try {
    await action();
  } catch (error) {
    assert(error instanceof Error);
    return error;
  }
  throw new Error("Expected rejection");
}

const endpoint =
  "https://abcdefghijklmnopqrstuvwx12.lambda-url.us-east-2.on.aws/";
const secret = "aB_8TestSecretWithAtLeastThirtyTwoBytes1234567";
const now = 1_800_000_000;
const id = "u".repeat(43);
const key = "k".repeat(43);
const browserHash = "b".repeat(43);
const publicProfile = {
  id,
  name: "Example Person",
  email: "person@example.com",
  picture: "https://example.com/avatar.png",
};
const identity: Identity = {
  subject: "immutable-subject",
  name: publicProfile.name,
  email: publicProfile.email,
  emailVerified: true,
  picture: publicProfile.picture,
  authenticatedAt: now - 10,
};
const transaction: OAuthTransaction = {
  browserHash,
  verifier: "v".repeat(43),
  nonce: "n".repeat(43),
  returnTo: "/archives?view=members",
  redirectUri: "https://tejasam.com/auth/callback",
  expiresAt: now + 600,
};
const session: SessionRecord = {
  userId: id,
  authenticatedAt: now - 10,
  expiresAt: now + 28_800,
};
const user = {
  ...publicProfile,
  subject: identity.subject,
  emailVerified: true,
  accessTags: ["member", "private-editor"],
};

function fixture(initialResult: unknown = null) {
  const state = {
    result: initialResult,
    response: undefined as Response | undefined,
    failure: undefined as Error | undefined,
  };
  const requests: { url: string; init: RequestInit }[] = [];
  const fetcher: typeof fetch = (input, init) => {
    assert(init);
    requests.push({ url: String(input), init });
    if (state.failure) return Promise.reject(state.failure);
    return Promise.resolve(
      state.response ?? Response.json({ result: state.result }),
    );
  };
  const store = new HttpAuthStore(endpoint, secret, fetcher, () => now);
  return { state, requests, store };
}

function signatureBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=";
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function verifies(
  signature: string,
  timestamp: string,
  nonce: string,
  body: string,
  signingSecret = secret,
): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    cryptoKey,
    signatureBytes(signature),
    new TextEncoder().encode(`${timestamp}\n${nonce}\n${body}`),
  );
}

Deno.test("RPC requests use an authenticated server-only POST and a fresh nonce", async () => {
  const test = fixture(null);
  await test.store.getSession(key);
  await test.store.getSession(key);
  equal(test.requests.length, 2);
  const [first, second] = test.requests;
  equal(first.url, endpoint);
  equal(first.init.method, "POST");
  equal(first.init.redirect, "error");
  equal(first.init.credentials, "omit");
  assert(first.init.signal instanceof AbortSignal);
  equal(first.init.signal.aborted, false);
  const headers = new Headers(first.init.headers);
  equal(headers.get("content-type"), "application/json");
  equal(headers.get("x-auth-timestamp"), String(now));
  const nonce = headers.get("x-auth-nonce")!;
  const signature = headers.get("x-auth-signature")!;
  assert(/^[A-Za-z0-9_-]{43}$/.test(nonce));
  assert(/^[A-Za-z0-9_-]{43}$/.test(signature));
  assert(nonce !== new Headers(second.init.headers).get("x-auth-nonce"));
  equal(first.init.body, JSON.stringify({ action: "getSession", args: [key] }));
  assert(
    await verifies(signature, String(now), nonce, first.init.body as string),
  );
  assert(
    !await verifies(
      signature,
      String(now + 1),
      nonce,
      first.init.body as string,
    ),
  );
  assert(
    !await verifies(
      signature,
      String(now),
      "z".repeat(43),
      first.init.body as string,
    ),
  );
  assert(
    !await verifies(
      signature,
      String(now),
      nonce,
      JSON.stringify({ action: "getUser", args: [id] }),
    ),
  );
  assert(
    !JSON.stringify(first.init.headers).includes(secret),
    "Credential must never be transmitted directly",
  );
});

Deno.test("all seven methods map to exact positional RPC arguments", async () => {
  const test = fixture();
  await test.store.putTransaction(key, transaction);
  test.state.result = transaction;
  equal(
    await test.store.consumeTransaction(key, browserHash, now),
    transaction,
  );
  test.state.result = publicProfile;
  equal(await test.store.upsertUser(id, identity, now), publicProfile);
  test.state.result = user;
  equal(await test.store.getUser(id), user);
  test.state.result = null;
  await test.store.putSession(key, session);
  test.state.result = session;
  equal(await test.store.getSession(key), session);
  test.state.result = null;
  await test.store.deleteSession(key);
  equal(
    test.requests.map((request) => JSON.parse(request.init.body as string)),
    [
      { action: "putTransaction", args: [key, transaction] },
      { action: "consumeTransaction", args: [key, browserHash, now] },
      { action: "upsertUser", args: [id, identity, now] },
      { action: "getUser", args: [id] },
      { action: "putSession", args: [key, session] },
      { action: "getSession", args: [key] },
      { action: "deleteSession", args: [key] },
    ],
  );
});

Deno.test("only the private getUser result can contain access tags", async () => {
  const test = fixture({ ...user, privateNote: "must-stay-on-server" });
  const profile = await test.store.upsertUser(id, identity, now);
  equal(profile, publicProfile);
  assert(!JSON.stringify(profile).includes("accessTags"));
  assert(!JSON.stringify(profile).includes("private-editor"));
  assert(!JSON.stringify(profile).includes("subject"));
  assert(!JSON.stringify(profile).includes("privateNote"));
  const privateUser = await test.store.getUser(id);
  equal(privateUser, user);
  assert(!JSON.stringify(privateUser).includes("privateNote"));
  test.state.result = {
    ...transaction,
    accessTags: ["owner"],
    internalNote: "secret",
  };
  equal(
    await test.store.consumeTransaction(key, browserHash, now),
    transaction,
  );
  test.state.result = { ...session, accessTags: ["owner"] };
  equal(await test.store.getSession(key), session);
});

Deno.test("missing users, sessions and consumed transactions return null", async () => {
  const test = fixture(null);
  equal(await test.store.getUser(id), null);
  equal(await test.store.getSession(key), null);
  equal(await test.store.consumeTransaction(key, browserHash, now), null);
});

Deno.test("RPC results reject malformed public and private profiles", async () => {
  for (
    const result of [
      { ...publicProfile, id: "other".repeat(43) },
      { ...publicProfile, name: ["Example Person"] },
      { ...publicProfile, email: 123 },
      { ...publicProfile, picture: "javascript:alert(1)" },
      { ...publicProfile, picture: "https://user:password@example.com/image" },
      { ...publicProfile, name: "a".repeat(513) },
      null,
    ]
  ) {
    const test = fixture(result);
    const error = await rejects(() => test.store.upsertUser(id, identity, now));
    equal(error.message, "Authentication storage is unavailable");
  }
  for (
    const result of [
      { ...user, subject: "" },
      { ...user, emailVerified: "true" },
      { ...user, accessTags: "member" },
      { ...user, accessTags: ["Member"] },
      { ...user, accessTags: [null] },
      { ...user, accessTags: Array(257).fill("member") },
    ]
  ) {
    const test = fixture(result);
    await rejects(() => test.store.getUser(id));
  }
});

Deno.test("RPC results reject malformed sessions and expired or mismatched transactions", async () => {
  for (
    const result of [
      { ...session, userId: "not-an-opaque-id" },
      { ...session, authenticatedAt: -1 },
      { ...session, expiresAt: 1.5 },
      { ...session, expiresAt: session.authenticatedAt },
    ]
  ) {
    const test = fixture(result);
    await rejects(() => test.store.getSession(key));
  }
  for (
    const result of [
      { ...transaction, browserHash: "z".repeat(43) },
      { ...transaction, verifier: "short" },
      { ...transaction, nonce: 123 },
      { ...transaction, returnTo: "https://attacker.example" },
      { ...transaction, redirectUri: "https://tejasam.com/other" },
      { ...transaction, redirectUri: "http://attacker.example/auth/callback" },
      { ...transaction, expiresAt: now },
    ]
  ) {
    const test = fixture(result);
    await rejects(() => test.store.consumeTransaction(key, browserHash, now));
  }
});

Deno.test("RPC void methods require an explicit null result", async () => {
  for (const result of [{}, true, 1, "success"]) {
    const test = fixture(result);
    await rejects(() => test.store.putTransaction(key, transaction));
    await rejects(() => test.store.putSession(key, session));
    await rejects(() => test.store.deleteSession(key));
  }
});

Deno.test("malformed response envelopes, JSON and content types are rejected", async () => {
  for (
    const response of [
      Response.json({}),
      Response.json({ error: "private backend detail" }),
      Response.json({ result: null, debug: "private backend detail" }),
      Response.json([null]),
      new Response("not-json", {
        headers: { "Content-Type": "application/json" },
      }),
      new Response('{"result":null}', {
        headers: { "Content-Type": "text/html" },
      }),
      new Response(new Uint8Array([0xff]), {
        headers: { "Content-Type": "application/json" },
      }),
    ]
  ) {
    const test = fixture();
    test.state.response = response;
    const error = await rejects(() => test.store.getSession(key));
    equal(error.message, "Authentication storage is unavailable");
  }
});

Deno.test("non-success and network errors do not disclose backend bodies", async () => {
  const test = fixture();
  test.state.response = new Response("AWS private detail and secret", {
    status: 403,
  });
  let error = await rejects(() => test.store.getSession(key));
  equal(error.message, "Authentication storage is unavailable");
  assert(!error.message.includes("private"));
  test.state.response = undefined;
  test.state.failure = new Error(`private request credential: ${secret}`);
  error = await rejects(() => test.store.getSession(key));
  equal(error.message, "Authentication storage is unavailable");
  assert(!error.message.includes(secret));
});

Deno.test("advertised oversized responses are cancelled without being read", async () => {
  const test = fixture();
  let cancelled = false;
  test.state.response = new Response(
    new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "65537",
      },
    },
  );
  await rejects(() => test.store.getSession(key));
  assert(cancelled);
});

Deno.test("streamed response size is bounded despite a false content length", async () => {
  const test = fixture();
  let cancelled = false;
  let chunks = 0;
  test.state.response = new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        chunks++;
        controller.enqueue(new Uint8Array(32_768).fill(97));
      },
      cancel() {
        cancelled = true;
      },
    }),
    {
      headers: { "Content-Type": "application/json", "Content-Length": "10" },
    },
  );
  await rejects(() => test.store.getSession(key));
  assert(cancelled);
  assert(
    chunks <= 4,
    "An oversized response must stop being consumed promptly",
  );
});

Deno.test("request size is bounded before any network call", async () => {
  const test = fixture();
  await rejects(() =>
    test.store.upsertUser(id, { ...identity, name: "é".repeat(40_000) }, now)
  );
  equal(test.requests.length, 0);
});

Deno.test("endpoint validation rejects arbitrary origins, paths, ports and other Regions", async () => {
  for (
    const invalid of [
      "http://abcdefghijklmnopqrstuvwx12.lambda-url.us-east-2.on.aws/",
      "https://abcdefghijklmnopqrstuvwx12.lambda-url.us-east-1.on.aws/",
      "https://abcdefghijklmnopqrstuvwx12.lambda-url.us-east-2.on.aws.attacker.example/",
      "https://attacker.example/",
      "https://localhost/",
      "https://user:password@abcdefghijklmnopqrstuvwx12.lambda-url.us-east-2.on.aws/",
      "https://abcdefghijklmnopqrstuvwx12.lambda-url.us-east-2.on.aws:443/",
      `${endpoint}other`,
      `${endpoint}?query=1`,
      `${endpoint}#fragment`,
      `${endpoint}/`,
    ]
  ) {
    const error = await rejects(() => new HttpAuthStore(invalid, secret));
    equal(error.message, "Invalid authentication storage endpoint");
  }
  new HttpAuthStore(endpoint.slice(0, -1), secret);
  new HttpAuthStore(endpoint, secret);
});

Deno.test("credentials require at least 32 UTF-8 bytes and are used as text", async () => {
  await rejects(() => new HttpAuthStore(endpoint, "a".repeat(31)));
  await rejects(() => new HttpAuthStore(endpoint, "a".repeat(4097)));
  const unicodeSecret = "é".repeat(16);
  let request: RequestInit | undefined;
  const fetcher: typeof fetch = (_input, init) => {
    request = init;
    return Promise.resolve(Response.json({ result: null }));
  };
  await new HttpAuthStore(endpoint, unicodeSecret, fetcher, () => now)
    .getSession(key);
  assert(request);
  const headers = new Headers(request.headers);
  assert(
    await verifies(
      headers.get("x-auth-signature")!,
      String(now),
      headers.get("x-auth-nonce")!,
      request.body as string,
      unicodeSecret,
    ),
  );
});

Deno.test("an invalid clock fails before any network call", async () => {
  for (const value of [NaN, Infinity, -1, 1.5]) {
    let called = false;
    const fetcher: typeof fetch = () => {
      called = true;
      return Promise.resolve(Response.json({ result: null }));
    };
    await rejects(() =>
      new HttpAuthStore(endpoint, secret, fetcher, () => value).getSession(key)
    );
    equal(called, false);
  }
});

Deno.test("parallel RPCs are serialized without sharing stored results", async () => {
  let active = 0;
  let maximum = 0;
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls++;
    active++;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active--;
    return Response.json({ result: null });
  };
  const store = new HttpAuthStore(endpoint, secret, fetcher, () => now);
  const results = await Promise.all(
    Array.from({ length: 12 }, () => store.getSession(key)),
  );
  equal(results, Array(12).fill(null));
  equal(maximum, 1);
  equal(calls, 12, "Every request must still read the store");
});

Deno.test("twelve parallel protected images all load within the bridge concurrency cap", async () => {
  let active = 0;
  let calls = 0;
  let throttles = 0;
  const fetcher: typeof fetch = async (_input, init) => {
    assert(init);
    calls++;
    if (active >= 2) {
      throttles++;
      return new Response(null, { status: 429 });
    }
    active++;
    await new Promise((resolve) => setTimeout(resolve, 1));
    active--;
    const { action } = JSON.parse(String(init.body));
    return Response.json({
      result: action === "getSession"
        ? session
        : { ...user, accessTags: ["aster:read"] },
    });
  };
  const store = new HttpAuthStore(endpoint, secret, fetcher, () => now);
  const service = new AuthService(
    { recentSeconds: 900 } as AuthConfig,
    store,
    fetch,
    undefined,
    () => now,
  );
  const results = await Promise.all(Array.from({ length: 12 }, async () => {
    const response = await serveAsterAsset(
      new Request("https://tejasam.com/aster/test-full.webp", {
        headers: { Cookie: `__Host-tejas-session=${key}` },
      }),
      new URL("file:///server/private/aster/"),
      {
        requireAccess: async (request, tags) =>
          await service.hasAccess(request, tags)
            ? null
            : new Response(null, { status: 404 }),
        loadManifest: () =>
          Promise.resolve({
            images: [{ files: [{ filename: "test-full.webp", bytes: 4 }] }],
          }),
        readFile: () => Promise.resolve(new Uint8Array([1, 2, 3, 4])),
      },
    );
    return [response.status, (await response.arrayBuffer()).byteLength];
  }));
  equal(results, Array.from({ length: 12 }, () => [200, 4]));
  equal(throttles, 0);
  equal(calls, 24, "Each image must freshly read both its session and user");
});

Deno.test("explicit Lambda throttles retry with fresh signed requests and cancel their bodies", async () => {
  const requests: RequestInit[] = [];
  const waits: number[] = [];
  let cancelled = 0;
  const fetcher: typeof fetch = (_input, init) => {
    assert(init);
    requests.push(init);
    return Promise.resolve(
      requests.length < 3
        ? new Response(
          new ReadableStream({
            cancel() {
              cancelled++;
            },
          }),
          { status: 429 },
        )
        : Response.json({ result: session }),
    );
  };
  const store = new HttpAuthStore(
    endpoint,
    secret,
    fetcher,
    () => now + requests.length,
    {
      wait(milliseconds, signal) {
        assert(!signal.aborted);
        waits.push(milliseconds);
        return Promise.resolve();
      },
      jitter: () => 0.5,
    },
  );
  equal(await store.getSession(key), session);
  equal(requests.length, 3);
  equal(cancelled, 2);
  equal(waits, [250, 500]);
  const nonces = new Set<string>();
  for (const [index, init] of requests.entries()) {
    const headers = new Headers(init.headers);
    const nonce = headers.get("x-auth-nonce")!;
    nonces.add(nonce);
    equal(headers.get("x-auth-timestamp"), String(now + index));
    assert(
      await verifies(
        headers.get("x-auth-signature")!,
        String(now + index),
        nonce,
        String(init.body),
      ),
    );
  }
  equal(nonces.size, 3);
});

Deno.test("429 retries are bounded and an exhausted call releases the queue", async () => {
  let calls = 0;
  let waits = 0;
  let throttle = true;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.resolve(
      throttle
        ? new Response(null, { status: 429 })
        : Response.json({ result: null }),
    );
  };
  const store = new HttpAuthStore(endpoint, secret, fetcher, () => now, {
    wait: () => {
      waits++;
      return Promise.resolve();
    },
    jitter: () => 0,
  });
  const error = await rejects(() => store.getSession(key));
  equal(error.message, "Authentication storage is unavailable");
  equal(calls, 4);
  equal(waits, 3);
  throttle = false;
  equal(await store.getSession(key), null);
  equal(calls, 5);
});

Deno.test("a pre-execution 429 may retry a write but ambiguous write failures never retry", async () => {
  for (const firstStatus of [429, 401, 403, 500, 502, 503, 504]) {
    let calls = 0;
    const fetcher: typeof fetch = () => {
      calls++;
      return Promise.resolve(
        calls === 1
          ? new Response(null, { status: firstStatus })
          : Response.json({ result: null }),
      );
    };
    const store = new HttpAuthStore(endpoint, secret, fetcher, () => now, {
      wait: () => Promise.resolve(),
      jitter: () => 0,
    });
    if (firstStatus === 429) {
      await store.putSession(key, session);
      equal(calls, 2);
    } else {
      await rejects(() => store.putSession(key, session));
      equal(calls, 1);
    }
  }
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.reject(new Error("Ambiguous network failure"));
  };
  const store = new HttpAuthStore(endpoint, secret, fetcher, () => now);
  await rejects(() => store.consumeTransaction(key, browserHash, now));
  equal(calls, 1);
});

Deno.test("permanent read failures do not retry and queued work can proceed", async () => {
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.resolve(
      calls === 1
        ? new Response("Private failure", { status: 503 })
        : Response.json({ result: null }),
    );
  };
  const store = new HttpAuthStore(endpoint, secret, fetcher, () => now);
  const results = await Promise.allSettled([
    store.getSession(key),
    store.getSession(key),
  ]);
  equal(results.map((result) => result.status), ["rejected", "fulfilled"]);
  equal(calls, 2);
});

Deno.test("the RPC queue is bounded and excess work fails closed", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls++;
    await new Promise((resolve) => setTimeout(resolve, 1));
    return Response.json({ result: null });
  };
  const store = new HttpAuthStore(endpoint, secret, fetcher, () => now);
  const results = await Promise.allSettled(
    Array.from({ length: 34 }, () => store.getSession(key)),
  );
  equal(results.filter((result) => result.status === "fulfilled").length, 33);
  equal(results.filter((result) => result.status === "rejected").length, 1);
  equal(calls, 33);
});

Deno.test("one RPC deadline includes queue wait, aborts requests, and frees the queue", async () => {
  let block = true;
  const entered: number[] = [];
  const fetcher: typeof fetch = (_input, init) => {
    assert(init?.signal);
    entered.push(performance.now());
    if (!block) return Promise.resolve(Response.json({ result: null }));
    return new Promise((_resolve, reject) => {
      init.signal!.addEventListener(
        "abort",
        () => reject(new Error("Aborted")),
        {
          once: true,
        },
      );
    });
  };
  const store = new HttpAuthStore(endpoint, secret, fetcher, () => now, {
    timeoutMs: 80,
  });
  const first = rejects(() => store.getSession(key));
  await new Promise((resolve) => setTimeout(resolve, 30));
  const started = performance.now();
  await Promise.all([first, rejects(() => store.getSession(key))]);
  assert(
    performance.now() - started < 115,
    "Queue wait must count toward timeout",
  );
  assert(entered.length <= 2);
  block = false;
  equal(await store.getSession(key), null);
});

Deno.test("the deadline also bounds stalled throttle backoff", async () => {
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.resolve(new Response(null, { status: 429 }));
  };
  const store = new HttpAuthStore(endpoint, secret, fetcher, () => now, {
    timeoutMs: 20,
    wait: () => new Promise(() => {}),
    jitter: () => 0,
  });
  await rejects(() => store.getSession(key));
  equal(calls, 1);
});
