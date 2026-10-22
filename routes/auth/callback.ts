import { define } from "../../utils.ts";
import { authService } from "../../lib/auth/runtime.ts";
import { PRIVATE_HEADERS } from "../../lib/auth/service.ts";

export const handler = define.handlers({
  async GET(ctx) {
    try {
      const service = authService();
      if (service) return await service.callback(ctx.req);
    } catch {
      console.error("Authentication callback failed");
    }
    return new Response(null, {
      status: 303,
      headers: { ...PRIVATE_HEADERS, Location: "/login?error=failed" },
    });
  },
});
