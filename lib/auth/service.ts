import type { AuthConfig } from "./config.ts";
import { requestOrigin, safeReturnTo } from "./config.ts";
import { isRandomToken, randomToken, sha256 } from "./crypto.ts";
import { verifyCognitoIdToken } from "./oidc.ts";
import { type AuthStore, type PublicUser, publicUser } from "./types.ts";

export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

export function notFound(): Response {
  // The same response is used for missing, stale, and insufficient authorization.
  return new Response("Not Found", {
    status: 404,
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export class AuthService {
  constructor(
    readonly config: AuthConfig,
    private store: AuthStore,
    private fetcher: typeof fetch = fetch,
    private verifyIdentity: typeof verifyCognitoIdToken = verifyCognitoIdToken,
    private clock: () => number = () => Math.floor(Date.now() / 1000),
  ) {}

  async signIn(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") ?? "Google";
    if (!this.config.providers.some((id) => id === provider)) return notFound();
    const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
    // Start on a registered origin before binding the OAuth cookie and callback.
    if (!this.config.allowedOrigins.includes(url.origin)) {
      const canonical = new URL("/auth/signin", this.config.origin);
      canonical.search = new URLSearchParams({ provider, returnTo }).toString();
      return new Response(null, {
        status: 303,
        headers: { ...PRIVATE_HEADERS, Location: canonical.href },
      });
    }
    const origin = requestOrigin(request, this.config);
    const state = randomToken();
    const browser = randomToken();
    const verifier = randomToken();
    const nonce = randomToken();
    const redirectUri = `${origin}/auth/callback`;
    await this.store.putTransaction(await sha256(state), {
      browserHash: await sha256(browser),
      verifier,
      nonce,
      returnTo,
      redirectUri,
      expiresAt: this.clock() + 600,
    });
    const authorize = new URL("/oauth2/authorize", this.config.domain);
    authorize.search = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: "openid email profile",
      identity_provider: provider,
      state,
      nonce,
      code_challenge: await sha256(verifier),
      code_challenge_method: "S256",
    }).toString();
    const headers = new Headers({
      ...PRIVATE_HEADERS,
      Location: authorize.href,
    });
    headers.append("Set-Cookie", cookie(request, "oauth", browser, 600));
    return new Response(null, { status: 303, headers });
  }

  async callback(request: Request): Promise<Response> {
    requestOrigin(request, this.config);
    const url = new URL(request.url);
    const state = url.searchParams.get("state");
    const browser = readCookie(request, "oauth");
    if (!isRandomToken(state) || !isRandomToken(browser)) {
      return this.callbackError(request);
    }
    const transaction = await this.store.consumeTransaction(
      await sha256(state),
      await sha256(browser),
      this.clock(),
    );
    if (
      !transaction || transaction.redirectUri !== `${url.origin}/auth/callback`
    ) return this.callbackError(request);
    if (url.searchParams.has("error")) {
      return this.callbackError(request, "cancelled");
    }
    const code = url.searchParams.get("code");
    if (
      !code || code.length > 4096 ||
      Array.from(code).some((character) =>
        character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127
      )
    ) {
      return this.callbackError(request);
    }
    const tokenResponse = await this.fetcher(
      new URL("/oauth2/token", this.config.domain),
      {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${
            btoa(`${this.config.clientId}:${this.config.clientSecret}`)
          }`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: this.config.clientId,
          code,
          redirect_uri: transaction.redirectUri,
          code_verifier: transaction.verifier,
        }),
      },
    );
    if (!tokenResponse.ok) {
      await tokenResponse.body?.cancel();
      return this.callbackError(request);
    }
    // Provider tokens stay in memory only; no refresh tokens, JWTs, or tags reach the browser.
    const tokenText = await boundedTokenResponse(tokenResponse);
    const tokens = JSON.parse(tokenText);
    if (typeof tokens.id_token !== "string") return this.callbackError(request);
    const now = this.clock();
    const identity = await this.verifyIdentity(tokens.id_token, {
      issuer: this.config.issuer,
      clientId: this.config.clientId,
      nonce: transaction.nonce,
      now,
    });
    const userId = await sha256(
      `${this.config.issuer}\u0000${identity.subject}`,
    );
    await this.store.upsertUser(userId, identity, now);
    // Always rotate the application session after sign-in; never key users by email.
    const oldSession = readCookie(request, "session");
    if (isRandomToken(oldSession)) {
      await this.store.deleteSession(await sha256(oldSession));
    }
    const session = randomToken();
    await this.store.putSession(await sha256(session), {
      userId,
      authenticatedAt: identity.authenticatedAt,
      expiresAt: now + this.config.sessionSeconds,
    });
    const headers = new Headers({
      ...PRIVATE_HEADERS,
      Location: safeReturnTo(transaction.returnTo),
    });
    headers.append(
      "Set-Cookie",
      cookie(request, "session", session, this.config.sessionSeconds),
    );
    headers.append("Set-Cookie", cookie(request, "oauth", "", 0));
    return new Response(null, { status: 303, headers });
  }

  private callbackError(request: Request, error = "failed"): Response {
    const headers = new Headers({
      ...PRIVATE_HEADERS,
      Location: `/login?error=${error}`,
    });
    headers.append("Set-Cookie", cookie(request, "oauth", "", 0));
    return new Response(null, { status: 303, headers });
  }

  async currentUser(request: Request): Promise<PublicUser | null> {
    const session = await this.session(request);
    if (!session) return null;
    const user = await this.store.getUser(session.userId);
    return user ? publicUser(user) : null;
  }

  async hasAccess(
    request: Request,
    tags: readonly string[],
    maxAgeSeconds = this.config.recentSeconds,
  ): Promise<boolean> {
    // An empty/malformed policy must never accidentally expose a new private route.
    if (
      !tags.length ||
      tags.some((tag) => !/^[a-z0-9][a-z0-9:_-]{0,63}$/.test(tag)) ||
      !Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds < 1 ||
      maxAgeSeconds > this.config.recentSeconds
    ) return false;
    const session = await this.session(request);
    if (!session || this.clock() - session.authenticatedAt > maxAgeSeconds) {
      return false;
    }
    const user = await this.store.getUser(session.userId);
    return !!user && tags.every((tag) => user.accessTags.includes(tag));
  }

  private async session(request: Request) {
    const sessionId = readCookie(request, "session");
    if (!isRandomToken(sessionId)) return null;
    const session = await this.store.getSession(await sha256(sessionId));
    const now = this.clock();
    if (
      !session || session.expiresAt <= now || session.authenticatedAt > now ||
      session.authenticatedAt < 0
    ) return null;
    return session;
  }

  async logout(request: Request): Promise<Response> {
    const origin = requestOrigin(request, this.config);
    // A plain HTML POST is same-origin. Cross-site forms cannot sign the visitor out.
    if (request.method !== "POST" || request.headers.get("origin") !== origin) {
      return new Response("Forbidden", {
        status: 403,
        headers: PRIVATE_HEADERS,
      });
    }
    const session = readCookie(request, "session");
    if (isRandomToken(session)) {
      await this.store.deleteSession(await sha256(session));
    }
    const logout = new URL("/logout", this.config.domain);
    logout.search = new URLSearchParams({
      client_id: this.config.clientId,
      logout_uri: `${origin}/`,
    }).toString();
    const headers = new Headers({ ...PRIVATE_HEADERS, Location: logout.href });
    headers.append("Set-Cookie", cookie(request, "session", "", 0));
    headers.append("Set-Cookie", cookie(request, "oauth", "", 0));
    return new Response(null, { status: 303, headers });
  }
}

function cookieName(request: Request, kind: "session" | "oauth"): string {
  return `${
    new URL(request.url).protocol === "https:" ? "__Host-" : ""
  }tejas-${kind}`;
}

function cookie(
  request: Request,
  kind: "session" | "oauth",
  value: string,
  maxAge: number,
): string {
  const secure = new URL(request.url).protocol === "https:";
  return `${
    cookieName(request, kind)
  }=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
    secure ? "; Secure" : ""
  }`;
}

export function readCookie(
  request: Request,
  kind: "session" | "oauth",
): string | undefined {
  const name = cookieName(request, kind);
  const values = (request.headers.get("cookie") ?? "").split(";").map((part) =>
    part.trim()
  ).filter((part) => part.startsWith(`${name}=`));
  // Ambiguous duplicate cookies are rejected instead of choosing attacker-controlled order.
  return values.length === 1 ? values[0].slice(name.length + 1) : undefined;
}

async function boundedTokenResponse(response: Response): Promise<string> {
  if (!response.body) throw new Error("Missing authentication response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 65536) {
        await reader.cancel();
        throw new Error("Authentication response too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
