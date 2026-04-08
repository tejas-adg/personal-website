# Personal Website

A small Fresh + Preact site for Tejas A. M.

## What’s here

- A minimal homepage in `routes/index.tsx`
- Shared layout and metadata in `routes/_app.tsx`
- Header controls for theme and accessibility
- A test playground under `routes/test.tsx`
- A tiny `/greet/:name` route for route testing
- A joke API at `routes/api/joke.ts`

## Run It

```sh
deno task start
```

## Checks

```sh
deno task check
```

## Notes

- The app uses Fresh with Tailwind.
- Dark mode is handled in the app shell and the theme switcher island.
