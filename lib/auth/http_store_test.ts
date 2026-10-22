import { HttpAuthStore } from "./http_store.ts";
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
