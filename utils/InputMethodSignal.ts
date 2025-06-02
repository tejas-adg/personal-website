// This is a simple, global signal (not reactivity library, just a shared variable).
import { signal } from "@preact/signals";

export const isTouchInput = signal(false);
export const inputCapabilities = signal({
  hasHover: false,
  hasCoarsePointer: false,
  canHover: false
});

// Guess based on screen width (fallback for SSR)
function guessInitialInput(): boolean {
	if (typeof globalThis === "undefined") return false; // SSR default: assume mouse
	return globalThis.matchMedia("(max-width: 900px)").matches;
}

// Better detection using CSS media queries
function detectInputCapabilities() {
	if (typeof globalThis === "undefined") return { hasHover: false, hasCoarsePointer: false, canHover: false };
	
	const hasHover = globalThis.matchMedia("(hover: hover)").matches;
	const hasCoarsePointer = globalThis.matchMedia("(pointer: coarse)").matches;
	const canHover = globalThis.matchMedia("(any-hover: hover)").matches;
	
	return { hasHover, hasCoarsePointer, canHover };
}

// Update the signals based on media query results
function updateInputMethod() {
	const capabilities = detectInputCapabilities();
	inputCapabilities.value = capabilities;
	
	// Determine if this is primarily a touch device
	// Logic: If device has coarse pointer and cannot hover, it's likely touch-primary
	const isPrimaryTouch = capabilities.hasCoarsePointer && !capabilities.hasHover;
	isTouchInput.value = isPrimaryTouch;
	
	// For testing/demo: Update any test label if present
	const label = document.getElementById("input-method-label");
	const detailsLabel = document.getElementById("input-details-label");
	
	if (label) {
		label.textContent = isTouchInput.value ? "Touch" : "Mouse/Pointer";
	}
	
	if (detailsLabel) {
		detailsLabel.innerHTML = `
			<div>Can Hover: ${capabilities.hasHover ? 'Yes' : 'No'}</div>
			<div>Coarse Pointer: ${capabilities.hasCoarsePointer ? 'Yes' : 'No'}</div>
			<div>Any Hover: ${capabilities.canHover ? 'Yes' : 'No'}</div>
		`;
	}
}

export function initInputDetector() {
	if (typeof globalThis === "undefined") return;

	// Initial detection
	updateInputMethod();
	
	// Listen for changes in media queries (useful for hybrid devices)
	const hoverQuery = globalThis.matchMedia("(hover: hover)");
	const pointerQuery = globalThis.matchMedia("(pointer: coarse)");
	const anyHoverQuery = globalThis.matchMedia("(any-hover: hover)");
	
	// Modern browsers support addEventListener on MediaQueryList
	if (hoverQuery.addEventListener) {
		hoverQuery.addEventListener("change", updateInputMethod);
		pointerQuery.addEventListener("change", updateInputMethod);
		anyHoverQuery.addEventListener("change", updateInputMethod);
	} else {
		// Fallback for older browsers
		hoverQuery.addListener(updateInputMethod);
		pointerQuery.addListener(updateInputMethod);
		anyHoverQuery.addListener(updateInputMethod);
	}
	
	// Fallback: Also listen for actual input events (but don't rely on them primarily)
	let hasDetectedActualTouch = false;
	let hasDetectedActualMouse = false;
	
	// Only use these as refinements, not primary detection
 globalThis.addEventListener("touchstart", () => {
		if (!hasDetectedActualTouch) {
			hasDetectedActualTouch = true;
			console.log("Actual touch detected - confirming touch input");
			// Only override if media queries suggested mouse but we detected touch
			if (!isTouchInput.value) {
				console.log("Media query suggested mouse, but touch detected - switching to touch");
				isTouchInput.value = true;
			}
		}
	}, { once: true, passive: true });
	
 globalThis.addEventListener("mousemove", () => {
		if (!hasDetectedActualMouse) {
			hasDetectedActualMouse = true;
			console.log("Actual mouse movement detected");
			// Only override if media queries suggested touch but we detected precise mouse movement
			if (isTouchInput.value && !inputCapabilities.value.hasCoarsePointer) {
				console.log("Media query suggested touch, but precise mouse detected - switching to mouse");
				isTouchInput.value = false;
			}
		}
	}, { once: true, passive: true });
}