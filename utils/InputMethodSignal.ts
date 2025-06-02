// This is a simple, global signal (not reactivity library, just a shared variable).
export let isTouchInput = false;

// Guess based on screen width (opinionated: mobile is touch)
function guessInitialInput(): boolean {
	if (typeof globalThis === "undefined") return false; // SSR default: assume mouse
	return globalThis.matchMedia("(max-width: 900px)").matches;
}

// Actual detection/refinement
function updateInputMethod(next: boolean) {
	isTouchInput = next;
	// For testing/demo: Update any test label if present
	const label = document.getElementById("input-method-label");
	if (label) label.textContent = isTouchInput ? "Touch" : "Mouse";
}

export function initInputDetector() {
	if (typeof window === "undefined") return;

	// Initial guess
	updateInputMethod(guessInitialInput());

	// Touch detected
	globalThis.addEventListener("touchstart", () => updateInputMethod(true), {
		once: true,
		passive: true,
	});
	// Mouse detected
	globalThis.addEventListener("mousemove", () => updateInputMethod(false), {
		once: true,
		passive: true,
	});
}
