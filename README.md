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
returns the same 404 for absent, expired, stale, or insufficient authorization.
The check reads current tags from DynamoDB, so removal takes effect on the next
request. The initial recent-authentication window is 15 minutes, measured from
Cognito's verified original `auth_time`; normal activity never extends that
timestamp. The app does not promise a fresh password challenge from every social
provider. Do not place protected content in `static/` or pass it into a page
before this check has succeeded.

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
- [`routes/test.tsx`](./routes/test.tsx) is the Aster build journal linked from
  `Atelier`, with a nested timeline and the complete screenshot gallery.
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
[`data/aster-story.ts`](./data/aster-story.ts), with responsive layout in
[`assets/story.css`](./assets/story.css). Optimized, uncropped screenshots and
source hashes live in `static/aster/`; `gallery.json` records every unique game
capture. See [the editorial source notes](docs/aster-story-sources.md) for the
V7.5/V8 chronology and verification limits.

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
