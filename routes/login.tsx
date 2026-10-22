import { Head } from "fresh/runtime";
import { page } from "fresh";
import {
  authProviders,
  readAuthConfig,
  safeReturnTo,
} from "../lib/auth/config.ts";
import { PRIVATE_HEADERS } from "../lib/auth/service.ts";
import { publicUser } from "../lib/auth/types.ts";
import { AuthPanel } from "../components/AuthPanel.tsx";
import type { AuthProvider, PublicUser } from "../lib/auth/types.ts";
import { define } from "../utils.ts";

export interface LoginPageData {
  providers: AuthProvider[];
  returnTo?: string;
  error?: string;
  user?: PublicUser | null;
}

export const handler = define.handlers({
  GET(ctx) {
    const url = new URL(ctx.req.url);
    let config = null;
    try {
      config = readAuthConfig();
    } catch {
      console.error("Authentication configuration unavailable");
    }
    const errors: Record<string, string> = {
      failed: "We couldn’t complete sign-in. Please try again.",
      cancelled:
        "Sign-in was cancelled. You can try again whenever you’re ready.",
    };
    const errorCode = url.searchParams.get("error") ?? "";
    return page<LoginPageData>({
      providers: authProviders(config),
      returnTo: safeReturnTo(url.searchParams.get("returnTo")),
      error: Object.hasOwn(errors, errorCode) ? errors[errorCode] : undefined,
      user: ctx.state.user ? publicUser(ctx.state.user) : null,
    }, { headers: PRIVATE_HEADERS });
  },
});

export default define.page<typeof handler>(function LoginPage({ data }) {
  return (
    <>
      <Head>
        <title>Sign in | Tejas A. M.</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main class="mx-auto flex min-h-[calc(100dvh-6.25rem)] max-w-6xl items-center justify-center px-5 py-16 sm:px-8 sm:py-20">
        <AuthPanel {...data} />
      </main>
    </>
  );
});
