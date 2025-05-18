// Switch.tsx
import { useSignal } from "@preact/signals";
import { accessibilityMode } from "../global_signals.ts";

/**
 * SwitchProps: Configurable toggle switch
 * - Supports both controlled (via value/onChange) and uncontrolled (internal state) usage
 * - Custom labels, accessibility, and color classes
 */
interface SwitchProps {
  // Label shown to the left of the switch
  labelLeft?: string;
  // Label shown to the right of the switch
  labelRight?: string;
  // Classes for the left/right labels
  labelClass?: string;
  // Label INSIDE the switch when ON (default: "I")
  labelOn?: string;
  // Label INSIDE the switch when OFF (default: "O")
  labelOff?: string;
  // If present, overrides accessibilityMode for showing inside labels
  a11yOverride?: boolean;
  // Controlled value: pass to control the state from outside
  value?: boolean;
  // Callback called with new value when toggled (required if controlled)
  onChange?: (newState: boolean) => void;
  // Classes for switch track ON
  trackOnClass?: string;
  // Classes for switch track OFF
  trackOffClass?: string;
  // Classes for the knob (circle)
  knobClass?: string;
  // Classes for the root button (border, etc.)
  rootClass?: string;
  // Aria label for screen readers
  ariaLabel?: string;
}

/**
 * Switch Component
 * - Can be controlled (via value/onChange) or uncontrolled (manages its own state)
 * - Fully customizable with labels and color classes
 */
export default function Switch({
  labelLeft = "Left Label", // default label text for left
  labelRight = "Right Label", // default label text for right
  labelClass = "text-gray-700 dark:text-gray-300 text-base font-medium", // default label style
  labelOn = "I", // default ON label inside switch
  labelOff = "O", // default OFF label inside switch
  a11yOverride,
  value, // if defined, the switch is controlled
  onChange, // callback for controlled
  trackOnClass = "bg-green-300 dark:bg-green-800", // default track ON color
  trackOffClass = "bg-white dark:bg-gray-800", // default track OFF color
  knobClass = "bg-gray-500 dark:bg-gray-300", // default knob color
  rootClass = "border-2 border-gray-400", // default border
  ariaLabel, // accessible label
}: SwitchProps) {
  // Internal state for uncontrolled usage
  const internalSignal = useSignal(value ?? false);

  // Which value to use: controlled (from props) or uncontrolled (local)
  const checked = value !== undefined ? value : internalSignal.value;

  // Whether accessibility labels (inside switch) should be shown
  const a11y = a11yOverride !== undefined ? a11yOverride : accessibilityMode.value;

  return (
    <div class="flex items-center gap-4">
      {/* Optional label on the left side */}
      {labelLeft && (
        <span class={labelClass}>
          {labelLeft}
        </span>
      )}
      <button
        type="button"
        aria-pressed={checked} // accessibility: is the switch ON or OFF
        // ARIA label for the button (improves screen reader UX)
        aria-label={ariaLabel ?? (checked ? "Switch is on" : "Switch is off")} // screen reader text
        class={`relative flex items-center w-20 h-9 p-1 rounded-full my-colors-transition
          ${checked ? trackOnClass : trackOffClass} ${rootClass}`}
        onClick={() => {
          if (value !== undefined && onChange) {
            // Controlled mode: call parent handler only, do NOT update local state
            onChange(!checked);
          } else {
            // Uncontrolled mode: just update the local signal
            internalSignal.value = !internalSignal.value;
          }
        }}
      >
        {/* Internal ON/OFF labels for accessibility, positioned absolutely */}
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

        {/* The moving knob (the switch's handle) */}
        <span
          class={`
            rounded-full ${knobClass} shadow-md
            w-6 h-6 transition-transform duration-300
            ${checked ? "translate-x-11" : ""}
          `}
        />

        {/* For screen readers: describe state */}
        <span class="sr-only">
          {checked ? "On" : "Off"}
        </span>
      </button>
      {/* Optional label on the right side */}
      {labelRight && (
        <span class={labelClass}>
          {labelRight}
        </span>
      )}
    </div>
  );
}
