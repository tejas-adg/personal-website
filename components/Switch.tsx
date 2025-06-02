import { useSignal } from "@preact/signals";
import { accessibilityMode } from "../global_signals.ts";

/**
 * Props for the Switch component.
 *
 * This component implements a customizable, accessible toggle switch
 * that can be used in forms, settings, and UI controls. It supports:
 * - **Uncontrolled** mode (manages its own state internally)
 * - **Controlled** mode (state is managed by parent via `value`/`onChange` props)
 * - Custom label text on the left and right of the switch
 * - Custom inside labels (e.g. "ON"/"OFF", "I"/"O") for accessibility
 * - Configurable colors and styles via CSS class props
 * - Full accessibility and screen reader support
 *
 * @example
 * ```tsx
 * // Uncontrolled usage (internal state)
 * <Switch labelLeft="Notifications" />
 *
 * // Controlled usage
 * const [checked, setChecked] = useState(false);
 * <Switch
 *   labelLeft="Dark Mode"
 *   value={checked}
 *   onChange={setChecked}
 *   labelOn="ON"
 *   labelOff="OFF"
 * />
 * ```
 */
export interface SwitchProps {
	/** Label shown to the left of the switch (optional) */
	labelLeft?: string;
	/** Label shown to the right of the switch (optional) */
	labelRight?: string;
	/** Classes for the left/right labels (optional, for style customization) */
	labelClass?: string;
	/** Label shown *inside* the switch when ON (default: "I") */
	labelOn?: string;
	/** Label shown *inside* the switch when OFF (default: "O") */
	labelOff?: string;
	/**
	 * If present, overrides the global accessibilityMode for showing
	 * inside labels ("ON"/"OFF" or "I"/"O"). Useful for accessibility testing.
	 */
	a11yOverride?: boolean;
	/**
	 * If provided, puts the switch in **controlled** mode.
	 * Use with `onChange` to synchronize state with parent.
	 */
	value?: boolean;
	/**
	 * Callback function when the switch is toggled.
	 * Only needed if using controlled mode.
	 * @param newState - the new on/off state of the switch (true/false)
	 */
	onChange?: (newState: boolean) => void;
	/** CSS classes for the switch "track" when ON (background color, etc.) */
	trackOnClass?: string;
	/** CSS classes for the switch "track" when OFF (background color, etc.) */
	trackOffClass?: string;
	/** CSS classes for the switch "knob" (the moving circle) */
	knobClass?: string;
	/** Additional CSS classes for the root button (border, etc.) */
	rootClass?: string;
	/** Accessible label for screen readers (aria-label) */
	ariaLabel?: string;
}

/**
 * Switch - A highly customizable, accessible toggle switch.
 *
 * - Can be used standalone or controlled by a parent component.
 * - Supports screen readers, keyboard navigation, and accessibility best practices.
 * - Use for any kind of on/off or yes/no setting in your web app.
 *
 * @param props - {@link SwitchProps}
 * @returns A toggle switch React/Preact component
 */
export default function Switch({
	labelLeft = "",
	labelRight = "",
	labelClass = "text-slate-800 dark:text-slate-100 text-base font-medium",
	labelOn = "I",
	labelOff = "O",
	a11yOverride,
	value,
	onChange,
	trackOnClass = "bg-green-300 dark:bg-green-800",
	trackOffClass = "bg-white dark:bg-gray-800",
	knobClass = "bg-gray-500 dark:bg-gray-300",
	rootClass = "border-2 border-gray-400",
	ariaLabel,
}: SwitchProps) {
	/**
	 * Internal signal used for **uncontrolled** (self-managed) state.
	 * If `value` is provided (controlled mode), this signal is ignored.
	 */
	const internalSignal = useSignal(value ?? false);

	/**
	 * The current checked state:
	 * - In controlled mode: uses `value` prop
	 * - In uncontrolled mode: uses internal signal
	 */
	const checked = value !== undefined ? value : internalSignal.value;

	/**
	 * Whether accessibility labels inside the switch should be shown.
	 * Uses a local override if provided, otherwise falls back to the app-wide
	 * accessibility mode signal.
	 */
	const a11y = a11yOverride !== undefined
		? a11yOverride
		: accessibilityMode.value;

	return (
		<div class="flex items-center gap-4">
			{/* Label on the left side (optional) */}
			{labelLeft && (
				<span class={labelClass}>
					{labelLeft}
				</span>
			)}

			<button
				type="button"
				aria-pressed={checked}
				aria-label={ariaLabel ?? (checked ? "Switch is on" : "Switch is off")}
				class={`relative flex items-center w-20 h-9 p-1 rounded-full my-colors-transition
          ${checked ? trackOnClass : trackOffClass} ${rootClass}`}
				/**
				 * When clicked, toggles the switch state:
				 * - In controlled mode: calls `onChange` to notify parent (does NOT update internal state)
				 * - In uncontrolled mode: updates the internal signal directly
				 */
				onClick={() => {
					if (value !== undefined && onChange) {
						onChange(!checked);
					} else {
						internalSignal.value = !internalSignal.value;
					}
				}}
			>
				{/* Inside labels for accessibility (e.g. "ON"/"OFF"), shown based on a11y setting */}
				{a11y && (
					<>
						<span
							class={`absolute left-3 text-base text-gray-500 dark:text-gray-200 font-bold select-none pointer-events-none transition-opacity duration-300
                ${checked ? "opacity-100" : "opacity-0"}`}
						>
							{labelOn}
						</span>
						<span
							class={`absolute right-2 text-base text-gray-500 dark:text-gray-200 font-bold select-none pointer-events-none transition-opacity duration-300
                ${checked ? "opacity-0" : "opacity-100"}`}
						>
							{labelOff}
						</span>
					</>
				)}

				{/* The "knob" (the circle that slides left/right) */}
				<span
					class={`
            rounded-full ${knobClass} shadow-sm dark:shadow-md
            w-6 h-6 transition-transform duration-150
            ${checked ? "translate-x-11" : ""}
          `}
				/>

				{/* Screen reader-only text for current state */}
				<span class="sr-only">
					{checked ? "On" : "Off"}
				</span>
			</button>

			{/* Label on the right side (optional) */}
			{labelRight && (
				<span class={labelClass}>
					{labelRight}
				</span>
			)}
		</div>
	);
}
