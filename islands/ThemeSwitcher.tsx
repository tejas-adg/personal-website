import { useSignal } from "@preact/signals";

export default function ThemeSwitcher() {
  const isDark = useSignal(
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );

  const toggleTheme = () => {
    const html = document.documentElement;
    const isDarkNow = html.classList.toggle("dark");
    isDark.value = isDarkNow;
  };

  return (
    <button
      class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-yellow-200 rounded-full px-4 py-2 transition-colors duration-300"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      type="button"
    >
      {isDark.value ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
