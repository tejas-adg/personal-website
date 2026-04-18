import { MoonIcon, SearchIcon } from "./icons.tsx";

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
  { label: "Exhibitions", href: "/" },
  { label: "Archives", href: "/navbar-test" },
  { label: "Atelier", href: "#controls" },
  { label: "Contact", href: "#footer" },
  { label: "Noir Guide", href: "/test" },
];

export function NavBar({
  brandLabel = "Tejas A. M.",
  brandHref = "#showcase",
  links = defaultLinks,
}: NavBarProps) {
  return (
    <nav class="fixed inset-x-0 top-4 z-50 px-4 sm:px-6">
      <div class="glass-nav mx-auto max-w-6xl">
        <div class="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a
            href={brandHref}
            class="font-headline text-lg italic text-on-surface sm:text-2xl"
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
            <button
              type="button"
              aria-label="Search showcase"
              class="nav-icon-button"
            >
              <SearchIcon />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
