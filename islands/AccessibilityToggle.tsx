import Switch from "../components/Switch.tsx";
import { accessibilityMode } from "../global_signals.ts";

export default function AccessibilityToggle() {
	return (
		<Switch
			labelLeft="Accessibility Mode"
			value={accessibilityMode.value}
			onChange={(v) => (accessibilityMode.value = v)}
		/>
	);
}
