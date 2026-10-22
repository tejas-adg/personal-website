import { verifyCognitoIdToken } from "./oidc.ts";

const issuer = "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_Test123";
const now = 1_800_000_000;
const clientId = "website-client";
const nonce = "random-browser-bound-nonce";
const encoder = new TextEncoder();
const keyPair = await crypto.subtle.generateKey(
  {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2_048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
  true,
  ["sign", "verify"],
);
const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

function assert(
  condition: unknown,
  message = "Assertion failed",
): asserts condition {
  if (!condition) throw new Error(message);
}

async function assertRejects(action: () => Promise<unknown>) {
  let rejected = false;
  try {
    await action();
  } catch {
    rejected = true;
  }
  assert(rejected, "Expected the invalid identity token to be rejected");
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll(
    "/",
    "_",
  ).replaceAll("=", "");
}

function encodeJson(value: unknown): string {
  return base64Url(encoder.encode(JSON.stringify(value)));
}

async function token(
  claims: Record<string, unknown> = {},
  header: Record<string, unknown> = {},
): Promise<string> {
  const encodedHeader = encodeJson({ alg: "RS256", kid: "key-1", ...header });
  const encodedClaims = encodeJson({
    iss: issuer,
    aud: clientId,
    sub: "subject-123",
    token_use: "id",
    nonce,
    iat: now - 10,
    exp: now + 3_600,
    auth_time: now - 20,
    name: "Test User",
    email: "test@example.com",
    email_verified: true,
    picture: "https://example.com/avatar.png",
    ...claims,
  });
  const message = `${encodedHeader}.${encodedClaims}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keyPair.privateKey,
    encoder.encode(message),
  );
  return `${message}.${base64Url(new Uint8Array(signature))}`;
}

function keyFetcher(document?: unknown): typeof fetch {
  return ((_input: string | URL | Request, _options?: RequestInit) => {
    return Promise.resolve(Response.json(
      document ?? {
        keys: [{ ...publicKey, alg: "RS256", kid: "key-1", use: "sig" }],
      },
      { headers: { "cache-control": "public, max-age=3600" } },
    ));
  }) as typeof fetch;
}

Deno.test("verifies an RSA-signed Cognito ID token and exposes only safe fields", async () => {
  const identity = await verifyCognitoIdToken(
    await token({ "cognito:groups": ["owner"], accessTags: ["secret"] }),
    { issuer, clientId, nonce, now, fetcher: keyFetcher() },
  );
  assert(identity.subject === "subject-123");
  assert(identity.name === "Test User");
  assert(identity.email === "test@example.com");
  assert(identity.emailVerified === true);
  assert(identity.authenticatedAt === now - 20);
  assert(identity.picture === "https://example.com/avatar.png");
  assert(
    Object.keys(identity).sort().join(",") ===
      "authenticatedAt,email,emailVerified,name,picture,subject",
    "Private claims must not appear in the returned identity",
  );
});

Deno.test("rejects a payload modified after signing", async () => {
  const signed = await token();
  const [header, , signature] = signed.split(".");
  await assertRejects(() =>
    verifyCognitoIdToken(
      `${header}.${
        encodeJson({
          iss: issuer,
          aud: clientId,
          sub: "attacker",
          token_use: "id",
          nonce,
          iat: now - 10,
          exp: now + 300,
          auth_time: now - 20,
        })
      }.${signature}`,
      { issuer, clientId, nonce, now, fetcher: keyFetcher() },
    )
  );
});

Deno.test("rejects invalid identity, time, and replay claims", async (test) => {
  const cases: [string, Record<string, unknown>][] = [
    ["issuer", { iss: "https://attacker.example" }],
    ["audience", { aud: "other-client" }],
    ["audience array", { aud: [clientId] }],
    ["nonce", { nonce: "other-browser" }],
    ["missing nonce", { nonce: undefined }],
    ["token use", { token_use: "access" }],
    ["expired", { exp: now }],
    ["future issue time", { iat: now + 1 }],
    ["future authentication", { auth_time: now + 1 }],
    ["authentication after issue", { auth_time: now - 5 }],
    ["missing authentication", { auth_time: undefined }],
    ["invalid authentication", { auth_time: "1800000000" }],
    ["negative authentication", { auth_time: -1 }],
    ["future not-before", { nbf: now + 1 }],
    ["missing subject", { sub: "" }],
    ["wrong authorized party", { azp: "another-client" }],
    ["invalid verification claim", { email_verified: "true" }],
  ];
  for (const [name, claims] of cases) {
    await test.step(name, async () => {
      const signed = await token(claims);
      await assertRejects(() =>
        verifyCognitoIdToken(signed, {
          issuer,
          clientId,
          nonce,
          now,
          fetcher: keyFetcher(),
        })
      );
    });
  }
});

Deno.test("rejects unsigned, alternate algorithm, and critical-header tokens", async (test) => {
  for (
    const header of [
      { alg: "none" },
      { alg: "HS256" },
      { alg: "RS512" },
      { crit: ["custom"] },
      { b64: false },
      { kid: "unknown-key" },
    ]
  ) {
    await test.step(JSON.stringify(header), async () => {
      const signed = await token({}, header);
      await assertRejects(() =>
        verifyCognitoIdToken(signed, {
          issuer,
          clientId,
          nonce,
          now,
          fetcher: keyFetcher(),
        })
      );
    });
  }
});

Deno.test("rejects malformed encodings and oversized tokens", async () => {
  for (const value of ["", "a.b.c", "a.b.c.d", "a".repeat(16_385)]) {
    await assertRejects(() =>
      verifyCognitoIdToken(value, {
        issuer,
        clientId,
        nonce,
        now,
        fetcher: keyFetcher(),
      })
    );
  }
});

Deno.test("fetches only configured Cognito JWKS and caches verified signing keys", async () => {
  const urls: string[] = [];
  const fetcher = ((input: string | URL | Request, options?: RequestInit) => {
    urls.push(String(input));
    assert(options?.redirect === "error");
    assert(options?.credentials === "omit");
    assert(options?.signal instanceof AbortSignal);
    return keyFetcher()(input, options);
  }) as typeof fetch;
  const signed = await token({}, { jku: "https://attacker.example/keys" });
  await verifyCognitoIdToken(signed, { issuer, clientId, nonce, now, fetcher });
  await verifyCognitoIdToken(signed, { issuer, clientId, nonce, now, fetcher });
  assert(urls.length === 1, "The public keys should be reused until expiry");
  assert(urls[0] === `${issuer}/.well-known/jwks.json`);
});

Deno.test("rejects an untrusted issuer configuration before fetching keys", async () => {
  let fetched = false;
  const fetcher = (() => {
    fetched = true;
    return Promise.resolve(Response.json({ keys: [] }));
  }) as typeof fetch;
  await assertRejects(async () => {
    await verifyCognitoIdToken(await token(), {
      issuer: "https://attacker.example/pool",
      clientId,
      nonce,
      now,
      fetcher,
    });
  });
  assert(!fetched);
});

Deno.test("rejects malformed, duplicate, weak, or excessive JWKS keys", async (test) => {
  const key = { ...publicKey, alg: "RS256", kid: "key-1", use: "sig" };
  const documents = [
    { keys: [] },
    { keys: [key, key] },
    { keys: [{ ...key, n: "AQAB" }] },
    { keys: [{ ...key, alg: "HS256" }] },
    { keys: Array.from({ length: 21 }, () => key) },
  ];
  const signed = await token();
  for (const [index, document] of documents.entries()) {
    await test.step(String(index), async () => {
      await assertRejects(() =>
        verifyCognitoIdToken(signed, {
          issuer,
          clientId,
          nonce,
          now,
          fetcher: keyFetcher(document),
        })
      );
    });
  }
});

Deno.test("bounds streamed JWKS responses even without content-length", async () => {
  const fetcher = (() => {
    return Promise.resolve(new Response(" ".repeat(65_537)));
  }) as typeof fetch;
  const signed = await token();
  await assertRejects(() =>
    verifyCognitoIdToken(signed, { issuer, clientId, nonce, now, fetcher })
  );
});

Deno.test("supports missing optional profile fields without trusting an unverified email", async () => {
  const identity = await verifyCognitoIdToken(
    await token({
      name: undefined,
      email: undefined,
      email_verified: false,
      picture: "javascript:alert(1)",
    }),
    { issuer, clientId, nonce, now, fetcher: keyFetcher() },
  );
  assert(identity.name === "");
  assert(identity.email === null);
  assert(identity.emailVerified === false);
  assert(identity.picture === null);
});
