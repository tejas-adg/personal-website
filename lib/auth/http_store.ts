import { safeReturnTo } from "./config.ts";
import { base64Url, isRandomToken, randomToken } from "./crypto.ts";
import {
  type AuthStore,
  type Identity,
  type OAuthTransaction,
  type PublicUser,
  publicUser,
  type SessionRecord,
  type UserRecord,
} from "./types.ts";

const MAX_RESPONSE_BYTES = 65_536;
const MAX_QUEUED_CALLS = 32;
const MAX_ATTEMPTS = 4;
const encoder = new TextEncoder();
const unavailableMessage = "Authentication storage is unavailable";

function unavailable(): never {
  throw new Error(unavailableMessage);
}

interface TransportOptions {
  /** Tests may shorten the budget, but production can never exceed ten seconds. */
  timeoutMs?: number;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
  jitter?: () => number;
}

function beforeAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const aborted = () => reject(new Error(unavailableMessage));
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted();
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", aborted);
    });
  });
}

function pause(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const aborted = () => {
      clearTimeout(timer);
      reject(new Error(unavailableMessage));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", aborted);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted();
  });
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(
  value: unknown,
  maximum: number,
  nonempty = false,
): value is string {
  return typeof value === "string" && value.length <= maximum &&
    (!nonempty || value.length > 0) &&
    !Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    });
}

function timestamp(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function token(value: unknown): value is string {
  return typeof value === "string" && isRandomToken(value);
}

function profile(value: unknown, expectedId: string): PublicUser {
  if (
    !record(value) || value.id !== expectedId || !isRandomToken(value.id) ||
    !text(value.name, 512) ||
    (value.email !== null && !text(value.email, 320)) ||
    (value.picture !== null && !picture(value.picture))
  ) return unavailable();
  // Never spread an RPC result into browser-visible profile data.
  return publicUser({
    id: value.id,
    name: value.name,
    email: value.email as string | null,
    picture: value.picture as string | null,
  });
}

function picture(value: unknown): value is string {
  if (!text(value, 2_048, true)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function redirectUri(value: unknown): value is string {
  if (!text(value, 2_048, true)) return false;
  try {
    const url = new URL(value);
    const secure = url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
    return secure && url.pathname === "/auth/callback" && !url.search &&
      !url.hash && !url.username && !url.password;
  } catch {
    return false;
  }
}

async function responseJson(response: Response): Promise<unknown> {
  const type = response.headers.get("content-type")?.split(";", 1)[0].trim()
    .toLowerCase();
  const advertised = response.headers.get("content-length");
  if (
    type !== "application/json" ||
    (advertised !== null &&
      (!/^\d+$/.test(advertised) || Number(advertised) > MAX_RESPONSE_BYTES)) ||
    !response.body
  ) {
    await response.body?.cancel();
    return unavailable();
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return unavailable();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

/** Server-only RPC adapter. Neither the endpoint credential nor private results go to a browser. */
export class HttpAuthStore implements AuthStore {
  private endpoint: string;
  private key: Promise<CryptoKey>;
  private active = false;
  private queue: (() => void)[] = [];
  private timeoutMs: number;
  private wait: NonNullable<TransportOptions["wait"]>;
  private jitter: NonNullable<TransportOptions["jitter"]>;

  constructor(
    endpoint: string,
    secret: string,
    private fetcher: typeof fetch = fetch,
    private clock: () => number = () => Math.floor(Date.now() / 1_000),
    options: TransportOptions = {},
  ) {
    if (
      !/^https:\/\/[a-z0-9]+\.lambda-url\.us-east-2\.on\.aws\/?$/.test(endpoint)
    ) throw new Error("Invalid authentication storage endpoint");
    const secretBytes = encoder.encode(secret);
    if (secretBytes.byteLength < 32 || secretBytes.byteLength > 4_096) {
      throw new Error("Invalid authentication storage credential");
    }
    this.endpoint = new URL(endpoint).href;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    if (
      !Number.isSafeInteger(this.timeoutMs) || this.timeoutMs < 1 ||
      this.timeoutMs > 10_000
    ) throw new Error("Invalid authentication storage timeout");
    this.wait = options.wait ?? pause;
    this.jitter = options.jitter ?? Math.random;
    this.key = crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }

  /** Serialize RPCs per runtime; this queues work, never authorization results. */
  private acquire(signal: AbortSignal): Promise<() => void> {
    if (signal.aborted || this.queue.length >= MAX_QUEUED_CALLS) {
      return Promise.reject(new Error(unavailableMessage));
    }
    if (!this.active) {
      this.active = true;
      return Promise.resolve(() => this.release());
    }
    return new Promise((resolve, reject) => {
      const ready = () => {
        signal.removeEventListener("abort", aborted);
        resolve(() => this.release());
      };
      const aborted = () => {
        this.queue = this.queue.filter((item) => item !== ready);
        reject(new Error(unavailableMessage));
      };
      signal.addEventListener("abort", aborted, { once: true });
      this.queue.push(ready);
    });
  }

  private release() {
    const next = this.queue.shift();
    if (next) next();
    else this.active = false;
  }

  private async attempt(
    body: string,
    signal: AbortSignal,
  ): Promise<unknown> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (signal.aborted) return unavailable();
      const now = this.clock();
      if (!timestamp(now)) return unavailable();
      // A retry must be a new signed request: a previous nonce may be consumed.
      const nonce = randomToken();
      const message = encoder.encode(`${now}\n${nonce}\n${body}`);
      const signature = base64Url(
        new Uint8Array(
          await crypto.subtle.sign("HMAC", await this.key, message),
        ),
      );
      if (signal.aborted) return unavailable();
      const response = await this.fetcher(this.endpoint, {
        method: "POST",
        redirect: "error",
        credentials: "omit",
        signal,
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Timestamp": String(now),
          "X-Auth-Nonce": nonce,
          "X-Auth-Signature": signature,
        },
        body,
      });
      if (signal.aborted) {
        await response.body?.cancel();
        return unavailable();
      }
      if (!response.ok) {
        await response.body?.cancel();
        // Function URL 429 means Lambda rejected the invocation before running
        // it. Do not retry network errors or ambiguous 5xx/write failures.
        if (response.status !== 429 || attempt === MAX_ATTEMPTS - 1) {
          return unavailable();
        }
        const jitter = this.jitter();
        if (!Number.isFinite(jitter) || jitter < 0 || jitter > 1) {
          return unavailable();
        }
        await this.wait(250 * 2 ** attempt * (0.75 + jitter * 0.5), signal);
        continue;
      }
      const envelope = await responseJson(response);
      if (
        !record(envelope) || !Object.hasOwn(envelope, "result") ||
        Object.keys(envelope).length !== 1
      ) return unavailable();
      return envelope.result;
    }
    return unavailable();
  }

  private async call(action: string, args: unknown[]): Promise<unknown> {
    const controller = new AbortController();
    // Includes time in the queue, signing, retries, and response consumption.
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let release: (() => void) | undefined;
    try {
      const body = JSON.stringify({ action, args });
      if (encoder.encode(body).byteLength > MAX_RESPONSE_BYTES) {
        return unavailable();
      }
      release = await this.acquire(controller.signal);
      return await beforeAbort(
        this.attempt(body, controller.signal),
        controller.signal,
      );
    } catch {
      // Never expose response bodies, provider data, or network diagnostics to callers.
      return unavailable();
    } finally {
      clearTimeout(timer);
      release?.();
    }
  }

  async putTransaction(
    key: string,
    transaction: OAuthTransaction,
  ): Promise<void> {
    if (await this.call("putTransaction", [key, transaction]) !== null) {
      unavailable();
    }
  }

  async consumeTransaction(
    key: string,
    browserHash: string,
    now: number,
  ): Promise<OAuthTransaction | null> {
    const result = await this.call("consumeTransaction", [
      key,
      browserHash,
      now,
    ]);
    if (result === null) return null;
    if (
      !record(result) || result.browserHash !== browserHash ||
      !token(result.browserHash) || !token(result.verifier) ||
      !token(result.nonce) ||
      !text(result.returnTo, 2_048, true) ||
      safeReturnTo(result.returnTo) !== result.returnTo ||
      !redirectUri(result.redirectUri) || !timestamp(result.expiresAt) ||
      result.expiresAt <= now
    ) return unavailable();
    return {
      browserHash: result.browserHash,
      verifier: result.verifier,
      nonce: result.nonce,
      returnTo: result.returnTo,
      redirectUri: result.redirectUri,
      expiresAt: result.expiresAt,
    };
  }

  async upsertUser(
    id: string,
    identity: Identity,
    now: number,
  ): Promise<PublicUser> {
    return profile(await this.call("upsertUser", [id, identity, now]), id);
  }

  async getUser(id: string): Promise<UserRecord | null> {
    const result = await this.call("getUser", [id]);
    if (result === null) return null;
    const user = profile(result, id);
    if (
      !record(result) || !text(result.subject, 128, true) ||
      typeof result.emailVerified !== "boolean" ||
      !Array.isArray(result.accessTags) || result.accessTags.length > 256 ||
      result.accessTags.some((tag: unknown) =>
        typeof tag !== "string" || !/^[a-z0-9][a-z0-9:_-]{0,63}$/.test(tag)
      )
    ) return unavailable();
    return {
      ...user,
      subject: result.subject,
      emailVerified: result.emailVerified,
      accessTags: [...result.accessTags] as string[],
    };
  }

  async putSession(key: string, session: SessionRecord): Promise<void> {
    if (await this.call("putSession", [key, session]) !== null) unavailable();
  }

  async getSession(key: string): Promise<SessionRecord | null> {
    const result = await this.call("getSession", [key]);
    if (result === null) return null;
    if (
      !record(result) || !token(result.userId) ||
      !timestamp(result.authenticatedAt) || !timestamp(result.expiresAt) ||
      result.expiresAt <= result.authenticatedAt
    ) return unavailable();
    return {
      userId: result.userId,
      authenticatedAt: result.authenticatedAt,
      expiresAt: result.expiresAt,
    };
  }

  async deleteSession(key: string): Promise<void> {
    if (await this.call("deleteSession", [key]) !== null) unavailable();
  }
}
