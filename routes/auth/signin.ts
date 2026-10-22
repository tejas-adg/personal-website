import { define } from "../../utils.ts";
import { authService } from "../../lib/auth/runtime.ts";
import { PRIVATE_HEADERS } from "../../lib/auth/service.ts";

export const handler = define.handlers({
  async GET(ctx) {
    try {
      const service = authService();
      if (service) return await service.signIn(ctx.req);
    } catch {
      console.error("Authentication start failed");
    }
    return new Response(
      "Sign-in is temporarily unavailable. Please try again later.",
      { status: 503, headers: PRIVATE_HEADERS },
    );
  },
});
