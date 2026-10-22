import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import { authService } from "./lib/auth/runtime.ts";

export const app = new App<State>();

app.use(staticFiles());

// Pass a shared value from a middleware
app.use(async (ctx) => {
  ctx.state.shared = "hello";
  ctx.state.user = null;
  try {
    const service = authService();
    if (service) ctx.state.user = await service.currentUser(ctx.req);
  } catch {
    console.error("Session lookup failed");
  }
  const response = await ctx.next();
  response.headers.append("Vary", "Cookie");
  if (
    ctx.req.headers.has("cookie") ||
    ["/login", "/account", "/auth/", "/api/session"].some((path) =>
      new URL(ctx.req.url).pathname.startsWith(path)
    )
  ) {
    response.headers.set("Cache-Control", "private, no-store");
    // HTML form POSTs need their same-origin Origin header for CSRF checks.
    // OAuth responses suppress referrers entirely so callback codes stay private.
    response.headers.set(
      "Referrer-Policy",
      new URL(ctx.req.url).pathname.startsWith("/auth/")
        ? "no-referrer"
        : "same-origin",
    );
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
  }
  return response;
});

// this is the same as the /api/:name route defined via a file. feel free to delete this!
app.get("/api2/:name", (ctx) => {
  const name = ctx.params.name;
  return new Response(
    `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`,
  );
});

// this can also be defined via a file. feel free to delete this!
const exampleLoggerMiddleware = define.middleware((ctx) => {
  // OAuth codes and state must never appear in application logs.
  console.log(`${ctx.req.method} ${new URL(ctx.req.url).pathname}`);
  return ctx.next();
});
app.use(exampleLoggerMiddleware);

// Include file-system based routes here
app.fsRoutes();
