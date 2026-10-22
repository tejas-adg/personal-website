import authStoreModule from "./auth-store-handler.cjs";
import { HttpAuthStore } from "../lib/auth/http_store.ts";

interface RpcEvent {
  requestContext: { http: { method: string } };
  headers: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

interface RpcResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

type Store = Record<string, (...args: unknown[]) => Promise<unknown>>;

const { createHandler } = authStoreModule as {
  createHandler(options: {
    store: Store;
    replay?: (nonce: string, now: number) => Promise<boolean> | boolean;
    secret: string;
    clock: () => number;
  }): (event: RpcEvent) => Promise<RpcResponse>;
};

const secret = "a".repeat(43);
const now = 1_800_000_000;
const key = "b".repeat(43);
let nonceCounter = 0;
const hmacKey = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);

function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}

function fixture() {
  const calls: { action: string; args: unknown[] }[] = [];
  const store = Object.fromEntries([
    "putTransaction",
    "consumeTransaction",
    "upsertUser",
    "getUser",
    "putSession",
    "getSession",
    "deleteSession",
  ].map((action) => [
    action,
    (...args: unknown[]) => {
      calls.push({ action, args });
      return Promise.resolve(
        action === "getUser"
          ? {
            id: key,
            name: "Test User",
            accessTags: ["member"],
          }
          : null,
      );
    },
  ]));
  const handler = createHandler({ store, secret, clock: () => now });
  return { handler, store, calls };
}

async function event(
  body: unknown,
  overrides: { timestamp?: number; nonce?: string } = {},
): Promise<RpcEvent> {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  const timestamp = String(overrides.timestamp ?? now);
  const nonce = overrides.nonce ?? String(++nonceCounter).padStart(43, "x");
  const signed = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    new TextEncoder().encode(`${timestamp}\n${nonce}\n${raw}`),
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(signed)))
    .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return {
    requestContext: { http: { method: "POST" } },
    headers: {
      "x-auth-timestamp": timestamp,
      "x-auth-nonce": nonce,
      "x-auth-signature": signature,
    },
    body: raw,
  };
}

function identity() {
  return {
    subject: "subject-123",
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    picture: null,
    authenticatedAt: now - 10,
  };
}

function rpcClient(
  handler: (event: RpcEvent) => Promise<RpcResponse>,
  clientNow: number,
) {
  const statuses: number[] = [];
  const fetcher: typeof fetch = async (_input, init) => {
    assert(init && typeof init.body === "string");
    const result = await handler({
      requestContext: { http: { method: "POST" } },
      body: init.body,
      headers: Object.fromEntries(new Headers(init.headers)),
      isBase64Encoded: false,
    });
    statuses.push(result.statusCode);
    return new Response(result.body, {
      status: result.statusCode,
      headers: result.headers,
    });
  };
  const client = new HttpAuthStore(
    "https://abcdefghijklmnopqrstuvwx12.lambda-url.us-east-2.on.aws/",
    secret,
    fetcher,
    () => clientNow,
  );
  return { client, statuses };
}

function oauthTransaction(expiresAt: number) {
  return {
    browserHash: key,
    verifier: "c".repeat(43),
    nonce: "d".repeat(43),
    returnTo: "/account",
    redirectUri: "https://tejasam.com/auth/callback",
    expiresAt,
  };
}

Deno.test("bridge accepts a signed server request and returns private data only through RPC", async () => {
  const { handler, calls } = fixture();
  const result = await handler(await event({ action: "getUser", args: [key] }));
  assert(result.statusCode === 200);
  const body = JSON.parse(result.body);
  assert(body.result.accessTags[0] === "member");
  assert(calls.length === 1 && calls[0].action === "getUser");
  assert(result.headers["cache-control"] === "private, no-store");
  assert(
    !Object.keys(result.headers).some((name) =>
      name.startsWith("access-control-")
    ),
  );
});

Deno.test("bridge rejects unsigned, tampered, stale, future, and duplicate-header requests before storage", async (test) => {
  const cases: [string, (request: RpcEvent) => void][] = [
    [
      "missing signature",
      (request) => delete request.headers["x-auth-signature"],
    ],
    ["tampered body", (request) => request.body += " "],
    [
      "wrong signature",
      (request) => request.headers["x-auth-signature"] = "a".repeat(43),
    ],
    [
      "duplicate header",
      (request) => request.headers["X-Auth-Nonce"] = "a".repeat(43),
    ],
    [
      "malformed nonce",
      (request) => request.headers["x-auth-nonce"] = "not-a-nonce",
    ],
    [
      "stale",
      (request) => request.headers["x-auth-timestamp"] = String(now - 31),
    ],
    [
      "future",
      (request) => request.headers["x-auth-timestamp"] = String(now + 31),
    ],
  ];
  for (const [name, mutate] of cases) {
    await test.step(name, async () => {
      const { handler, calls } = fixture();
      const request = await event({ action: "getUser", args: [key] });
      mutate(request);
      const result = await handler(request);
      assert(result.statusCode === 401);
      assert(calls.length === 0);
      assert(result.body === '{"error":"Unauthorized"}');
    });
  }
});

Deno.test("bridge blocks replay even when the same valid message is submitted again", async () => {
  const { handler, calls } = fixture();
  const request = await event({ action: "getUser", args: [key] });
  assert((await handler(request)).statusCode === 200);
  assert((await handler(request)).statusCode === 401);
  assert(calls.length === 1);
});

Deno.test("bridge uses the shared durable replay function before dispatch", async () => {
  const { store, calls } = fixture();
  let replayCalls = 0;
  const handler = createHandler({
    store,
    secret,
    clock: () => now,
    replay: (nonce, receivedAt) => {
      assert(nonce.length === 43 && receivedAt === now);
      replayCalls++;
      return Promise.resolve(false);
    },
  });
  const result = await handler(await event({ action: "getUser", args: [key] }));
  assert(result.statusCode === 401 && calls.length === 0 && replayCalls === 1);
});

Deno.test("bridge rejects arbitrary actions, additional columns, and malformed records", async (test) => {
  const requests = [
    { action: "constructor", args: [key] },
    { action: "deleteUser", args: [key] },
    { action: "getUser", args: ["not-a-hash"] },
    { action: "getUser", args: [key, "unexpected"] },
    { action: "getUser", args: [key], table: "another-table" },
    {
      action: "upsertUser",
      args: [key, { ...identity(), accessTags: ["owner"] }, now],
    },
    {
      action: "upsertUser",
      args: [key, { ...identity(), authenticatedAt: now + 1 }, now],
    },
    { action: "upsertUser", args: [key, { ...identity(), email: null }, now] },
    {
      action: "putSession",
      args: [key, {
        userId: key,
        authenticatedAt: now + 1,
        expiresAt: now + 300,
      }],
    },
    {
      action: "putSession",
      args: [key, {
        userId: key,
        authenticatedAt: now - 1,
        expiresAt: now + 86_401,
      }],
    },
    {
      action: "putSession",
      args: [key, { userId: key, authenticatedAt: now - 1, expiresAt: now }],
    },
  ];
  for (const [index, request] of requests.entries()) {
    await test.step(String(index), async () => {
      const { handler, calls } = fixture();
      const result = await handler(await event(request));
      assert(result.statusCode === 400 && calls.length === 0);
    });
  }
});

Deno.test("bridge validates OAuth transaction bounds and canonicalizes the consumption clock", async () => {
  const { handler, calls } = fixture();
  const transaction = {
    browserHash: key,
    verifier: "c".repeat(43),
    nonce: "d".repeat(43),
    returnTo: "/account",
    redirectUri: "https://tejasam.com/auth/callback",
    expiresAt: now + 600,
  };
  assert(
    (await handler(
      await event({ action: "putTransaction", args: [key, transaction] }),
    )).statusCode === 200,
  );
  assert(
    (await handler(
      await event({
        action: "putTransaction",
        args: [key, { ...transaction, expiresAt: now + 601 }],
      }),
    )).statusCode === 400,
  );
  assert(
    (await handler(
      await event({
        action: "putTransaction",
        args: [key, { ...transaction, returnTo: "//evil.example" }],
      }),
    )).statusCode === 400,
  );
  assert(
    (await handler(
      await event({ action: "consumeTransaction", args: [key, key, now - 20] }),
    )).statusCode === 200,
  );
  assert(calls[1].args[2] === now);
});

Deno.test("real RPC client tolerates clock skew while capping OAuth expiry on the bridge clock", async (test) => {
  for (const drift of [-30, 0, 1, 30]) {
    await test.step(`${drift} seconds`, async () => {
      const { handler, calls } = fixture();
      const { client, statuses } = rpcClient(handler, now + drift);
      await client.putTransaction(
        key,
        oauthTransaction(now + drift + 600),
      );
      assert(statuses[0] === 200 && calls.length === 1);
      const saved = calls[0].args[1] as { expiresAt: number };
      assert(saved.expiresAt === Math.min(now + drift + 600, now + 600));
      assert(saved.expiresAt <= now + 600);
    });
  }
});

Deno.test("real RPC client tolerates clock skew without expanding maximum session lifetime", async (test) => {
  for (const drift of [-30, 0, 1, 30]) {
    await test.step(`${drift} seconds`, async () => {
      const { handler, calls } = fixture();
      const { client, statuses } = rpcClient(handler, now + drift);
      await client.putSession(key, {
        userId: key,
        authenticatedAt: now - 60,
        expiresAt: now + drift + 86_400,
      });
      assert(statuses[0] === 200 && calls.length === 1);
      const saved = calls[0].args[1] as {
        authenticatedAt: number;
        expiresAt: number;
      };
      assert(saved.expiresAt === Math.min(now + drift + 86_400, now + 86_400));
      assert(saved.expiresAt <= now + 86_400);
      assert(saved.authenticatedAt === now - 60);
    });
  }
});

Deno.test("valid RPC signatures beyond supported clock skew cannot dispatch", async (test) => {
  for (const drift of [-31, 31]) {
    await test.step(`${drift} seconds`, async () => {
      const { handler, calls } = fixture();
      const { client, statuses } = rpcClient(handler, now + drift);
      let rejected = false;
      try {
        await client.putTransaction(
          key,
          oauthTransaction(now + drift + 600),
        );
      } catch {
        rejected = true;
      }
      assert(rejected && statuses[0] === 401 && calls.length === 0);
    });
  }
});

Deno.test("clock tolerance does not permit a caller to request longer record lifetimes", async () => {
  const { handler, calls } = fixture();
  const clientNow = now + 30;
  const transaction = await handler(
    await event({
      action: "putTransaction",
      args: [key, oauthTransaction(clientNow + 601)],
    }, { timestamp: clientNow }),
  );
  assert(transaction.statusCode === 400 && calls.length === 0);
  const session = await handler(
    await event({
      action: "putSession",
      args: [key, {
        userId: key,
        authenticatedAt: now - 60,
        expiresAt: clientNow + 86_401,
      }],
    }, { timestamp: clientNow }),
  );
  assert(session.statusCode === 400 && calls.length === 0);
});

Deno.test("bridge rejects malformed JSON and oversized payloads without dispatch", async () => {
  const { handler, calls } = fixture();
  assert((await handler(await event("{"))).statusCode === 400);
  assert((await handler(await event(" ".repeat(65_537)))).statusCode === 413);
  assert((await handler(await event("é".repeat(32_769)))).statusCode === 413);
  assert(calls.length === 0);
});

Deno.test("bridge verifies the decoded body when Function URLs encode a request as base64", async () => {
  const { handler } = fixture();
  const request = await event({ action: "getUser", args: [key] });
  request.body = btoa(request.body);
  request.isBase64Encoded = true;
  assert((await handler(request)).statusCode === 200);
});

Deno.test("bridge rejects non-POST and sanitizes backing-service failures", async () => {
  const { handler, store } = fixture();
  const get = await event({ action: "getUser", args: [key] });
  get.requestContext.http.method = "GET";
  assert((await handler(get)).statusCode === 405);
  store.getUser = () => {
    throw new Error("private stack, accessTags, and secret material");
  };
  const result = await handler(await event({ action: "getUser", args: [key] }));
  assert(result.statusCode === 503);
  assert(result.body === '{"error":"Authentication storage is unavailable"}');
  assert(!result.body.includes("private"));
});
