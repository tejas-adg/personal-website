# Fresh project

This repository now uses two branch tracks:

- `codex/dev2`: the vanilla Fresh v2 + Tailwind v4 initialization
- `codex/dev`: the adapted version built on top of that starter

Use `codex/dev2` if you want the clean baseline. Use `codex/dev` if you want the adapted project version.

## Current structure

The current work centered on moving repeated UI pieces out of the route files and into shared components:

- [`components/NavBar.tsx`](./components/NavBar.tsx) now owns the shared navigation bar used by the app shell.
- [`components/icons.tsx`](./components/icons.tsx) holds the reusable SVG icons used by the navbar.
- [`components/urls.ts`](./components/urls.ts) stores shared remote image URLs used by the showcase route.
- [`routes/exhibitions.tsx`](./routes/exhibitions.tsx) is a simple route test page for the `Exhibitions` link.
- [`routes/archives.tsx`](./routes/archives.tsx) is the renamed shared nav test page for `Archives`.
- [`routes/test.tsx`](./routes/test.tsx) is the lightweight route test page for `Atelier`.
- [`routes/contact.tsx`](./routes/contact.tsx) is the placeholder page for `Contact`.
- [`routes/noir-guide.tsx`](./routes/noir-guide.tsx) is the renamed showcase page for `Noir Guide`.

The navbar is rendered globally from [`routes/_app.tsx`](./routes/_app.tsx), so pages no longer need to import it individually unless they intentionally want a local override.

The current navbar targets are:

- `Exhibitions` -> `/exhibitions`
- `Archives` -> `/archives`
- `Atelier` -> `/test`
- `Contact` -> `/contact`
- `Noir Guide` -> `/noir-guide`

### Styling notes

The visual navbar styling now lives in [`assets/styles.css`](./assets/styles.css):

- `.glass-nav` provides the frosted container shell.
- `.nav-link-text` handles the shared text-link treatment for the desktop nav items.
- `.nav-icon-button` keeps the compact circular icon buttons consistent without repeating long utility strings in route files.

The shared pages and the homepage all use the same navbar component, which makes it easier to validate layout changes and keep the header behavior aligned across the site.

### Usage

Make sure to install Deno:

https://docs.deno.com/runtime/getting_started/installation

Then start the project in development mode:

```sh
deno task dev
```

This will watch the project directory and restart as necessary
