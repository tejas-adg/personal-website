# Fresh project

## User authentication

The website uses Amazon Cognito's social-provider authorization-code flow with
PKCE, a server-side callback, and opaque HttpOnly application sessions. It uses
native `fetch` and Web Crypto for authentication and the official AWS SDK for
DynamoDB; no third-party authentication framework is installed.

Copy `.env.example` to an ignored `.env` for local development, fill in the
values from the AWS stack and Cognito client, then run
`deno task --env-file=.env dev`. Production secrets belong in Deno Deploy's
environment settings. The server signs requests to the AWS storage endpoint; no
AWS access keys are deployed to Deno. See
[the deployment guide](docs/auth-deployment.md) for exact configuration.

`accessTags` is a **private, administrator-controlled user-record field**. The
application identity cannot assign or change it. A missing field is treated as
an empty list until an administrator sets it. Never expose this field in HTML,
island props, public APIs, cookies, tokens, or logs. Public user data must pass
through the explicit `publicUser` allowlist.

Before querying or rendering future protected content, call
`requireAccess(request, ["required-tag"])` from `lib/auth/runtime.ts`. It
returns 404 for absent, expired, stale, or insufficient authorization. The check
reads current tags from DynamoDB, so removal takes effect on the next request.
The initial recent-authentication window is 15 minutes, measured from Cognito's
verified original `auth_time`; normal activity never extends that timestamp. The
app does not promise a fresh password challenge from every social provider. Do
not place protected content in `static/` or pass it into a page before this
check has succeeded.

The Aster journal at `/test` uses the fixed server-side policy in
[`lib/auth/page_access.ts`](./lib/auth/page_access.ts). It loads the journal
only after `requireAccess` succeeds. At the user's request, its 404 response
shows a public sign-in screen when signed out, or a gentle access-denied screen
when a signed-in user cannot pass the guard. Both screens provide a sign-in path
that returns to `/test`. These presentation states contain no private journal
data or authorization fields. Protected image failures and other protected
routes keep the generic 404 response.

Permissions are assigned only through an administrator's AWS access. The website
has no permission-editing endpoint, and an email address in a request cannot
grant access. The page and every screenshot request check authorization
independently and use `Cache-Control: private, no-store` with `Vary: Cookie`.

Run `deno task test` for token-verification, OAuth, cookie, session, privacy,
and access-control tests.

This repository now uses two branch tracks:

- `codex/dev2`: the vanilla Fresh v2 + Tailwind v4 initialization
- `codex/dev`: the adapted version built on top of that starter

Use `codex/dev2` if you want the clean baseline. Use `codex/dev` if you want the
adapted project version.

## Current structure

The current work centered on moving repeated UI pieces out of the route files
and into shared components:

- [`components/NavBar.tsx`](./components/NavBar.tsx) now owns the shared
  navigation bar used by the app shell.
- [`components/icons.tsx`](./components/icons.tsx) holds the reusable SVG icons
  used by the navbar.
- [`components/urls.ts`](./components/urls.ts) stores shared remote image URLs
  used by the showcase route.
- [`routes/exhibitions.tsx`](./routes/exhibitions.tsx) is a simple route test
  page for the `Exhibitions` link.
- [`routes/archives.tsx`](./routes/archives.tsx) is the renamed shared nav test
  page for `Archives`.
- [`routes/test.tsx`](./routes/test.tsx) guards the Aster build journal linked
  from `Atelier`; authorized requests load its nested timeline and complete
  screenshot gallery from [`private/AsterStory.tsx`](./private/AsterStory.tsx).
- [`routes/contact.tsx`](./routes/contact.tsx) is the placeholder page for
  `Contact`.
- [`routes/noir-guide.tsx`](./routes/noir-guide.tsx) is the renamed showcase
  page for `Noir Guide`.

The navbar is rendered globally from [`routes/_app.tsx`](./routes/_app.tsx), so
pages no longer need to import it individually unless they intentionally want a
local override.

The current navbar targets are:

- `Exhibitions` -> `/exhibitions`
- `Archives` -> `/archives`
- `Atelier` -> `/test`
- `Contact` -> `/contact`
- `Noir Guide` -> `/noir-guide`

### Styling notes

The Aster journal keeps its chronological phases and milestones in
[`private/aster-story.ts`](./private/aster-story.ts), with responsive layout in
[`assets/story.css`](./assets/story.css). The 288 optimized, uncropped WebP
variants live in `private/aster/`.
[`private/aster-images.json`](./private/aster-images.json) records source hashes
and variants; [`private/aster-gallery.json`](./private/aster-gallery.json)
records all 109 unique game captures. See
[the editorial source notes](docs/aster-story-sources.md) for the V7.5/V8
chronology and verification limits.

[`components/AccessGate.tsx`](./components/AccessGate.tsx) and
[`assets/access-gate.css`](./assets/access-gate.css) provide the softly lit
doorway for sign-in and denial screens. The artwork is decorative CSS and needs
no private journal images.

`/aster/*` is a protected server handler registered before public static-file
serving. It checks the same fixed policy before loading the private manifest or
reading a file, accepts only known WebP filenames, and applies the guard to GET,
HEAD, range, and conditional requests. The build copies screenshot files beside
the server entry point at `_fresh/server/private/aster/`; neither images nor
manifests belong in `_fresh/client/`. Vite's development filesystem handler also
denies `private/` paths.

The GitHub repository remains public and contains the journal source and images,
including these server-only files. Earlier deployments also published them. The
website gate controls website requests; it does not hide repository contents or
retract historical copies.

The visual navbar styling now lives in
[`assets/styles.css`](./assets/styles.css):

- `.glass-nav` provides the frosted container shell.
- `.nav-link-text` handles the shared text-link treatment for the desktop nav
  items.
- `.nav-icon-button` keeps the compact circular icon buttons consistent without
  repeating long utility strings in route files.

The shared pages and the homepage all use the same navbar component, which makes
it easier to validate layout changes and keep the header behavior aligned across
the site.

### Usage

Install Deno (this project has been verified with Deno 2.9.8):

https://docs.deno.com/runtime/getting_started/installation

Install the project dependencies, then start the development server:

```sh
deno install
deno task dev
```

Open the local URL printed by Vite. The server watches the project directory and
reloads as files change.

To check the project and build and serve the production version:

```sh
deno task check
deno task build
deno task start
```

To update Deno, Fresh, and the remaining compatible dependencies:

```sh
deno upgrade
deno task update
deno update
deno install
```
