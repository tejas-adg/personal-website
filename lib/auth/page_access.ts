import type { PublicUser } from "./types.ts";

export const ASTER_ACCESS_TAGS: readonly string[] = Object.freeze([
  "aster:read",
]);

export type PageAccess = "allowed" | "signin" | "denied";

export interface PageAccessDependencies {
  requireAccess: (
    request: Request,
    tags: readonly string[],
  ) => Promise<Response | null>;
  currentUser: (request: Request) => Promise<PublicUser | null>;
}

/** Public presentation state only. Authorization must finish before content loads. */
export async function evaluatePageAccess(
  request: Request,
  dependencies: PageAccessDependencies,
): Promise<PageAccess> {
  try {
    if (await dependencies.requireAccess(request, ASTER_ACCESS_TAGS) === null) {
      return "allowed";
    }
    return await dependencies.currentUser(request) ? "denied" : "signin";
  } catch {
    return "signin";
  }
}
