import MobileNav from "../islands/MobileNav.tsx";
import { PaletteIcon } from "./icons.tsx";

export type NavLink = {
  label: string;
  href: string;
};

export interface NavBarProps {
  brandLabel?: string;
  brandHref?: string;
  links?: NavLink[];
}

const defaultLinks: NavLink[] = [
  { label: "Exhibitions", href: "/exhibitions" },
  { label: "Archives", href: "/archives" },
  { label: "Atelier", href: "/test" },
  { label: "Contact", href: "/contact" },
  { label: "Noir Guide", href: "/noir-guide" },
];

export function NavBar({
  brandLabel = "Tejas A. M.",
  brandHref = "/",
  links = defaultLinks,
}: NavBarProps) {
  return (
    <nav
      aria-label="Main navigation"
      class="fixed inset-x-0 top-4 z-50 px-4 sm:px-6"
    >
      <div class="relative mx-auto max-w-6xl">
        <div
          aria-hidden="true"
          class="glass-nav pointer-events-none absolute inset-0"
        />
        <div class="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <a
            href={brandHref}
            class="shrink-0 font-headline text-lg italic text-on-surface sm:text-2xl aria-[current=page]:text-primary aria-[current=page]:hover:text-primary-fixed"
          >
            {brandLabel}
          </a>

          <div class="hidden items-center gap-7 lg:flex">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                class="nav-link-text"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div class="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Change theme"
              title="Change theme"
              class="nav-icon-button focus-ring min-h-11 min-w-11 lg:min-h-9 lg:min-w-9"
            >
              <PaletteIcon />
            </button>
            <MobileNav links={links} />
          </div>
        </div>
      </div>
    </nav>
  );
}
