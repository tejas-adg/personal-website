## 1) High-level structure

| Section                  | What it does                                                                           | Why it matters                                                    |
| ------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `@import "tailwindcss";` | Loads Tailwind CSS                                                                     | Lets the file use Tailwind utilities and `@apply`                 |
| `:root`                  | Defines raw design tokens (`--app-*`)                                                  | Central source of truth for colors, radius, blur, shadows, easing |
| `@theme inline`          | Maps raw tokens into Tailwind-friendly theme variables (`--color-*`, `--font-*`, etc.) | Makes custom design tokens usable throughout Tailwind classes     |
| `@layer base`            | Global HTML element styling                                                            | Establishes typography, links, headings, defaults, dark mode      |
| `@layer components`      | Reusable component classes                                                             | Defines buttons, cards, typography helpers, nav styles            |
| `@layer utilities`       | Small helper utility classes                                                           | Adds reusable transitions, focus rings, gradients                 |

---

## 1.1) Recent componentization notes

The navbar and its assets were moved out of the route files so the layout can be shared cleanly across the app:

- `components/NavBar.tsx` now contains the full shared navigation bar.
- `components/icons.tsx` contains the moon and search SVGs used by the nav.
- `components/urls.ts` contains shared remote image URLs that are reused by the showcase route.
- `routes/navbar-test.tsx` exists as a dedicated route for validating navbar behavior after `_app.tsx` started rendering the navbar globally.

The repeated utility-heavy button markup from the navbar was also collapsed into a reusable CSS class:

- `.nav-icon-button` is the compact circular icon button used for the moon and search controls.

This keeps the route files focused on page content instead of repeating shared header implementation details.

---

## 2) `:root` design tokens

### Color tokens

| Token                                   |         Value | Likely role                 |
| --------------------------------------- | ------------: | --------------------------- |
| `--app-color-lume`                      | `208 188 255` | Accent lavender             |
| `--app-color-vapor`                     | `196 193 251` | Secondary soft violet       |
| `--app-color-deep`                      |    `47 0 117` | Deep purple anchor tone     |
| `--app-color-background`                |    `24 15 35` | Main page background        |
| `--app-color-surface`                   |    `24 15 35` | Surface background          |
| `--app-color-surface-dim`               |    `24 15 35` | Dim surface                 |
| `--app-color-surface-bright`            |    `63 53 75` | Elevated brighter surface   |
| `--app-color-surface-container-lowest`  |    `18 10 29` | Deepest container           |
| `--app-color-surface-container-low`     |    `32 24 44` | Low-elevation container     |
| `--app-color-surface-container`         |    `36 28 48` | Standard card/container     |
| `--app-color-surface-container-high`    |    `47 38 59` | Higher-elevation container  |
| `--app-color-surface-container-highest` |    `58 49 70` | Highest-elevation container |
| `--app-color-surface-variant`           |    `58 49 70` | Alternate surface           |
| `--app-color-outline`                   | `148 142 153` | Borders/outline             |
| `--app-color-outline-variant`           |    `73 69 78` | Subtle borders              |
| `--app-color-primary`                   | `208 188 255` | Primary action color        |
| `--app-color-on-primary`                |    `60 0 145` | Text/icon on primary        |
| `--app-color-primary-container`         |    `47 0 117` | Darker primary container    |
| `--app-color-on-primary-container`      | `156 114 255` | Text on primary container   |
| `--app-color-primary-fixed`             | `233 221 255` | Fixed primary tone          |
| `--app-color-primary-fixed-dim`         | `208 188 255` | Dim fixed primary           |
| `--app-color-secondary`                 | `196 193 251` | Secondary accent            |
| `--app-color-on-secondary`              |    `45 42 91` | Text on secondary           |
| `--app-color-secondary-container`       |   `68 65 115` | Secondary container         |
| `--app-color-on-secondary-container`    | `179 175 233` | Text on secondary container |
| `--app-color-secondary-fixed`           | `227 223 255` | Fixed secondary             |
| `--app-color-secondary-fixed-dim`       | `196 193 251` | Dim fixed secondary         |
| `--app-color-tertiary`                  | `219 184 255` | Tertiary accent             |
| `--app-color-on-tertiary`               |    `63 33 96` | Text on tertiary            |
| `--app-color-tertiary-container`        |    `51 20 84` | Tertiary container          |
| `--app-color-on-tertiary-container`     | `159 126 195` | Text on tertiary container  |
| `--app-color-tertiary-fixed`            | `239 219 255` | Fixed tertiary              |
| `--app-color-tertiary-fixed-dim`        | `219 184 255` | Dim fixed tertiary          |
| `--app-color-on-background`             | `236 221 249` | Main text on background     |
| `--app-color-on-surface`                | `236 221 249` | Main text on surfaces       |
| `--app-color-on-surface-variant`        | `203 196 207` | Muted text                  |
| `--app-color-inverse-surface`           | `236 221 249` | Inverse surface             |
| `--app-color-inverse-on-surface`        |    `54 44 65` | Text on inverse surface     |
| `--app-color-inverse-primary`           |  `109 59 215` | Inverse primary             |
| `--app-color-error`                     | `255 180 171` | Error color                 |
| `--app-color-on-error`                  |     `105 0 5` | Text on error               |
| `--app-color-error-container`           |    `147 0 10` | Error background            |
| `--app-color-on-error-container`        | `255 218 214` | Text on error background    |

### Radius / blur / shadow / motion tokens

| Token                             | Value                                        | Role                           |
| --------------------------------- | -------------------------------------------- | ------------------------------ |
| `--app-radius-default`            | `0.125rem`                                   | Small radius                   |
| `--app-radius-lg`                 | `0.25rem`                                    | Medium radius                  |
| `--app-radius-xl`                 | `0.5rem`                                     | Large radius                   |
| `--app-radius-soft`               | `0.75rem`                                    | Softer rounded corners         |
| `--app-blur-glass`                | `20px`                                       | Blur for frosted glass effects |
| `--app-shadow-surface`            | `0 24px 48px -24px rgba(0, 0, 0, 0.55)`      | Shadow for cards/surfaces      |
| `--app-shadow-primary-glow`       | `0 24px 48px -24px rgba(208, 188, 255, 0.1)` | Soft primary glow              |
| `--app-shadow-primary-glow-hover` | `0 28px 60px -24px rgba(208, 188, 255, 0.3)` | Stronger hover glow            |
| `--app-shadow-nav-elevated`       | `0 40px 60px -15px rgba(0, 0, 0, 0.3)`       | Elevated nav shadow            |
| `--app-ease-standard`             | `cubic-bezier(0.4, 0, 0.2, 1)`               | Standard motion curve          |

---

## 3) `@theme inline` token mapping

This section turns the raw `--app-*` values into theme variables Tailwind can
use more naturally.

| Theme token group | Examples                                                      | Purpose                                            |
| ----------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| Color aliases     | `--color-primary`, `--color-background`, `--color-on-surface` | Makes colors available to Tailwind utility classes |
| Font aliases      | `--font-headline`, `--font-body`, `--font-label`              | Defines typography families                        |
| Radius aliases    | `--radius-default`, `--radius-soft`                           | Makes border-radius reusable                       |
| Shadow aliases    | `--shadow-surface`, `--shadow-primary-glow`                   | Reusable elevation/glow styles                     |
| Blur alias        | `--blur-glass`                                                | Used for glassmorphism                             |
| Motion alias      | `--ease-standard`                                             | Standard easing curve                              |

### Font mappings

| Theme variable    | Value                   | Usage                       |
| ----------------- | ----------------------- | --------------------------- |
| `--font-headline` | `"Newsreader", serif`   | Editorial, elegant headings |
| `--font-body`     | `"Manrope", sans-serif` | Main readable body font     |
| `--font-label`    | `"Manrope", sans-serif` | Labels, captions, UI text   |

---

## 4) `@layer base` global element styles

| Selector                                | Key styles                                                                                             | Meaning                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `html`                                  | `color-scheme: dark; background-color: rgb(var(--app-color-background));`                              | Forces dark UI mode and dark page background |
| `body`                                  | `bg-background font-body text-on-background`, smooth fonts, `font-size: 1.0625rem`, `line-height: 1.8` | Sets readable dark-theme defaults            |
| `body, button, input, select, textarea` | `font-optical-sizing: auto;`                                                                           | Better variable font rendering               |
| `h1, h2, h3, h4, h5, h6`                | `font-headline italic text-on-surface`, tight line-height, negative letter spacing                     | Gives headings an editorial, dramatic look   |
| `p, li, blockquote`                     | `font-body text-on-surface`                                                                            | Standard body copy styling                   |
| `label, figcaption, caption`            | muted text, tiny size, uppercase, wide tracking                                                        | Makes supporting text feel like UI labels    |
| `a, button`                             | transition duration/easing + selected transition properties                                            | Smooth hover/focus animation                 |
| `a`                                     | `text-primary`, custom underline color and offset                                                      | Styled links matching theme                  |
| `a:hover`                               | `text-secondary`                                                                                       | Subtle color shift on hover                  |
| `hr`                                    | `border-outline-variant/15`                                                                            | Very subtle divider                          |
| `::selection`                           | primary-tinted selection background                                                                    | Custom text highlight color                  |

---

## 5) Typography helper classes

| Class               | Key styles                                                       | Visual role                   |
| ------------------- | ---------------------------------------------------------------- | ----------------------------- |
| `.type-headline`    | Headline font, italic, `clamp(3rem, 7vw, 5.5rem)`, tight leading | Hero headlines                |
| `.type-subheadline` | Headline font, medium weight, `clamp(1.75rem, 3vw, 2.5rem)`      | Large section titles          |
| `.type-body`        | Body font, `clamp(1.125rem, 0.6vw + 1rem, 1.375rem)`             | Large readable paragraph text |
| `.type-label`       | Label font, uppercase, tracked out, `0.68rem`, bold              | UI labels, eyebrow text       |

---

## 6) Button system

### Shared button base

These selectors all share the same core structure:

- `.btn-base`
- `.btn-primary`
- `.btn-primary-soft`
- `.btn-secondary`
- `.btn-ghost`
- `.btn-primary-slate-colors`
- `.btn-primary-slate-colors-inverted`
- `.transparent-btn-slate-colors`
- `.transparent-btn-slate-colors-inverted`
- `.btn-primary-stone-colors`
- `.btn-primary-stone-colors-inverted`

| Shared styles                                        | Meaning                               |
| ---------------------------------------------------- | ------------------------------------- |
| `inline-flex items-center justify-center gap-2`      | Aligns icon + text nicely             |
| `rounded-soft border border-transparent px-4 py-2.5` | Consistent button shape/spacing       |
| `font-body text-sm font-semibold`                    | UI-appropriate text                   |
| Focus ring styles                                    | Accessible keyboard focus             |
| Disabled styles                                      | Prevents interaction and fades button |

### Button variants

| Class                                                                                           | Key visual treatment                                                                 | Best description           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------- |
| `.btn-primary`, `.btn-primary-slate-colors`, `.btn-primary-stone-colors`                        | Gradient from `primary` to `on-primary-container`, headline italic text, glow shadow | Main CTA buttons           |
| `.btn-primary-soft`, `.btn-primary-slate-colors-inverted`, `.btn-primary-stone-colors-inverted` | Surface background, subtle border, soft shadow, primary-tinted hover                 | Secondary elevated buttons |
| `.btn-secondary`, `.transparent-btn-slate-colors`                                               | Transparent background, outlined, secondary text                                     | Lighter alternative action |
| `.btn-ghost`, `.transparent-btn-slate-colors-inverted`                                          | Transparent, muted text, uppercase tracked label style                               | Minimal text-like button   |

### Button interaction patterns

| Pattern                           | Effect                    |
| --------------------------------- | ------------------------- |
| `hover:-translate-y-px`           | Slight lift on hover      |
| `hover:brightness-105`            | Small brightness increase |
| `hover:shadow-primary-glow-hover` | Stronger glow on hover    |
| `active:translate-y-0`            | Resets lift when pressed  |

---

## 7) Surface / card / nav components

| Class                         | Key styles                                                              | Visual purpose                  |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| `.card-surface`, `.card-base` | Rounded card, subtle border, themed surface bg, text color, shadow      | Reusable card container         |
| `.card-base`                  | Same as above + `p-8`                                                   | Standard padded card            |
| `.glass-nav`                  | Rounded, translucent background, border, elevated shadow, backdrop blur | Frosted glass navigation bar    |
| `.nav-link-text`              | Headline font, italic, transition                                      | Shared desktop nav text links   |
| `.nav-icon-button`            | Circular low-emphasis icon button with hover state                      | Shared nav utility buttons      |
| `.nav-divider`                | Bottom border                                                           | Divider for nav areas           |
| `.footer-divider`             | Top border                                                              | Divider for footer              |
| `.icon-muted`                 | `text-primary/40`, animated color/filter transitions                    | Low-emphasis icons              |
| `.icon-muted:hover`           | Full primary color + brightness boost                                   | Hoverable icon emphasis         |
| `.media-muted`                | Grayscale by default, color restored on hover                           | Subtle image/media hover effect |

---

## 8) Utility classes

| Class                   | What it does                                   | When to use it                 |
| ----------------------- | ---------------------------------------------- | ------------------------------ |
| `.my-colors-transition` | `transition-colors duration-300 ease-standard` | Smooth color changes           |
| `.focus-ring`           | Standard accessible focus ring                 | Reuse on interactive elements  |
| `.overlay-gradient`     | Gradient from background to transparent        | Overlay on media/hero sections |

---

## 9) Design style summary

| Trait                            | Evidence from file                                   | Interpretation                                  |
| -------------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| Dark theme                       | `color-scheme: dark`, deep purple backgrounds        | Site is intentionally dark-first                |
| Editorial typography             | `Newsreader` for headlines, italic headings          | Feels elegant and magazine-like                 |
| Soft purple branding             | Strong use of lavender/violet tokens                 | Brand identity leans dreamy/luminous            |
| Glassmorphism / layered surfaces | `backdrop-blur-glass`, many surface-container levels | Depth and atmospheric UI                        |
| Motion polish                    | Global transition easing, hover lift/glow            | UI aims to feel premium and responsive          |
| Strong token system              | Many CSS variables + theme mapping                   | Very maintainable and scalable styling approach |

---

## 10) Plain-English interpretation

| Part                | In simple terms                                              |
| ------------------- | ------------------------------------------------------------ |
| `:root`             | “Here are all my design ingredients.”                        |
| `@theme inline`     | “Make these ingredients usable inside Tailwind.”             |
| `@layer base`       | “Set the default look of the whole website.”                 |
| `@layer components` | “Here are my reusable design pieces like buttons and cards.” |
| `@layer utilities`  | “Here are a few small helper classes for common patterns.”   |

---

## 11) Biggest takeaways

| Takeaway                                | Why it stands out                                                   |
| --------------------------------------- | ------------------------------------------------------------------- |
| It is a token-driven design system      | Easy to retheme and keep consistent                                 |
| It uses Tailwind as the execution layer | Good mix of custom branding + utility workflow                      |
| It is visually polished and cohesive    | Typography, glow, spacing, hover motion all match                   |
| It feels intentionally premium          | Editorial serif + glass + muted purples creates a refined aesthetic |
