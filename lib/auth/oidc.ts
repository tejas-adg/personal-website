/** Cognito ID-token verification using the runtime's built-in Web Crypto APIs. */
export interface CognitoIdentity {
  subject: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  picture: string | null;
  authenticatedAt: number;
}

interface VerifyOptions {
  issuer: string;
  clientId: string;
  nonce: string;
  /** Current time in Unix seconds, injectable for deterministic verification. */
  now?: number;
  fetcher?: typeof fetch;
}

interface SigningKeySet {
  keys: Map<string, CryptoKey>;
  expiresAt: number;
  fetchedAt: number;
}

const MAX_TOKEN_LENGTH = 16_384;
const MAX_JWKS_BYTES = 65_536;
const FETCH_TIMEOUT_MS = 5_000;
const DEFAULT_KEY_CACHE_SECONDS = 300;
const MAX_KEY_CACHE_SECONDS = 3_600;
const MIN_KEY_REFRESH_MS = 30_000;
const decoder = new TextDecoder("utf-8", { fatal: true });
const encoder = new TextEncoder();
const caches = new WeakMap<
  typeof fetch,
  Map<string, SigningKeySet>
>();
const requests = new WeakMap<
  typeof fetch,
  Map<string, Promise<SigningKeySet>>
>();

function invalidToken(): never {
  throw new Error("Invalid authentication token");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  if (
    !value || value.length % 4 === 1 ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    return invalidToken();
  }
  try {
    const binary = atob(
      value.replaceAll("-", "+").replaceAll("_", "/") +
        "=".repeat((4 - value.length % 4) % 4),
    );
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return invalidToken();
  }
}

function decodeObject(value: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(decoder.decode(decodeBase64Url(value)));
    if (isObject(parsed)) return parsed;
  } catch {
    // Malformed encodings and JSON receive the same non-sensitive error.
  }
  return invalidToken();
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function validateIssuer(issuer: string): void {
  // The configured issuer, never a token-supplied URL, determines key retrieval.
  if (
    !/^https:\/\/cognito-idp\.us-east-2\.amazonaws\.com\/us-east-2_[A-Za-z0-9]+$/
      .test(issuer)
  ) {
    throw new Error("Invalid Cognito issuer configuration");
  }
}

async function readKeyDocument(response: Response): Promise<unknown> {
  const advertisedLength = response.headers.get("content-length");
  if (
    !response.ok || !response.body ||
    (advertisedLength !== null &&
      (!/^\d+$/.test(advertisedLength) ||
        Number(advertisedLength) > MAX_JWKS_BYTES))
  ) {
    await response.body?.cancel();
    throw new Error("Identity signing keys are unavailable");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_JWKS_BYTES) {
        await reader.cancel();
        throw new Error("Identity signing-key document is too large");
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
  try {
    return JSON.parse(decoder.decode(bytes));
  } catch {
    throw new Error("Invalid identity signing-key document");
  }
}

function cacheSeconds(header: string | null): number {
  if (header && /(?:^|,)\s*(?:no-store|no-cache)(?:\s|,|$)/i.test(header)) {
    return 0;
  }
  const match = header?.match(/(?:^|,)\s*max-age=(\d+)(?:\s|,|$)/i);
  return match
    ? Math.min(Number(match[1]), MAX_KEY_CACHE_SECONDS)
    : DEFAULT_KEY_CACHE_SECONDS;
}

async function downloadKeys(
  issuer: string,
  fetcher: typeof fetch,
): Promise<SigningKeySet> {
  const response = await fetcher(`${issuer}/.well-known/jwks.json`, {
    headers: { accept: "application/json" },
    redirect: "error",
    credentials: "omit",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const document = await readKeyDocument(response);
  if (
    !isObject(document) || !Array.isArray(document.keys) ||
    document.keys.length === 0 || document.keys.length > 20
  ) {
    throw new Error("Invalid identity signing-key document");
  }

  const keys = new Map<string, CryptoKey>();
  for (const key of document.keys) {
    if (
      !isObject(key) || key.kty !== "RSA" || key.alg !== "RS256" ||
      key.use !== "sig" || typeof key.kid !== "string" ||
      !key.kid || key.kid.length > 256 || keys.has(key.kid) ||
      typeof key.n !== "string" || key.n.length > 1_024 ||
      typeof key.e !== "string" || key.e.length > 8
    ) {
      throw new Error("Invalid identity signing key");
    }
    const modulus = decodeBase64Url(key.n);
    const exponent = decodeBase64Url(key.e);
    if (
      modulus.length < 256 || modulus.length > 512 ||
      exponent.length < 1 || exponent.length > 4
    ) {
      throw new Error("Invalid identity signing key");
    }
    const imported = await crypto.subtle.importKey(
      "jwk",
      { kty: "RSA", n: key.n, e: key.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    keys.set(key.kid, imported);
  }
  const fetchedAt = Date.now();
  return {
    keys,
    fetchedAt,
    expiresAt: fetchedAt + cacheSeconds(response.headers.get("cache-control")) *
        1_000,
  };
}

async function getSigningKey(
  issuer: string,
  kid: string,
  fetcher: typeof fetch,
): Promise<CryptoKey> {
  let cache = caches.get(fetcher);
  if (!cache) {
    cache = new Map();
    caches.set(fetcher, cache);
  }
  const previous = cache.get(issuer);
  if (previous && previous.expiresAt > Date.now()) {
    const existingKey = previous.keys.get(kid);
    if (existingKey) return existingKey;
    // Refresh for key rotation, while bounding requests caused by unknown kids.
    if (Date.now() - previous.fetchedAt < MIN_KEY_REFRESH_MS) {
      return invalidToken();
    }
  }

  let pending = requests.get(fetcher);
  if (!pending) {
    pending = new Map();
    requests.set(fetcher, pending);
  }
  let request = pending.get(issuer);
  if (!request) {
    request = downloadKeys(issuer, fetcher);
    pending.set(issuer, request);
  }
  let downloaded: SigningKeySet;
  try {
    downloaded = await request;
    cache.set(issuer, downloaded);
  } finally {
    pending.delete(issuer);
  }
  const key = downloaded.keys.get(kid);
  return key ?? invalidToken();
}

function optionalText(
  value: unknown,
  maximumLength: number,
): string | null {
  if (value === undefined || value === null) return null;
  if (
    typeof value !== "string" || value.length > maximumLength ||
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  ) {
    return invalidToken();
  }
  return value;
}

function profilePicture(value: unknown): string | null {
  const text = optionalText(value, 2_048);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/**
 * Verify Cognito's identity assertion and expose only allowed profile fields.
 * Private access tags must remain in the application's server-side database.
 */
export async function verifyCognitoIdToken(
  token: string,
  options: VerifyOptions,
): Promise<CognitoIdentity> {
  validateIssuer(options.issuer);
  if (
    !options.clientId || options.clientId.length > 256 || !options.nonce ||
    options.nonce.length > 512
  ) {
    throw new Error("Invalid identity verification configuration");
  }
  const now = options.now ?? Math.floor(Date.now() / 1_000);
  if (!isTimestamp(now)) throw new Error("Invalid verification time");
  if (!token || token.length > MAX_TOKEN_LENGTH) return invalidToken();
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0].length > 2_048) return invalidToken();
  const [encodedHeader, encodedClaims, encodedSignature] = parts;
  const header = decodeObject(encodedHeader);
  const claims = decodeObject(encodedClaims);
  if (
    header.alg !== "RS256" || typeof header.kid !== "string" ||
    !header.kid || header.kid.length > 256 || header.crit !== undefined ||
    (header.typ !== undefined && header.typ !== "JWT") ||
    (header.b64 !== undefined && header.b64 !== true)
  ) {
    return invalidToken();
  }
  if (
    claims.token_use !== "id" || claims.iss !== options.issuer ||
    claims.aud !== options.clientId || claims.nonce !== options.nonce ||
    typeof claims.sub !== "string" || !claims.sub || claims.sub.length > 128 ||
    !isTimestamp(claims.exp) || claims.exp <= now ||
    !isTimestamp(claims.iat) || claims.iat > now || claims.iat >= claims.exp ||
    !isTimestamp(claims.auth_time) || claims.auth_time > now ||
    claims.auth_time > claims.iat ||
    (claims.nbf !== undefined &&
      (!isTimestamp(claims.nbf) || claims.nbf > now)) ||
    (claims.azp !== undefined && claims.azp !== options.clientId) ||
    (claims.email_verified !== undefined &&
      typeof claims.email_verified !== "boolean")
  ) {
    return invalidToken();
  }

  const signature = decodeBase64Url(encodedSignature);
  if (signature.length < 256 || signature.length > 512) return invalidToken();
  const key = await getSigningKey(
    options.issuer,
    header.kid,
    options.fetcher ?? fetch,
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signature,
    encoder.encode(`${encodedHeader}.${encodedClaims}`),
  );
  if (!valid) return invalidToken();

  const email = optionalText(claims.email, 320);
  const name = optionalText(claims.name, 512) ?? "";
  if (email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return invalidToken();
  }
  return {
    subject: claims.sub,
    name,
    email,
    emailVerified: email !== null && claims.email_verified === true,
    picture: profilePicture(claims.picture),
    authenticatedAt: claims.auth_time,
  };
}
