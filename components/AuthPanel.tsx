import type { AuthProvider, PublicUser } from "../lib/auth/types.ts";

export interface AuthPanelProps {
  providers: AuthProvider[];
  returnTo?: string;
  error?: string;
  user?: PublicUser | null;
}

function signInHref(provider: AuthProvider, returnTo: string): string {
  const search = new URLSearchParams({ provider: provider.id, returnTo });
  return `/auth/signin?${search}`;
}

export function AuthPanel({
  providers,
  returnTo = "/account",
  error,
  user,
}: AuthPanelProps) {
  const available = [...providers]
    .filter((provider) => provider.configured)
    .sort((left, right) =>
      Number(right.id === "Google") - Number(left.id === "Google")
    );

  return (
    <section
      aria-labelledby="sign-in-heading"
      class="w-full max-w-md rounded-2xl border border-outline-variant/35 bg-surface-container-low/70 px-6 py-10 shadow-surface sm:px-10 sm:py-12"
    >
      <p class="type-label mb-5 text-primary/75">Welcome back</p>
      <h1
        id="sign-in-heading"
        class="font-headline text-5xl italic leading-none text-on-surface sm:text-6xl"
      >
        Sign in.
      </h1>
      <p class="mt-5 text-sm leading-7 text-on-surface-variant">
        Use an account you already know. No new password to remember.
      </p>

      {error && (
        <p
          role="alert"
          class="mt-6 rounded-xl border border-error/25 bg-error/5 px-4 py-3 text-sm leading-6 text-error"
        >
          {error}
        </p>
      )}

      <div class="mt-8 flex flex-col items-center gap-3">
        {available.map((provider) => (
          <a
            key={provider.id}
            href={signInHref(provider, returnTo)}
            aria-label={`Sign in with ${provider.name}`}
            class={provider.id === "Google"
              ? "focus-ring inline-flex min-h-14 w-60 max-w-full items-center justify-center rounded-full hover:brightness-95"
              : "focus-ring inline-flex min-h-14 w-60 max-w-full items-center justify-center rounded-full border border-outline/60 bg-surface-container px-5 text-sm font-medium text-on-surface hover:border-primary/60 hover:bg-surface-container-high"}
          >
            {provider.id === "Google"
              ? (
                <img
                  src="/auth/google-signin.png"
                  alt=""
                  width="360"
                  height="80"
                  class="h-auto w-full"
                />
              )
              : `Sign in with ${provider.name}`}
          </a>
        ))}

        {available.length === 0 && (
          <>
            <button
              type="button"
              disabled
              aria-label="Sign in with Google, available soon"
              class="inline-flex min-h-14 w-60 max-w-full cursor-not-allowed items-center justify-center rounded-full opacity-50"
            >
              <img
                src="/auth/google-signin.png"
                alt=""
                width="360"
                height="80"
                class="h-auto w-full"
              />
            </button>
            <p class="text-center text-xs leading-6 text-on-surface-variant">
              Sign-in will be available soon.
            </p>
          </>
        )}
      </div>

      <p class="mt-7 text-center text-xs leading-6 text-on-surface-variant/80">
        Your provider handles sign-in. Your password is never shared with this
        website.
      </p>

      {user && (
        <p class="mt-7 border-t border-outline-variant/30 pt-6 text-center text-sm leading-6 text-on-surface-variant">
          Already signed in as {user.name}.{" "}
          <a
            href="/account"
            class="focus-ring rounded-sm text-primary underline decoration-primary/35 underline-offset-4 hover:text-primary-fixed"
          >
            Your account
          </a>
        </p>
      )}
    </section>
  );
}
