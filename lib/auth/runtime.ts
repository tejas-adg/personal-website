import { readAuthConfig } from "./config.ts";
import { AuthService, notFound } from "./service.ts";
import { HttpAuthStore } from "./http_store.ts";

let runtime: { signature: string; service: AuthService } | undefined;

export function authService(): AuthService | null {
  const config = readAuthConfig();
  if (!config) return null;
  const signature = JSON.stringify(config);
  if (runtime?.signature !== signature) {
    runtime = {
      signature,
      service: new AuthService(
        config,
        new HttpAuthStore(config.storeEndpoint, config.storeSecret),
      ),
    };
  }
  return runtime.service;
}

/** Call BEFORE querying or rendering protected data. Never pass this result as page props. */
export async function requireAccess(
  request: Request,
  tags: readonly string[],
): Promise<Response | null> {
  try {
    const service = authService();
    return service && await service.hasAccess(request, tags)
      ? null
      : notFound();
  } catch {
    // Fail closed on database/network/config errors without disclosing protected-route existence.
    return notFound();
  }
}
