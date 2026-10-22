import { define } from "../../utils.ts";
import { PRIVATE_HEADERS } from "../../lib/auth/service.ts";
import { publicUser } from "../../lib/auth/types.ts";

export const handler = define.handlers({
  GET(ctx) {
    return Response.json({
      user: ctx.state.user ? publicUser(ctx.state.user) : null,
    }, { headers: PRIVATE_HEADERS });
  },
});
