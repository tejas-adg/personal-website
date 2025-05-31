import { accessibilityMode } from "../global_signals.ts";

export default function AccessibilityStatus() {
	// Because this is an island, any change to accessibilityMode will trigger a rerender!
	return (
		<p class="text-lg text-gray-800 dark:text-gray-100 mb-4 text-left">
			Accessibility Mode is {accessibilityMode.value ? "on" : "off"}
		</p>
	);
}
