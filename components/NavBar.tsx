import { MoonIcon } from "./icons.tsx";

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
    <nav class="fixed inset-x-0 top-4 z-50 px-4 sm:px-6">
      <div class="glass-nav mx-auto max-w-6xl">
        <div class="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a
            href={brandHref}
            class="font-headline text-lg italic text-on-surface sm:text-2xl aria-[current=page]:text-primary aria-[current=page]:hover:text-primary-fixed"
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

          <div class="flex items-center gap-2 sm:gap-3">
            <span class="type-label hidden text-primary/70">Noir Guide</span>
            <button
              type="button"
              aria-label="Theme indicator"
              class="nav-icon-button"
            >
              <MoonIcon />
            </button>
            {/*<button
              type="button"
              aria-label="Search showcase"
              class="nav-icon-button"
            >
              <SearchIcon />
            </button>*/}
          </div>
        </div>
      </div>
    </nav>
  );
}
