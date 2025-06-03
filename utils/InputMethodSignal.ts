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
    lastTouchTime: 0,
    lastMouseTime: 0,
    totalTouchEvents: 0,
    totalMouseEvents: 0,
		touchDetected: 0,
		mouseDetected: 0
  },
  initialGuess: false,
  lastSwitchTime: 0
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

// Update function with debouncing and smart switching
function updateInputMethod(method: "guess" | "touch-event" | "mouse-event" | "media-query", isTouchDevice: boolean, forceUpdate = false) {
	const now = Date.now();
	const oldValue = isTouchInput.value;
	const timeSinceLastSwitch = now - debugInfo.value.lastSwitchTime;
	
	// Debouncing: prevent rapid switching (ignore if less than 500ms since last switch)
	const DEBOUNCE_TIME = 500;
	if (!forceUpdate && timeSinceLastSwitch < DEBOUNCE_TIME && oldValue !== undefined) {
		console.log(`Debouncing: Ignoring ${method} switch (${timeSinceLastSwitch}ms since last switch)`);
		return;
	}
	
	// Only update if the value actually changed or it's forced
	if (forceUpdate || oldValue !== isTouchDevice) {
		isTouchInput.value = isTouchDevice;
		
		// Update debug info
		debugInfo.value = {
			...debugInfo.value,
			detectionMethod: method,
			lastSwitchTime: now
		};
		
		console.log(`🔄 Input method switched via ${method}: ${isTouchDevice ? 'Touch' : 'Mouse'} (was: ${oldValue ? 'Touch' : 'Mouse'})`);
		
		// Update UI labels
		updateLabels();
	}
}

function updateLabels() {
	const label = document.getElementById("input-method-label");
	const debugLabel = document.getElementById("debug-info");
	
	if (label) {
		label.textContent = isTouchInput.value ? "Touch" : "Mouse/Pointer";
	}
	
	if (debugLabel) {
		const lastTouchTime = debugInfo.value.events.lastTouchTime;
		const lastMouseTime = debugInfo.value.events.lastMouseTime;
		const timeSinceTouch = lastTouchTime ? Date.now() - lastTouchTime : 0;
		const timeSinceMouse = lastMouseTime ? Date.now() - lastMouseTime : 0;
		
		debugLabel.innerHTML = `
			<div><strong>Detection Method:</strong> ${debugInfo.value.detectionMethod}</div>
			<div><strong>Initial Guess:</strong> ${debugInfo.value.initialGuess ? 'Touch' : 'Mouse'}</div>
			<div><strong>Touch Events:</strong> ${debugInfo.value.events.totalTouchEvents} (last: ${lastTouchTime ? `${Math.round(timeSinceTouch/1000)}s ago` : 'never'})</div>
			<div><strong>Mouse Events:</strong> ${debugInfo.value.events.totalMouseEvents} (last: ${lastMouseTime ? `${Math.round(timeSinceMouse/1000)}s ago` : 'never'})</div>
			<div><strong>Media Query - Hover:</strong> ${debugInfo.value.mediaQueries.hover ? 'Yes' : 'No'}</div>
			<div><strong>Media Query - Coarse Pointer:</strong> ${debugInfo.value.mediaQueries.coarsePointer ? 'Yes' : 'No'}</div>
			<div><strong>Has Touch Events:</strong> ${'ontouchstart' in globalThis ? 'Yes' : 'No'}</div>
			<div><strong>User Agent:</strong> ${navigator.userAgent}</div>
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
		
		console.log("📱 Media Queries:", { hover, coarsePointer, anyHover });
	} catch (e) {
		console.log("❌ Media query check failed:", e);
	}
}

export function initInputDetector() {
	if (typeof globalThis === "undefined") return;
	
	console.log("🚀 Initializing dynamic input detector...");
	
	// Check media queries for debugging
	checkMediaQueries();
	
	// Make initial guess
	const initialGuess = guessInitialInput();
	debugInfo.value = {
		...debugInfo.value,
		initialGuess
	};
	
	console.log("🎯 Initial guess:", initialGuess ? "Touch" : "Mouse");
	console.log("🌐 User agent:", navigator.userAgent);
	console.log("📐 Screen width:", globalThis.innerWidth);
	console.log("👆 Has touch events:", 'ontouchstart' in globalThis);
	
	updateInputMethod("guess", initialGuess, true);
	
	// Track the current input mode dynamically
	let touchTimeout: number | null = null;
	let mouseTimeout: number | null = null;
	
	// Touch detection - listen for various touch events
	const touchEvents = ['touchstart', 'touchmove', 'touchend'];
	
	touchEvents.forEach(eventType => {
		globalThis.addEventListener(eventType, (e) => {
			const now = Date.now();
			
			// Update touch tracking
			debugInfo.value = {
				...debugInfo.value,
				events: {
					...debugInfo.value.events,
					lastTouchTime: now,
					totalTouchEvents: debugInfo.value.events.totalTouchEvents + 1
				}
			};
			
			console.log(`👆 Touch event: ${eventType} (#${debugInfo.value.events.totalTouchEvents})`);
			
			// Clear any pending mouse timeout
			if (mouseTimeout) {
				clearTimeout(mouseTimeout);
				mouseTimeout = null;
			}
			
			// Switch to touch immediately
			updateInputMethod("touch-event", true);
			
		}, { passive: true });
	});
	
	// Mouse detection - track meaningful mouse movements
	globalThis.addEventListener("mousemove", (e) => {
		// Only count as real mouse movement if there's actual movement
		// This helps filter out synthetic mouse events from touch
		if (e.movementX !== 0 || e.movementY !== 0) {
			const now = Date.now();
			
			// Update mouse tracking
			debugInfo.value = {
				...debugInfo.value,
				events: {
					...debugInfo.value.events,
					lastMouseTime: now,
					totalMouseEvents: debugInfo.value.events.totalMouseEvents + 1
				}
			};
			
			console.log(`🖱️ Mouse movement detected (#${debugInfo.value.events.totalMouseEvents})`);
			
			// Clear any pending touch timeout
			if (touchTimeout) {
				clearTimeout(touchTimeout);
				touchTimeout = null;
			}
			
			// Switch to mouse
			updateInputMethod("mouse-event", false);
		}
	}, { passive: true });
	
	// Mouse click detection (more reliable than mousemove for some cases)
	globalThis.addEventListener("mousedown", (e) => {
		const now = Date.now();
		
		// Update mouse tracking
		debugInfo.value = {
			...debugInfo.value,
			events: {
				...debugInfo.value.events,
				lastMouseTime: now,
				totalMouseEvents: debugInfo.value.events.totalMouseEvents + 1
			}
		};
		
		console.log(`🖱️ Mouse click detected (#${debugInfo.value.events.totalMouseEvents})`);
		updateInputMethod("mouse-event", false);
	}, { passive: true });
	
	// Listen for pointer events (most reliable when available)
	if (globalThis.PointerEvent) {
		globalThis.addEventListener("pointerdown", (e) => {
			const now = Date.now();
			
			console.log(`👉 Pointer event: ${e.pointerType} (${e.pressure})`);
			
			if (e.pointerType === "touch") {
				debugInfo.value = {
					...debugInfo.value,
					events: {
						...debugInfo.value.events,
						lastTouchTime: now,
						totalTouchEvents: debugInfo.value.events.totalTouchEvents + 1
					}
				};
				updateInputMethod("touch-event", true);
			} else if (e.pointerType === "mouse") {
				debugInfo.value = {
					...debugInfo.value,
					events: {
						...debugInfo.value.events,
						lastMouseTime: now,
						totalMouseEvents: debugInfo.value.events.totalMouseEvents + 1
					}
				};
				updateInputMethod("mouse-event", false);
			}
		}, { passive: true });
	}
	
	// Keyboard detection (indicates mouse/keyboard user)
	globalThis.addEventListener("keydown", (e) => {
		// Only count meaningful keyboard input (not just random keys)
		if (e.key.length === 1 || ['Tab', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
			const now = Date.now();
			
			debugInfo.value = {
				...debugInfo.value,
				events: {
					...debugInfo.value.events,
					lastMouseTime: now,
					totalMouseEvents: debugInfo.value.events.totalMouseEvents + 1
				}
			};
			
			console.log(`⌨️ Keyboard input detected: ${e.key}`);
			updateInputMethod("mouse-event", false);
		}
	}, { passive: true });
}