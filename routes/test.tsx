import { Head } from "fresh/runtime";
import { page } from "fresh";
import { AccessGate } from "../components/AccessGate.tsx";
import { evaluatePageAccess } from "../lib/auth/page_access.ts";
import { requireAccess } from "../lib/auth/runtime.ts";
import { PRIVATE_HEADERS } from "../lib/auth/service.ts";
import { define } from "../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const access = await evaluatePageAccess(ctx.req, {
      requireAccess,
      currentUser: () => Promise.resolve(ctx.state.user ?? null),
    });
    return page({ access }, {
      status: access === "allowed" ? 200 : 404,
      headers: {
        ...PRIVATE_HEADERS,
        Vary: "Cookie",
        "X-Frame-Options": "DENY",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  },
});

export default define.page<typeof handler>(async ({ data }) => {
  if (data.access !== "allowed") {
    return (
      <>
        <Head>
          <title>
            {data.access === "signin" ? "Please sign in" : "A quiet threshold"}
            {" "}
            | Tejas A. M.
          </title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <AccessGate state={data.access} />
      </>
    );
  }

  // This import, its narrative, and both image manifests stay behind the guard.
  const { default: AsterStory } = await import("../private/AsterStory.tsx");
  return <AsterStory />;
});
