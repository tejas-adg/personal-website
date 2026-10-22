import type { AuthProvider, ProviderId } from "./types.ts";

export interface AuthConfig {
  origin: string;
  allowedOrigins: string[];
  region: "us-east-2";
  tableName: string;
  storeEndpoint: string;
  storeSecret: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  domain: string;
  sessionSeconds: number;
  recentSeconds: number;
  providers: ProviderId[];
}

const providerNames = {
  Google: "Google",
  LoginWithAmazon: "Amazon",
  Facebook: "Facebook",
} as const;

export function readAuthConfig(env = Deno.env.toObject()): AuthConfig | null {
  const poolId = env.COGNITO_USER_POOL_ID;
  const clientId = env.COGNITO_CLIENT_ID;
  const clientSecret = env.COGNITO_CLIENT_SECRET;
  const domain = env.COGNITO_DOMAIN;
  const tableName = env.AUTH_TABLE_NAME;
  const storeEndpoint = env.AUTH_STORE_URL;
  const storeSecret = env.AUTH_STORE_SECRET;
  if (
    !poolId || !clientId || !clientSecret || !domain || !tableName ||
    !storeEndpoint || !storeSecret
  ) {
    return null;
  }
  if (
    !/^us-east-2_[A-Za-z0-9]+$/.test(poolId) || !/^[a-z0-9]+$/.test(clientId)
  ) throw new Error("Invalid Cognito configuration");
  const domainUrl = new URL(domain);
  if (
    domainUrl.protocol !== "https:" ||
    !/^[a-z0-9-]+\.auth\.us-east-2\.amazoncognito\.com$/.test(
      domainUrl.hostname,
    ) || domainUrl.pathname !== "/" || domainUrl.search || domainUrl.hash ||
    domainUrl.username || domainUrl.password || domainUrl.port
  ) throw new Error("Invalid Cognito domain");
  const storeUrl = new URL(storeEndpoint);
  if (
    storeUrl.protocol !== "https:" ||
    !/^[a-z0-9]+\.lambda-url\.us-east-2\.on\.aws$/.test(storeUrl.hostname) ||
    storeUrl.pathname !== "/" || storeUrl.search || storeUrl.hash ||
    storeUrl.username || storeUrl.password || storeUrl.port ||
    !/^[A-Za-z0-9_-]{43,128}$/.test(storeSecret)
  ) throw new Error("Invalid authentication store configuration");
  const origin = validOrigin(env.AUTH_ORIGIN ?? "https://tejasam.com");
  const allowedOrigins = [
    ...new Set([
      origin,
      ...(env.AUTH_DEV_ORIGIN ? [validOrigin(env.AUTH_DEV_ORIGIN)] : []),
    ]),
  ];
  const providers = (env.AUTH_PROVIDERS ?? "").split(",").map((s) => s.trim())
    .filter(Boolean);
  if (providers.some((p) => !Object.hasOwn(providerNames, p))) {
    throw new Error("Unsupported authentication provider");
  }
  return {
    origin,
    allowedOrigins,
    region: "us-east-2",
    tableName,
    storeEndpoint: storeUrl.href,
    storeSecret,
    issuer: `https://cognito-idp.us-east-2.amazonaws.com/${poolId}`,
    clientId,
    clientSecret,
    domain: domainUrl.origin,
    sessionSeconds: duration(env.AUTH_SESSION_SECONDS, 28800, 300, 86400),
    recentSeconds: duration(env.AUTH_RECENT_SECONDS, 900, 60, 3600),
    providers: [...new Set(providers)] as ProviderId[],
  };
}

function duration(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error("Invalid authentication duration");
  }
  return parsed;
}

function validOrigin(value: string): string {
  const url = new URL(value);
  if (
    url.origin !== value || url.username || url.password ||
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
  ) throw new Error("Authentication requires an HTTPS origin (or localhost)");
  return url.origin;
}

export function authProviders(config: AuthConfig | null): AuthProvider[] {
  return (Object.keys(providerNames) as ProviderId[]).map((id) => ({
    id,
    name: providerNames[id],
    configured: config?.providers.includes(id) ?? false,
  }));
}

export function requestOrigin(request: Request, config: AuthConfig): string {
  const origin = new URL(request.url).origin;
  if (!config.allowedOrigins.includes(origin)) {
    throw new Error("Unregistered authentication origin");
  }
  return origin;
}

export function safeReturnTo(value: string | null | undefined): string {
  if (
    !value || value.length > 2048 || !value.startsWith("/") ||
    value.startsWith("//") || value.includes("\\") ||
    Array.from(value).some((character) =>
      character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127
    )
  ) return "/account";
  const url = new URL(value, "https://return.invalid");
  if (
    url.origin !== "https://return.invalid" || url.pathname.startsWith("/auth/")
  ) return "/account";
  return url.pathname + url.search;
}
