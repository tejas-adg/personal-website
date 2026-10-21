import { useEffect, useId, useRef, useState } from "preact/hooks";
import { MenuIcon } from "../components/icons.tsx";
import type { NavLink } from "../components/NavBar.tsx";

export default function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const closeOutside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const desktop = globalThis.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <div ref={container} class="lg:hidden">
      <button
        ref={toggle}
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls={menuId}
        class="nav-icon-button focus-ring min-h-11 min-w-11"
        onClick={() => setOpen(!open)}
      >
        <MenuIcon open={open} />
      </button>
      <div
        id={menuId}
        hidden={!open}
        class="nav-dropdown absolute inset-x-0 top-full mt-3 max-h-[calc(100dvh-7rem)] overflow-y-auto p-2 sm:p-3"
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            class="nav-link-text focus-ring block rounded-xl px-4 py-3 text-base hover:bg-surface-container-high"
            onClick={() => setOpen(false)}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
