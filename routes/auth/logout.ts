import { define } from "../../utils.ts";
import { authService } from "../../lib/auth/runtime.ts";
import { PRIVATE_HEADERS } from "../../lib/auth/service.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const service = authService();
      if (service) return await service.logout(ctx.req);
    } catch {
      console.error("Sign-out failed");
    }
    return new Response(
      "Sign-out is temporarily unavailable. Please try again.",
      { status: 503, headers: PRIVATE_HEADERS },
    );
  },
});
