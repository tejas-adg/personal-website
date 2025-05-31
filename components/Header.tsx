import ThemeSwitcher from "../islands/ThemeSwitcher.tsx";
import AccessibilityToggle from "../islands/AccessibilityToggle.tsx";

export default function Header() {
	return (
		<header class="w-full flex items-center justify-between px-8 py-4">
			<div class="text-2xl font-bold text-green-700 dark:text-green-300 select-none">
				Tejas A. M.
			</div>
			<AccessibilityToggle />
			<ThemeSwitcher />
		</header>
	);
}
