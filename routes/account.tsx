import { Head } from "fresh/runtime";
import { page } from "fresh";
import { notFound, PRIVATE_HEADERS } from "../lib/auth/service.ts";
import { publicUser } from "../lib/auth/types.ts";
import type { PublicUser } from "../lib/auth/types.ts";
import { define } from "../utils.ts";

export interface AccountPageData {
  user: PublicUser;
}

export const handler = define.handlers({
  GET(ctx) {
    if (!ctx.state.user) return notFound();
    return page<AccountPageData>({ user: publicUser(ctx.state.user) }, {
      headers: PRIVATE_HEADERS,
    });
  },
});

export default define.page<typeof handler>(function AccountPage({ data }) {
  const user = data.user;
  const initials = user.name.trim().split(/\s+/).slice(0, 2)
    .map((word) => word.slice(0, 1)).join("").toUpperCase() || "U";

  return (
    <>
      <Head>
        <title>Your account | Tejas A. M.</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main class="mx-auto flex min-h-[calc(100dvh-6.25rem)] max-w-4xl flex-col px-5 py-16 sm:px-8 sm:py-20">
        <p class="type-label mb-6 text-primary/75">A place for you</p>
        <h1 class="type-headline">Your account.</h1>

        <section
          aria-labelledby="profile-heading"
          class="mt-12 rounded-2xl border border-outline-variant/35 bg-surface-container-low/70 p-6 shadow-surface sm:p-10"
        >
          <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <div
              aria-hidden="true"
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-headline text-2xl italic text-primary"
            >
              {initials}
            </div>
            <div class="min-w-0">
              <p class="type-label mb-2">Signed in as</p>
              <h2
                id="profile-heading"
                class="break-words font-headline text-3xl italic leading-tight sm:text-4xl"
              >
                {user.name}
              </h2>
              {user.email && (
                <p class="mt-2 break-words text-sm text-on-surface-variant">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <p class="mt-7 max-w-xl text-sm leading-7 text-on-surface-variant">
            You’re signed in. You can return to the website or sign in again
            when you need a fresh session.
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3">
            <a href="/" class="btn-primary focus-ring">
              Back to the website
            </a>
            <a href="/login?reauth=1" class="btn-secondary focus-ring">
              Sign in again
            </a>
          </div>

          <form
            method="post"
            action="/auth/logout"
            class="mt-8 border-t border-outline-variant/30 pt-6"
          >
            <button
              type="submit"
              class="focus-ring min-h-11 rounded-md px-1 text-sm text-on-surface-variant underline decoration-outline/40 underline-offset-4 hover:text-on-surface"
            >
              Sign out
            </button>
          </form>
        </section>
      </main>
    </>
  );
});
