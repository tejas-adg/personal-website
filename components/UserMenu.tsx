import type { PublicUser } from "../lib/auth/types.ts";

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      class="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" />
    </svg>
  );
}

export function UserMenu({ user = null }: { user?: PublicUser | null }) {
  return (
    <a
      href={user ? "/account" : "/login"}
      aria-label={user ? "Your account" : "Sign in"}
      title={user ? "Your account" : "Sign in"}
      class="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-outline-variant/15 bg-surface-container-low px-3 text-xs font-medium text-primary/80 hover:bg-surface-container-high hover:text-primary lg:min-h-9"
    >
      <UserIcon />
      <span class="hidden sm:inline">{user ? "Account" : "Sign in"}</span>
    </a>
  );
}
