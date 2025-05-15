import { useSignal } from "@preact/signals";

export default function Switch() {
  const isOn = useSignal(false);

  return (
    <button
      type="button"
      aria-pressed={isOn.value}
      class={`relative w-16 h-8 rounded-full border-2 border-gray-400 transition-colors duration-300 
        flex items-center ${isOn.value ? "bg-switch-on" : "bg-switch-off"}`}
      onClick={() => (isOn.value = !isOn.value)}
    >
      <span
        class={`absolute left-1 top-1 w-6 h-6 rounded-full shadow-md dark:bg-white bg-gray-900 transition-all duration-300
          ${isOn.value ? "translate-x-8" : ""}`}
      />
      {/* On/off indicator text (optional) */}
      <span
        class={`ml-20 font-bold text-sm select-none text-gray-800 dark:text-gray-100`}
      >
        {isOn.value ? "ON" : "OFF"}
      </span>
    </button>
  );
}
