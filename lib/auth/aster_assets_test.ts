import { App } from "fresh";
import {
  type AsterAssetDependencies,
  serveAsterAsset,
} from "./aster_assets.ts";
import { ASTER_ACCESS_TAGS } from "./page_access.ts";

function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`,
    );
  }
}

const root = new URL("file:///server/private/aster/");
const imagePath = "/aster/early-house-full.webp";

function fixture() {
  const calls: string[] = [];
  const state = { allowed: true };
  const bytes = new Uint8Array([82, 73, 70, 70]);
  const dependencies: AsterAssetDependencies = {
    requireAccess(_request, tags) {
      calls.push("authorize");
      assert(tags === ASTER_ACCESS_TAGS, "Use the shared server access policy");
      return Promise.resolve(
        state.allowed ? null : new Response("Not Found", { status: 404 }),
      );
    },
    loadManifest() {
      calls.push("manifest");
      return Promise.resolve({
        images: [{
          files: [{ filename: "early-house-full.webp", bytes: bytes.length }],
        }],
      });
    },
    readFile(url) {
      calls.push(`read:${url.href}`);
      return Promise.resolve(bytes);
    },
    stat(url) {
      calls.push(`stat:${url.href}`);
      return Promise.resolve({ isFile: true, size: bytes.length });
    },
  };
  const serve = (path = imagePath, init?: RequestInit) =>
    serveAsterAsset(
      new Request(new URL(path, "https://tejasam.com"), init),
      root,
      dependencies,
    );
  return { calls, state, bytes, dependencies, serve };
}

function privateResponse(response: Response, status: number) {
  equal(response.status, status);
  equal(response.headers.get("Cache-Control"), "private, no-store");
  equal(response.headers.get("Vary"), "Cookie");
  equal(response.headers.get("X-Content-Type-Options"), "nosniff");
}

Deno.test("Aster asset denial never loads the manifest or touches files", async () => {
  const requests: RequestInit[] = [
    {},
    { method: "HEAD" },
    { headers: { Range: "bytes=0-1" } },
    { headers: { "If-None-Match": '"old-public-cache"' } },
    { method: "POST" },
  ];
  for (const init of requests) {
    const test = fixture();
    test.state.allowed = false;
    const response = await test.serve(imagePath, init);
    privateResponse(response, 404);
    equal(await response.text(), "Not Found");
    equal(test.calls, ["authorize"]);
  }
});

Deno.test("Aster authorized GET reads an allowlisted file only after its guard", async () => {
  const test = fixture();
  const response = await test.serve();
  privateResponse(response, 200);
  equal(response.headers.get("Content-Type"), "image/webp");
  equal(response.headers.get("Content-Length"), "4");
  equal(response.headers.get("Cross-Origin-Resource-Policy"), "same-origin");
  equal([...new Uint8Array(await response.arrayBuffer())], [...test.bytes]);
  equal(test.calls, [
    "authorize",
    "manifest",
    "read:file:///server/private/aster/early-house-full.webp",
  ]);
});

Deno.test("Aster authorized HEAD checks existence without loading image bytes", async () => {
  const test = fixture();
  const response = await test.serve(imagePath, { method: "HEAD" });
  privateResponse(response, 200);
  equal(response.headers.get("Content-Length"), "4");
  equal(await response.text(), "");
  equal(test.calls, [
    "authorize",
    "manifest",
    "stat:file:///server/private/aster/early-house-full.webp",
  ]);
});

Deno.test("Aster conditional and range requests still receive a fresh authorized full response", async () => {
  const requests: HeadersInit[] = [
    { Range: "bytes=0-1" },
    { "If-None-Match": '"old-public-cache"' },
    { "If-Modified-Since": "Wed, 21 Oct 2026 00:00:00 GMT" },
  ];
  for (const headers of requests) {
    const test = fixture();
    const response = await test.serve(imagePath, { headers });
    privateResponse(response, 200);
    equal((await response.arrayBuffer()).byteLength, 4);
    assert(!response.headers.has("ETag"));
    assert(!response.headers.has("Content-Range"));
    equal(test.calls[0], "authorize");
  }
});

Deno.test("Aster asset access is checked again after revocation or session staleness", async () => {
  const test = fixture();
  const first = await test.serve();
  equal(first.status, 200);
  await first.arrayBuffer();
  test.state.allowed = false;
  test.calls.length = 0;
  const second = await test.serve();
  privateResponse(second, 404);
  equal(test.calls, ["authorize"]);
});

Deno.test("Aster asset routes reject traversal, encoded paths, and manifests before file access", async () => {
  for (
    const path of [
      "/aster/gallery.json",
      "/aster/images.json",
      "/aster/../aster-images.json",
      "/aster/%2e%2e/aster-images.json",
      "/aster/%252e%252e%252faster-images.json",
      "/aster/%65arly-house-full.webp",
      "/aster/early-house-full.webp%00",
      "/aster/subdir/early-house-full.webp",
      "/aster/early-house-full.webp/extra",
      "/aster/early-house-full.webp%2fextra",
      "/aster/early-house-full.webp%5cextra",
      "/aster/early-house-full.svg",
    ]
  ) {
    const test = fixture();
    const response = await test.serve(path);
    privateResponse(response, 404);
    equal(test.calls, ["authorize"]);
  }
});

Deno.test("Aster unknown WebP files cannot bypass the manifest allowlist", async () => {
  const test = fixture();
  const response = await test.serve("/aster/unlisted-private-file.webp");
  privateResponse(response, 404);
  equal(test.calls, ["authorize", "manifest"]);
});

Deno.test("Aster file query parameters do not select a filesystem path", async () => {
  const test = fixture();
  const response = await test.serve(
    `${imagePath}?file=../../.env&path=/etc/passwd`,
  );
  equal(response.status, 200);
  await response.arrayBuffer();
  equal(
    test.calls.at(-1),
    "read:file:///server/private/aster/early-house-full.webp",
  );
});

Deno.test("Aster unsupported methods never load the manifest or filesystem", async () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const test = fixture();
    const response = await test.serve(imagePath, { method });
    privateResponse(response, 404);
    equal(test.calls, ["authorize"]);
  }
});

Deno.test("Aster authorization, manifest, and file errors fail closed", async () => {
  for (const dependency of ["requireAccess", "loadManifest", "readFile"]) {
    const test = fixture();
    Object.assign(test.dependencies, {
      [dependency]: () => Promise.reject(new Error("Internal private details")),
    });
    const response = await test.serve();
    privateResponse(response, 404);
    equal(await response.text(), "Not Found");
    assert(!test.calls.some((call) => call.startsWith("read:")));
  }
  const test = fixture();
  test.dependencies.stat = () =>
    Promise.reject(new Error("Internal private details"));
  const response = await test.serve(imagePath, { method: "HEAD" });
  privateResponse(response, 404);
});

Deno.test("Aster authorized HEAD rejects non-file paths", async () => {
  const test = fixture();
  test.dependencies.stat = () => Promise.resolve({ isFile: false, size: 0 });
  privateResponse(await test.serve(imagePath, { method: "HEAD" }), 404);
});

Deno.test("Aster Fresh route intercepts private assets before any public fallback", async () => {
  const test = fixture();
  test.state.allowed = false;
  let publicReads = 0;
  const app = new App();
  app.all(
    "/aster/*",
    (ctx) => serveAsterAsset(ctx.req, root, test.dependencies),
  );
  app.use(() => {
    publicReads++;
    return new Response("public fallback");
  });
  const response = await app.handler()(
    new Request(`https://tejasam.com${imagePath}`),
  );
  privateResponse(response, 404);
  equal(await response.text(), "Not Found");
  equal(publicReads, 0);
  equal(test.calls, ["authorize"]);
});
