export interface AccessGateProps {
  state: "signin" | "denied" | "reauth";
  signInHref?: string;
}

const messages = {
  signin: {
    title: "A little further in.",
    description: "Please sign in to view this page.",
    note: "A quiet corner, shared with a little care.",
    action: "Sign in to continue",
  },
  denied: {
    title: "This door is still closed.",
    description: "Sorry, your account isn’t authorized to view this page.",
    note: "You’re always welcome to explore the rest of the website.",
    action: "Back to the website",
  },
  reauth: {
    title: "Welcome back.",
    description: "Please sign in again to continue.",
    note: "We’ll bring you right back here when you’re ready.",
    action: "Sign in again",
  },
};

function GateArrow() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export function AccessGate({
  state,
  signInHref = "/login?returnTo=%2Ftest",
}: AccessGateProps) {
  const message = messages[state];
  const denied = state === "denied";

  return (
    <main class="access-gate">
      <section class="access-gate-layout" aria-labelledby="access-gate-title">
        <div class="access-gate-copy">
          <p class="access-gate-eyebrow">A moment at the threshold</p>
          <h1 id="access-gate-title" class="access-gate-title">
            {message.title}
          </h1>
          <p class="access-gate-description">{message.description}</p>
          <p class="access-gate-note">{message.note}</p>

          <div class="access-gate-actions">
            <a
              href={denied ? "/" : signInHref}
              class="access-gate-button focus-ring"
            >
              <span>{message.action}</span>
              <GateArrow />
            </a>
            {denied
              ? (
                <form method="post" action="/auth/logout">
                  <button
                    type="submit"
                    class="access-gate-secondary focus-ring"
                  >
                    Sign out to use another account
                  </button>
                </form>
              )
              : (
                <a href="/" class="access-gate-secondary focus-ring">
                  Back to the website
                </a>
              )}
          </div>
        </div>

        <div class="access-gate-scene" aria-hidden="true">
          <div class="access-gate-halo" />
          <div class="access-gate-doorway">
            <div class="access-gate-light" />
            <div class="access-gate-door">
              <div class="access-gate-door-edge" />
            </div>
          </div>
          <div class="access-gate-floor" />
          <span class="access-gate-scene-caption">There is more beyond.</span>
        </div>
      </section>
    </main>
  );
}
