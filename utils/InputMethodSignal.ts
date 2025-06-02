// This is a simple, global signal (not reactivity library, just a shared variable).
import { signal } from "@preact/signals";

export const isTouchInput = signal(false);
export const debugInfo = signal({
  detectionMethod: "none",
  mediaQueries: {
    hover: false,
    coarsePointer: false,
    anyHover: false
  },
  events: {
    touchDetected: false,
    mouseDetected: false
  },
  initialGuess: false
});

// Guess based on screen width and user agent (more aggressive initial guess)
function guessInitialInput(): boolean {
	if (typeof globalThis === "undefined") return false; // SSR default: assume mouse
	
	// Check user agent for mobile indicators
	const userAgent = navigator.userAgent.toLowerCase();
	const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
	
	// Check screen size
	const isSmallScreen = globalThis.matchMedia("(max-width: 900px)").matches;
	
	// Check if it's likely a touch device
	const hasTouchEvents = 'ontouchstart' in globalThis;
	
	return isMobileUA || isSmallScreen || hasTouchEvents;
}

// Update function with debugging
function updateInputMethod(method: "guess" | "touch-event" | "mouse-event" | "media-query", isTouchDevice: boolean) {
	const oldValue = isTouchInput.value;
	isTouchInput.value = isTouchDevice;
	
	// Update debug info
	debugInfo.value = {
		...debugInfo.value,
		detectionMethod: method
	};
	
	console.log(`Input method updated via ${method}: ${isTouchDevice ? 'Touch' : 'Mouse'} (was: ${oldValue ? 'Touch' : 'Mouse'})`);
	
	// Update UI labels
	updateLabels();
}

function updateLabels() {
	const label = document.getElementById("input-method-label");
	const debugLabel = document.getElementById("debug-info");
	
	if (label) {
		label.textContent = isTouchInput.value ? "Touch" : "Mouse/Pointer";
	}
	
	if (debugLabel) {
		debugLabel.innerHTML = `
			<div><strong>Detection Method:</strong> ${debugInfo.value.detectionMethod}</div>
			<div><strong>Initial Guess:</strong> ${debugInfo.value.initialGuess ? 'Touch' : 'Mouse'}</div>
			<div><strong>Touch Event Fired:</strong> ${debugInfo.value.events.touchDetected ? 'Yes' : 'No'}</div>
			<div><strong>Mouse Event Fired:</strong> ${debugInfo.value.events.mouseDetected ? 'Yes' : 'No'}</div>
			<div><strong>Media Query - Hover:</strong> ${debugInfo.value.mediaQueries.hover ? 'Yes' : 'No'}</div>
			<div><strong>Media Query - Coarse Pointer:</strong> ${debugInfo.value.mediaQueries.coarsePointer ? 'Yes' : 'No'}</div>
			<div><strong>Has Touch Events:</strong> ${'ontouchstart' in globalThis ? 'Yes' : 'No'}</div>
			<div><strong>User Agent:</strong> ${navigator.userAgent.substring(0, 50)}...</div>
		`;
	}
}

function checkMediaQueries() {
	if (typeof globalThis === "undefined") return;
	
	try {
		const hover = globalThis.matchMedia("(hover: hover)").matches;
		const coarsePointer = globalThis.matchMedia("(pointer: coarse)").matches;
		const anyHover = globalThis.matchMedia("(any-hover: hover)").matches;
		
		debugInfo.value = {
			...debugInfo.value,
			mediaQueries: { hover, coarsePointer, anyHover }
		};
		
		console.log("Media Queries:", { hover, coarsePointer, anyHover });
	} catch (e) {
		console.log("Media query check failed:", e);
	}
}

export function initInputDetector() {
	if (typeof globalThis === "undefined") return;
	
	console.log("Initializing input detector...");
	
	// Check media queries for debugging
	checkMediaQueries();
	
	// Make initial guess
	const initialGuess = guessInitialInput();
	debugInfo.value = {
		...debugInfo.value,
		initialGuess
	};
	
	console.log("Initial guess:", initialGuess ? "Touch" : "Mouse");
	console.log("User agent:", navigator.userAgent);
	console.log("Screen width:", globalThis.innerWidth);
	console.log("Has touch events:", 'ontouchstart' in globalThis);
	
	updateInputMethod("guess", initialGuess);
	
	// Set up event listeners with better logic
	let touchEventFired = false;
	let mouseEventFired = false;
	
	// Touch detection - any touch event indicates touch capability
	const touchEvents = ['touchstart', 'touchmove', 'touchend'];
	
	touchEvents.forEach(eventType => {
		globalThis.addEventListener(eventType, (e) => {
			if (!touchEventFired) {
				touchEventFired = true;
				debugInfo.value = {
					...debugInfo.value,
					events: { ...debugInfo.value.events, touchDetected: true }
				};
				console.log(`Touch event detected: ${eventType}`);
				updateInputMethod("touch-event", true);
			}
		}, { passive: true, once: true });
	});
	
	// Mouse detection - but be more careful about what constitutes "real" mouse input
	globalThis.addEventListener("mousemove", (e) => {
		// Ignore mouse events that are actually from touch
		// Check if this mousemove has real movement (not synthetic)
		if (!mouseEventFired && e.movementX !== 0 && e.movementY !== 0) {
			mouseEventFired = true;
			debugInfo.value = {
				...debugInfo.value,
				events: { ...debugInfo.value.events, mouseDetected: true }
			};
			console.log("Real mouse movement detected");
			// Only switch to mouse if we haven't detected touch yet
			if (!touchEventFired) {
				updateInputMethod("mouse-event", false);
			}
		}
	}, { passive: true });
	
	// Also listen for mouse enter/leave which are more reliable
	globalThis.addEventListener("mouseenter", () => {
		if (!mouseEventFired && !touchEventFired) {
			mouseEventFired = true;
			debugInfo.value = {
				...debugInfo.value,
				events: { ...debugInfo.value.events, mouseDetected: true }
			};
			console.log("Mouse enter detected");
			updateInputMethod("mouse-event", false);
		}
	}, { passive: true, once: true });
	
	// Listen for pointer events if available (more modern)
	if (globalThis.PointerEvent) {
		globalThis.addEventListener("pointerdown", (e) => {
			console.log(`Pointer event: ${e.pointerType}`);
			if (e.pointerType === "touch" && !touchEventFired) {
				touchEventFired = true;
				debugInfo.value = {
					...debugInfo.value,
					events: { ...debugInfo.value.events, touchDetected: true }
				};
				updateInputMethod("touch-event", true);
			} else if (e.pointerType === "mouse" && !mouseEventFired && !touchEventFired) {
				mouseEventFired = true;
				debugInfo.value = {
					...debugInfo.value,
					events: { ...debugInfo.value.events, mouseDetected: true }
				};
				updateInputMethod("mouse-event", false);
			}
		}, { passive: true, once: true });
	}
}