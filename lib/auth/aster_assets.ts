import { ASTER_ACCESS_TAGS } from "./page_access.ts";
import { requireAccess } from "./runtime.ts";
import { notFound, PRIVATE_HEADERS } from "./service.ts";

interface AsterManifest {
  images: { files: { filename: string; bytes: number }[] }[];
}

export interface AsterAssetDependencies {
  requireAccess: typeof requireAccess;
  loadManifest: () => Promise<AsterManifest>;
  readFile: (path: URL) => Promise<Uint8Array<ArrayBuffer>>;
  stat: (path: URL) => Promise<{ isFile: boolean; size: number }>;
}

const defaults: AsterAssetDependencies = {
  requireAccess,
  async loadManifest() {
    // The manifest remains in a server chunk and is loaded only after access
    // succeeds. It is never emitted as a publicly served JSON asset.
    return (await import("../../private/aster-images.json", {
      with: { type: "json" },
    })).default;
  },
  readFile: (path) => Deno.readFile(path),
  stat: (path) => Deno.stat(path),
};

function missingAsset(): Response {
  const response = notFound();
  response.headers.set("Vary", "Cookie");
  return response;
}

/** Serve private screenshots only after a fresh server-side permission check. */
export async function serveAsterAsset(
  request: Request,
  root: URL,
  dependencies: Partial<AsterAssetDependencies> = {},
): Promise<Response> {
  const deps = { ...defaults, ...dependencies };
  try {
    // This precedes even manifest loading and file-existence checks, including
    // conditional, ranged, and HEAD requests. A grant is never cached here.
    if (await deps.requireAccess(request, ASTER_ACCESS_TAGS)) {
      return missingAsset();
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return missingAsset();
    }

    // Accept one literal basename only: no percent-encoded paths, slashes,
    // metadata files, or filesystem names supplied through query parameters.
    const match = /^\/aster\/([a-z0-9]+(?:-[a-z0-9]+)*\.webp)$/.exec(
      new URL(request.url).pathname,
    );
    if (!match) return missingAsset();
    const filename = match[1];
    const manifest = await deps.loadManifest();
    if (
      !manifest.images.some((image) =>
        image.files.some((file) => file.filename === filename)
      )
    ) return missingAsset();

    const fileUrl = new URL(filename, root);
    const headers = new Headers({
      ...PRIVATE_HEADERS,
      "Content-Type": "image/webp",
      "Cross-Origin-Resource-Policy": "same-origin",
      Vary: "Cookie",
    });
    if (request.method === "HEAD") {
      const info = await deps.stat(fileUrl);
      if (!info.isFile) return missingAsset();
      headers.set("Content-Length", String(info.size));
      return new Response(null, { headers });
    }

    // Screenshots are deliberately served without a public validator or range
    // cache. Conditional/ranged requests receive a fresh authorized full body.
    const bytes = await deps.readFile(fileUrl);
    headers.set("Content-Length", String(bytes.byteLength));
    return new Response(bytes, { headers });
  } catch {
    // Authentication, manifest, and filesystem failures all fail closed.
    return missingAsset();
  }
}
