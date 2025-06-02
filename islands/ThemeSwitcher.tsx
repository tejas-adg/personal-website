import { useSignal } from "@preact/signals";
import Button from "../components/Button.tsx";

export default function ThemeSwitcher() {
	const isDark = useSignal(
		typeof window !== "undefined"
			? document.documentElement.classList.contains("dark")
			: false,
	);

	const toggleTheme = () => {
		const isDarkNow = document.documentElement.classList.toggle("dark");
		isDark.value = isDarkNow;
	};

	return (
		<Button
			variant="primary"
			shape="full"
			shadow="soft"
			label={isDark.value ? "☀️ Light" : "🌙 Dark"}
			aria-label="Toggle theme"
			onClick={toggleTheme}
			type="button"
		/>
	);
}
