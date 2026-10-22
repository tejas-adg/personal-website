import type { AuthConfig } from "./config.ts";
import { randomToken, sha256 } from "./crypto.ts";
import { AuthService, notFound, readCookie } from "./service.ts";
import {
  type AuthStore,
  type Identity,
  type OAuthTransaction,
  type PublicUser,
  publicUser,
  type SessionRecord,
  type UserRecord,
} from "./types.ts";

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

class MemoryStore implements AuthStore {
  readonly transactions = new Map<string, OAuthTransaction>();
  readonly users = new Map<string, UserRecord>();
  readonly sessions = new Map<string, SessionRecord>();
  readonly deletedSessions: string[] = [];

  putTransaction(key: string, transaction: OAuthTransaction): Promise<void> {
    this.transactions.set(key, transaction);
    return Promise.resolve();
  }

  consumeTransaction(
    key: string,
    browserHash: string,
    now: number,
  ): Promise<OAuthTransaction | null> {
    const transaction = this.transactions.get(key);
    if (
      !transaction || transaction.browserHash !== browserHash ||
      transaction.expiresAt <= now
    ) return Promise.resolve(null);
    this.transactions.delete(key);
    return Promise.resolve(transaction);
  }

  upsertUser(
    id: string,
    identity: Identity,
    _now: number,
  ): Promise<PublicUser> {
    const user: UserRecord = {
      id,
      subject: identity.subject,
      name: identity.name,
      email: identity.email,
      emailVerified: identity.emailVerified,
      picture: identity.picture,
      accessTags: this.users.get(id)?.accessTags ?? [],
    };
    this.users.set(id, user);
    return Promise.resolve(publicUser(user));
  }

  getUser(id: string): Promise<UserRecord | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  putSession(key: string, session: SessionRecord): Promise<void> {
    this.sessions.set(key, session);
    return Promise.resolve();
  }

  getSession(key: string): Promise<SessionRecord | null> {
    return Promise.resolve(this.sessions.get(key) ?? null);
  }

  deleteSession(key: string): Promise<void> {
    this.deletedSessions.push(key);
    this.sessions.delete(key);
    return Promise.resolve();
  }
}

const origin = "https://tejasam.com";
const startingTime = 1_800_000_000;

function fixture() {
  const config: AuthConfig = {
    origin,
    allowedOrigins: [origin, "http://localhost:5173"],
    region: "us-east-2",
    tableName: "test-auth",
    storeEndpoint: "https://abcdefghijklmnop.lambda-url.us-east-2.on.aws/",
    storeSecret: "a".repeat(43),
    issuer: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_Test123",
    clientId: "testclient123",
    clientSecret: "server-only-test-secret",
    domain: "https://test-auth.auth.us-east-2.amazoncognito.com",
    sessionSeconds: 28_800,
    recentSeconds: 900,
    providers: ["Google", "LoginWithAmazon", "Facebook"],
  };
  const clock = { now: startingTime };
  const store = new MemoryStore();
  const fetchCalls: { url: string; init: RequestInit | undefined }[] = [];
  const verifyCalls: {
    token: string;
    options: { issuer: string; clientId: string; nonce: string; now?: number };
  }[] = [];
  const identity: Identity = {
    subject: "immutable-cognito-subject",
    name: "Example Person",
    email: "person@example.com",
    emailVerified: true,
    picture: null,
    authenticatedAt: startingTime,
  };
  const response = {
    status: 200,
    body: JSON.stringify({
      id_token: "provider-id-token",
      access_token: "provider-access-token",
      refresh_token: "provider-refresh-token",
    }),
  };
  const fetcher: typeof fetch = (input, init) => {
    fetchCalls.push({ url: String(input), init });
    return Promise.resolve(
      new Response(response.body, {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };
  const verify = (
    token: string,
    options: { issuer: string; clientId: string; nonce: string; now?: number },
  ) => {
    verifyCalls.push({ token, options });
    return Promise.resolve({ ...identity });
  };
  const service = new AuthService(
    config,
    store,
    fetcher,
    verify,
    () => clock.now,
  );
  return {
    config,
    clock,
    store,
    service,
    fetchCalls,
    verifyCalls,
    identity,
    response,
  };
}

type Fixture = ReturnType<typeof fixture>;

function cookiePair(response: Response, kind: "session" | "oauth"): string {
  const value = response.headers.getSetCookie().find((header) =>
    header.startsWith(`__Host-tejas-${kind}=`) ||
    header.startsWith(`tejas-${kind}=`)
  );
  assert(value, `Missing ${kind} cookie`);
  return value.split(";", 1)[0];
}

async function begin(
  test: Fixture,
  returnTo = "/account",
  requestOrigin = origin,
) {
  const response = await test.service.signIn(
    new Request(
      `${requestOrigin}/auth/signin?` +
        new URLSearchParams({ provider: "Google", returnTo }),
    ),
  );
  equal(response.status, 303);
  const authorize = new URL(response.headers.get("location")!);
  const state = authorize.searchParams.get("state")!;
  const browserCookie = cookiePair(response, "oauth");
  const transaction = test.store.transactions.get(await sha256(state));
  assert(transaction, "OAuth transaction was not stored under the state hash");
  return { response, authorize, state, browserCookie, transaction };
}

function callbackRequest(
  flow: Awaited<ReturnType<typeof begin>>,
  extraCookie?: string,
) {
  return new Request(
    `${flow.transaction.redirectUri}?` +
      new URLSearchParams({ state: flow.state, code: "authorization-code" }),
    {
      headers: {
        Cookie: [flow.browserCookie, extraCookie].filter(Boolean).join("; "),
      },
    },
  );
}

async function signedIn(test: Fixture) {
  const flow = await begin(test);
  const callback = await test.service.callback(callbackRequest(flow));
  equal(callback.status, 303);
  const sessionCookie = cookiePair(callback, "session");
  const request = new Request(`${origin}/future-private-content`, {
    headers: { Cookie: sessionCookie },
  });
  const userId = await sha256(
    `${test.config.issuer}\u0000${test.identity.subject}`,
  );
  return { flow, callback, sessionCookie, request, userId };
}

Deno.test("sign-in binds state to the browser and sends PKCE and nonce", async () => {
  const test = fixture();
  const flow = await begin(test, "/archives?view=members");
  const params = flow.authorize.searchParams;
  equal(flow.authorize.origin, test.config.domain);
  equal(flow.authorize.pathname, "/oauth2/authorize");
  equal(params.get("response_type"), "code");
  equal(params.get("identity_provider"), "Google");
  equal(params.get("scope"), "openid email profile");
  equal(params.get("redirect_uri"), `${origin}/auth/callback`);
  equal(params.get("code_challenge_method"), "S256");
  equal(params.get("code_challenge"), await sha256(flow.transaction.verifier));
  equal(params.get("nonce"), flow.transaction.nonce);
  equal(flow.transaction.returnTo, "/archives?view=members");
  equal(flow.transaction.expiresAt, startingTime + 600);
  equal(
    flow.transaction.browserHash,
    await sha256(flow.browserCookie.split("=", 2)[1]),
  );
  assert(
    !test.store.transactions.has(flow.state),
    "Raw state must not be a key",
  );
  equal(test.fetchCalls.length, 0);
});

Deno.test("successful callback exchanges once, verifies nonce, rotates and hashes the session", async () => {
  const test = fixture();
  const oldToken = randomToken();
  const oldKey = await sha256(oldToken);
  await test.store.putSession(oldKey, {
    userId: "old-user",
    authenticatedAt: startingTime - 10,
    expiresAt: startingTime + 100,
  });
  const flow = await begin(test, "/archives?view=members");
  const response = await test.service.callback(
    callbackRequest(flow, `__Host-tejas-session=${oldToken}`),
  );
  equal(response.status, 303);
  equal(response.headers.get("location"), "/archives?view=members");
  equal(await response.text(), "");
  equal(test.fetchCalls.length, 1);
  const call = test.fetchCalls[0];
  equal(call.url, `${test.config.domain}/oauth2/token`);
  equal(call.init?.method, "POST");
  equal(call.init?.redirect, "error");
  const body = new URLSearchParams(call.init?.body as URLSearchParams);
  equal(body.get("grant_type"), "authorization_code");
  equal(body.get("code_verifier"), flow.transaction.verifier);
  equal(body.get("redirect_uri"), flow.transaction.redirectUri);
  const tokenHeaders = new Headers(call.init?.headers);
  equal(
    tokenHeaders.get("authorization"),
    `Basic ${btoa(`${test.config.clientId}:${test.config.clientSecret}`)}`,
  );
  equal(test.verifyCalls, [{
    token: "provider-id-token",
    options: {
      issuer: test.config.issuer,
      clientId: test.config.clientId,
      nonce: flow.transaction.nonce,
      now: startingTime,
    },
  }]);
  assert(!test.store.sessions.has(oldKey), "Old session must be revoked");
  equal(test.store.deletedSessions, [oldKey]);
  const sessionCookie = cookiePair(response, "session");
  const sessionToken = sessionCookie.split("=", 2)[1];
  assert(sessionToken !== oldToken, "Sign-in must rotate the cookie");
  assert(
    !test.store.sessions.has(sessionToken),
    "Raw session ID must not be stored",
  );
  const session = test.store.sessions.get(await sha256(sessionToken));
  assert(session);
  equal(session.authenticatedAt, startingTime);
  equal(session.expiresAt, startingTime + test.config.sessionSeconds);
  const user = test.store.users.get(session.userId);
  assert(user);
  equal(user.accessTags, []);
  const cookies = response.headers.getSetCookie().join("\n");
  for (
    const secret of [
      "provider-id-token",
      "provider-access-token",
      "provider-refresh-token",
      test.config.clientSecret,
      "accessTags",
    ]
  ) assert(!cookies.includes(secret), "Provider data leaked into a cookie");
  assert(cookies.includes("__Host-tejas-oauth=;"));
  const replay = await test.service.callback(callbackRequest(flow));
  equal(replay.headers.get("location"), "/login?error=failed");
  equal(
    test.fetchCalls.length,
    1,
    "Consumed state must not exchange a second time",
  );
});

Deno.test("callback rejects a different state or browser before token exchange", async () => {
  const test = fixture();
  const flow = await begin(test);
  for (
    const [state, browserCookie] of [
      [randomToken(), flow.browserCookie],
      [flow.state, `__Host-tejas-oauth=${randomToken()}`],
      [flow.state, ""],
      [flow.state, `${flow.browserCookie}; ${flow.browserCookie}`],
      ["not-a-random-state", flow.browserCookie],
    ]
  ) {
    const response = await test.service.callback(
      new Request(
        `${flow.transaction.redirectUri}?` +
          new URLSearchParams({ state, code: "authorization-code" }),
        { headers: { Cookie: browserCookie } },
      ),
    );
    equal(response.status, 303);
    equal(response.headers.get("location"), "/login?error=failed");
    equal(test.fetchCalls.length, 0);
  }
  assert(test.store.transactions.has(await sha256(flow.state)));
  const correct = await test.service.callback(callbackRequest(flow));
  equal(correct.headers.get("location"), "/account");
  equal(test.fetchCalls.length, 1);
});

Deno.test("expired OAuth transactions cannot exchange a code", async () => {
  const test = fixture();
  const flow = await begin(test);
  test.clock.now += 600;
  const response = await test.service.callback(callbackRequest(flow));
  equal(response.headers.get("location"), "/login?error=failed");
  equal(test.fetchCalls.length, 0);
  equal(test.store.sessions.size, 0);
});

Deno.test("provider cancellation consumes the transaction without exchanging tokens", async () => {
  const test = fixture();
  const flow = await begin(test);
  const response = await test.service.callback(
    new Request(
      `${flow.transaction.redirectUri}?` +
        new URLSearchParams({ state: flow.state, error: "access_denied" }),
      { headers: { Cookie: flow.browserCookie } },
    ),
  );
  equal(response.headers.get("location"), "/login?error=cancelled");
  equal(test.store.transactions.size, 0);
  equal(test.fetchCalls.length, 0);
});

Deno.test("missing or malformed authorization codes cannot be exchanged", async () => {
  for (
    const code of ["", "code with spaces", "line\nbreak", "a".repeat(4097)]
  ) {
    const test = fixture();
    const flow = await begin(test);
    const response = await test.service.callback(
      new Request(
        `${flow.transaction.redirectUri}?` +
          new URLSearchParams({ state: flow.state, code }),
        { headers: { Cookie: flow.browserCookie } },
      ),
    );
    equal(response.headers.get("location"), "/login?error=failed");
    equal(test.fetchCalls.length, 0);
    equal(test.store.sessions.size, 0);
  }
});

Deno.test("failed token exchange cannot create a session", async () => {
  const test = fixture();
  test.response.status = 400;
  test.response.body = JSON.stringify({ error: "invalid_grant" });
  const flow = await begin(test);
  const response = await test.service.callback(callbackRequest(flow));
  equal(response.headers.get("location"), "/login?error=failed");
  equal(test.verifyCalls.length, 0);
  equal(test.store.sessions.size, 0);
  equal(test.store.users.size, 0);
});

Deno.test("currentUser returns only public profile fields even after tags are assigned", async () => {
  const test = fixture();
  const login = await signedIn(test);
  const user = test.store.users.get(login.userId)!;
  test.store.users.set(login.userId, {
    ...user,
    accessTags: ["member", "private-editor"],
  });
  const result = await test.service.currentUser(login.request);
  equal(result, {
    id: login.userId,
    name: "Example Person",
    email: "person@example.com",
    picture: null,
  });
  assert(!JSON.stringify(result).includes("accessTags"));
  assert(!JSON.stringify(result).includes("private-editor"));
  assert(!JSON.stringify(result).includes("subject"));
  assert(!JSON.stringify(result).includes("emailVerified"));
});

Deno.test("matching email addresses never merge distinct provider subjects", async () => {
  const test = fixture();
  const first = await signedIn(test);
  test.identity.subject = "another-immutable-cognito-subject";
  const second = await signedIn(test);
  assert(first.userId !== second.userId);
  equal(test.store.users.size, 2);
  equal(
    test.store.users.get(first.userId)?.email,
    test.store.users.get(second.userId)?.email,
  );
});

Deno.test("callback preserves the provider authentication time instead of resetting recency", async () => {
  const test = fixture();
  test.identity.authenticatedAt = startingTime - 901;
  const login = await signedIn(test);
  const session = [...test.store.sessions.values()][0];
  equal(session.authenticatedAt, startingTime - 901);
  test.store.users.set(login.userId, {
    ...test.store.users.get(login.userId)!,
    accessTags: ["member"],
  });
  equal(await test.service.hasAccess(login.request, ["member"]), false);
  assert(await test.service.currentUser(login.request));
});

Deno.test("protected access requires every live tag and revocation takes effect immediately", async () => {
  const test = fixture();
  const login = await signedIn(test);
  equal(await test.service.hasAccess(login.request, ["member"]), false);
  const user = test.store.users.get(login.userId)!;
  test.store.users.set(login.userId, {
    ...user,
    accessTags: ["member", "editor"],
  });
  equal(await test.service.hasAccess(login.request, ["member"]), true);
  equal(
    await test.service.hasAccess(login.request, ["member", "editor"]),
    true,
  );
  equal(
    await test.service.hasAccess(login.request, ["member", "owner"]),
    false,
  );
  test.store.users.set(login.userId, { ...user, accessTags: ["member"] });
  equal(
    await test.service.hasAccess(login.request, ["member", "editor"]),
    false,
  );
  equal(
    test.fetchCalls.length,
    1,
    "Access checks must not refresh provider tokens",
  );
});

Deno.test("stale authentication denies private content without refreshing its age", async () => {
  const test = fixture();
  const login = await signedIn(test);
  const user = test.store.users.get(login.userId)!;
  test.store.users.set(login.userId, { ...user, accessTags: ["member"] });
  test.clock.now += 900;
  equal(await test.service.hasAccess(login.request, ["member"]), true);
  test.clock.now += 1;
  equal(await test.service.hasAccess(login.request, ["member"]), false);
  assert(
    await test.service.currentUser(login.request),
    "A stale login can still show its own profile",
  );
  const session = [...test.store.sessions.values()][0];
  equal(
    session.authenticatedAt,
    startingTime,
    "Profile reads must not extend authentication age",
  );
});

Deno.test("expired sessions, deleted users, and missing cookies never authorize", async () => {
  const test = fixture();
  const login = await signedIn(test);
  const user = test.store.users.get(login.userId)!;
  test.store.users.set(login.userId, { ...user, accessTags: ["member"] });
  equal(
    await test.service.hasAccess(new Request(`${origin}/private`), ["member"]),
    false,
  );
  equal(await test.service.currentUser(new Request(`${origin}/account`)), null);
  const duplicate = new Request(`${origin}/private`, {
    headers: { Cookie: `${login.sessionCookie}; ${login.sessionCookie}` },
  });
  equal(await test.service.hasAccess(duplicate, ["member"]), false);
  const invalid = new Request(`${origin}/private`, {
    headers: { Cookie: "__Host-tejas-session=attacker-chosen" },
  });
  equal(await test.service.hasAccess(invalid, ["member"]), false);
  test.store.users.delete(login.userId);
  equal(await test.service.hasAccess(login.request, ["member"]), false);
  equal(await test.service.currentUser(login.request), null);
  test.store.users.set(login.userId, user);
  test.clock.now = startingTime + test.config.sessionSeconds;
  equal(await test.service.hasAccess(login.request, ["member"]), false);
  equal(await test.service.currentUser(login.request), null);
});

Deno.test("empty or malformed authorization policies stay closed", async () => {
  const test = fixture();
  const login = await signedIn(test);
  test.store.users.set(login.userId, {
    ...test.store.users.get(login.userId)!,
    accessTags: ["member"],
  });
  for (
    const tags of [[], ["Member"], [""], ["member role"], ["a".repeat(65)]]
  ) {
    equal(await test.service.hasAccess(login.request, tags), false);
  }
  for (const maxAge of [0, -1, 901, 1.5, NaN, Infinity]) {
    equal(
      await test.service.hasAccess(login.request, ["member"], maxAge),
      false,
    );
  }
  equal(await test.service.hasAccess(login.request, ["member"], 60), true);
});

Deno.test("sessions with a future authentication time are rejected", async () => {
  const test = fixture();
  const login = await signedIn(test);
  const sessionKey = [...test.store.sessions.keys()][0];
  const session = test.store.sessions.get(sessionKey)!;
  test.store.sessions.set(sessionKey, {
    ...session,
    authenticatedAt: test.clock.now + 1,
  });
  equal(await test.service.currentUser(login.request), null);
  equal(await test.service.hasAccess(login.request, ["member"]), false);
});

Deno.test("logout requires a same-origin POST and revokes the session", async () => {
  const test = fixture();
  const login = await signedIn(test);
  for (
    const [method, requestOrigin] of [
      ["GET", origin],
      ["POST", "https://attacker.example"],
      ["POST", ""],
    ]
  ) {
    const response = await test.service.logout(
      new Request(`${origin}/auth/logout`, {
        method,
        headers: { Cookie: login.sessionCookie, Origin: requestOrigin },
      }),
    );
    equal(response.status, 403);
    equal(test.store.sessions.size, 1);
    equal(response.headers.getSetCookie(), []);
  }
  const response = await test.service.logout(
    new Request(`${origin}/auth/logout`, {
      method: "POST",
      headers: { Cookie: login.sessionCookie, Origin: origin },
    }),
  );
  equal(response.status, 303);
  equal(test.store.sessions.size, 0);
  equal(await test.service.currentUser(login.request), null);
  const redirect = new URL(response.headers.get("location")!);
  equal(redirect.origin, test.config.domain);
  equal(redirect.pathname, "/logout");
  equal(redirect.searchParams.get("logout_uri"), `${origin}/`);
  equal(redirect.searchParams.get("client_id"), test.config.clientId);
  const cookies = response.headers.getSetCookie();
  equal(cookies.length, 2);
  assert(cookies.every((value) => value.includes("Max-Age=0")));
  assert(
    cookies.every((value) =>
      value.includes("HttpOnly") && value.includes("Secure")
    ),
  );
});

Deno.test("HTTPS cookies use the Host prefix, Secure, HttpOnly and no domain", async () => {
  const test = fixture();
  const login = await signedIn(test);
  for (const response of [login.flow.response, login.callback]) {
    equal(response.headers.get("cache-control"), "private, no-store");
    equal(response.headers.get("referrer-policy"), "no-referrer");
    for (const header of response.headers.getSetCookie()) {
      assert(header.startsWith("__Host-tejas-"));
      assert(header.includes("; Secure"));
      assert(header.includes("; HttpOnly"));
      assert(header.includes("; SameSite=Lax"));
      assert(header.includes("; Path=/"));
      assert(!/domain=/i.test(header));
    }
  }
});

Deno.test("only the explicitly allowed localhost origin uses development cookies", async () => {
  const test = fixture();
  const flow = await begin(test, "/account", "http://localhost:5173");
  assert(flow.browserCookie.startsWith("tejas-oauth="));
  assert(!flow.response.headers.getSetCookie()[0].includes("; Secure"));
  equal(flow.authorize.origin, test.config.domain);
  equal(
    flow.authorize.searchParams.get("redirect_uri"),
    "http://localhost:5173/auth/callback",
  );
  equal(flow.transaction.redirectUri, "http://localhost:5173/auth/callback");
});

Deno.test("unregistered sign-in origins redirect to the canonical origin before storing or setting cookies", async () => {
  for (
    const alias of [
      "https://www.tejasam.com",
      "https://personal-website.example.deno.dev",
      "http://attacker.example",
    ]
  ) {
    const test = fixture();
    const response = await test.service.signIn(
      new Request(
        `${alias}/auth/signin?` + new URLSearchParams({
          provider: "Google",
          returnTo: "/archives?view=members#ignored",
          redirect_uri: "https://attacker.example/callback",
          client_id: "attacker-client",
          state: "attacker-state",
          nonce: "attacker-nonce",
        }),
      ),
    );
    equal(response.status, 303);
    const redirect = new URL(response.headers.get("location")!);
    equal(redirect.origin, origin);
    equal(redirect.pathname, "/auth/signin");
    equal([...redirect.searchParams], [
      ["provider", "Google"],
      ["returnTo", "/archives?view=members"],
    ]);
    equal(redirect.hash, "");
    equal(response.headers.getSetCookie(), []);
    equal(response.headers.get("cache-control"), "private, no-store");
    equal(test.store.transactions.size, 0);
    equal(test.store.sessions.size, 0);
    equal(test.store.users.size, 0);
    equal(test.fetchCalls.length, 0);
    equal(test.verifyCalls.length, 0);

    // Following the redirect binds a fresh transaction to the registered host.
    const canonicalResponse = await test.service.signIn(new Request(redirect));
    equal(canonicalResponse.status, 303);
    equal(test.store.transactions.size, 1);
    equal(
      [...test.store.transactions.values()][0].redirectUri,
      `${origin}/auth/callback`,
    );
    assert(cookiePair(canonicalResponse, "oauth").startsWith("__Host-"));
  }
});

Deno.test("alias sign-in forwards only configured providers and safe local return URLs", async () => {
  const test = fixture();
  test.config.providers = ["Google"];
  for (const provider of ["Facebook", "Unknown", "constructor"]) {
    const response = await test.service.signIn(
      new Request(
        `https://www.tejasam.com/auth/signin?` +
          new URLSearchParams({ provider, returnTo: "/account" }),
      ),
    );
    equal(response.status, 404);
    equal(response.headers.get("location"), null);
    equal(response.headers.getSetCookie(), []);
  }
  for (
    const returnTo of [
      "https://attacker.example/private",
      "//attacker.example/private",
      "/\\attacker.example/private",
      "/auth/signin",
    ]
  ) {
    const response = await test.service.signIn(
      new Request(
        `https://www.tejasam.com/auth/signin?` +
          new URLSearchParams({ returnTo }),
      ),
    );
    equal(response.status, 303);
    equal(
      response.headers.get("location"),
      `${origin}/auth/signin?provider=Google&returnTo=%2Faccount`,
    );
    equal(response.headers.getSetCookie(), []);
  }
  equal(test.store.transactions.size, 0);
});

Deno.test("callback and logout still reject unregistered origins without side effects", async () => {
  const test = fixture();
  const login = await signedIn(test);
  const fetchCount = test.fetchCalls.length;
  for (const action of ["callback", "logout"] as const) {
    let rejected = false;
    try {
      const request = new Request(`https://www.tejasam.com/auth/${action}`, {
        method: action === "logout" ? "POST" : "GET",
        headers: {
          Cookie: login.sessionCookie,
          Origin: "https://www.tejasam.com",
        },
      });
      await test.service[action](request);
    } catch {
      rejected = true;
    }
    assert(rejected, `${action} must retain its exact registered-origin check`);
  }
  equal(test.store.sessions.size, 1);
  equal(test.store.deletedSessions.length, 0);
  equal(test.fetchCalls.length, fetchCount);
});

Deno.test("unknown or disabled providers return the same private 404", async () => {
  const test = fixture();
  test.config.providers = ["Google"];
  for (const provider of ["Facebook", "COGNITO", "Unknown"]) {
    const response = await test.service.signIn(
      new Request(`${origin}/auth/signin?provider=${provider}`),
    );
    equal(response.status, 404);
    equal(await response.text(), "Not Found");
    equal(response.headers.get("location"), null);
    equal(response.headers.get("cache-control"), "private, no-store");
  }
  equal(test.store.transactions.size, 0);
  const response = notFound();
  equal(response.status, 404);
  equal(await response.text(), "Not Found");
});

Deno.test("untrusted return URLs are normalized before the authentication round trip", async () => {
  for (
    const returnTo of [
      "https://attacker.example/private",
      "//attacker.example/private",
      "/\\attacker.example/private",
      "/auth/signin",
    ]
  ) {
    const test = fixture();
    const flow = await begin(test, returnTo);
    equal(flow.transaction.returnTo, "/account");
    const response = await test.service.callback(callbackRequest(flow));
    equal(response.headers.get("location"), "/account");
  }
});

Deno.test("cookie parsing rejects duplicate names and ignores misleading prefixes", () => {
  const request = new Request(`${origin}/account`, {
    headers: {
      Cookie:
        "unrelated=1; __Host-tejas-session-other=bad; __Host-tejas-session=good",
    },
  });
  equal(readCookie(request, "session"), "good");
  const duplicate = new Request(`${origin}/account`, {
    headers: {
      Cookie: "__Host-tejas-session=first; __Host-tejas-session=second",
    },
  });
  equal(readCookie(duplicate, "session"), undefined);
});
