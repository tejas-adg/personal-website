export function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      class="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      class="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function PaletteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      class="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 0 18h1.2a2.3 2.3 0 0 0 1.6-3.9 1.1 1.1 0 0 1 .8-1.9H17a4 4 0 0 0 4-4C21 6.7 17 3 12 3Z" />
      <circle cx="7.5" cy="10" r=".75" fill="currentColor" stroke="none" />
      <circle cx="10" cy="6.8" r=".75" fill="currentColor" stroke="none" />
      <circle cx="14" cy="6.8" r=".75" fill="currentColor" stroke="none" />
      <circle cx="17" cy="10" r=".75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MenuIcon({ open = false }: { open?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      class="h-5 w-5"
      aria-hidden="true"
    >
      {open
        ? <path d="m6 6 12 12M6 18 18 6" />
        : <path d="M5 6h14M5 12h14M5 18h14" />}
    </svg>
  );
}
