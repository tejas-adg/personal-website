import { isTouchInput, debugInfo } from "../utils/InputMethodSignal.ts";

export default function InputMethodStatus() {
	return (
		<div class="p-6 space-y-4 max-w-4xl">
			<h1 class="text-2xl font-bold">Input Method Detector Test</h1>
			
			<div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
				<h2 class="text-lg font-semibold mb-2">Current Detection Result</h2>
				<div class="text-xl">
					<span class="font-medium">Input Method: </span>
					<span 
						id="input-method-label"
						class={`px-3 py-1 rounded-full text-white ${
							isTouchInput.value ? 'bg-blue-500' : 'bg-green-500'
						}`}
					>
						{isTouchInput.value ? "Touch" : "Mouse/Pointer"}
					</span>
				</div>
			</div>

			<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
				<h2 class="text-lg font-semibold mb-2">Debug Information</h2>
				<div id="debug-info" class="space-y-1 text-sm font-mono">
					<div><strong>Detection Method:</strong> {debugInfo.value.detectionMethod}</div>
					<div><strong>Initial Guess:</strong> {debugInfo.value.initialGuess ? 'Touch' : 'Mouse'}</div>
					<div><strong>Touch Event Fired:</strong> {debugInfo.value.events.touchDetected ? 'Yes' : 'No'}</div>
					<div><strong>Mouse Event Fired:</strong> {debugInfo.value.events.mouseDetected ? 'Yes' : 'No'}</div>
					<div><strong>Media Query - Hover:</strong> {debugInfo.value.mediaQueries.hover ? 'Yes' : 'No'}</div>
					<div><strong>Media Query - Coarse Pointer:</strong> {debugInfo.value.mediaQueries.coarsePointer ? 'Yes' : 'No'}</div>
					<div><strong>Has Touch Events:</strong> {typeof window !== 'undefined' && 'ontouchstart' in window ? 'Yes' : 'No'}</div>
					<div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'Not available'}</div>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
					<h3 class="font-semibold mb-2 text-green-800 dark:text-green-200">✅ Try These Actions</h3>
					<ul class="text-sm space-y-2">
						<li><strong>On Phone:</strong> Just loading this page should detect touch</li>
						<li><strong>On Desktop:</strong> Move your mouse cursor around</li>
						<li><strong>Touchscreen Laptop:</strong> Touch anywhere on the screen</li>
						<li><strong>Hybrid Device:</strong> Try both mouse and touch</li>
					</ul>
				</div>
				
				<div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
					<h3 class="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">🔍 What to Look For</h3>
					<ul class="text-sm space-y-2">
						<li><strong>Initial Guess:</strong> Should be Touch on mobile, Mouse on desktop</li>
						<li><strong>Event Detection:</strong> Should fire when you interact</li>
						<li><strong>User Agent:</strong> Should contain mobile indicators on phones</li>
						<li><strong>Console:</strong> Check browser console for debug logs</li>
					</ul>
				</div>
			</div>

			<div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
				<h2 class="text-lg font-semibold mb-2">Manual Test Buttons</h2>
				<p class="text-sm mb-3">Click these buttons to manually trigger detection events for testing:</p>
				<div class="space-x-2">
					<button
						type="button"
						class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						onClick={() => {
							// Manually dispatch a touch event
							const event = new Event('touchstart');
							globalThis.dispatchEvent(event);
							console.log("Manual touch event dispatched");
						}}
					>
						Simulate Touch Event
					</button>
					<button 
						type="button"
						class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
						onMouseMove={(e) => {
							console.log("Mouse move on button:", e.movementX, e.movementY);
						}}
					>
						Hover for Mouse Event
					</button>
				</div>
			</div>

			<div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
				<h2 class="text-lg font-semibold mb-2">🔧 Troubleshooting</h2>
				<div class="text-sm space-y-2">
					<p><strong>If it won't switch from Mouse to Touch:</strong></p>
					<ul class="list-disc ml-6 space-y-1">
						<li>Make sure you're actually touching the screen (not just scrolling)</li>
						<li>Check if touch event counter increases when you touch</li>
						<li>Some devices need a firm, deliberate touch</li>
					</ul>
					<p class="mt-3"><strong>If it won't switch from Touch to Mouse:</strong></p>
					<ul class="list-disc ml-6 space-y-1">
						<li>Move the mouse cursor (not just clicks)</li>
						<li>Try typing on the keyboard</li>
						<li>Check if mouse event counter increases</li>
						<li>Wait 500ms between switches (debouncing)</li>
					</ul>
					<p class="mt-3"><strong>General debugging:</strong></p>
					<ul class="list-disc ml-6 space-y-1">
						<li>Watch the event counters and timestamps</li>
						<li>Check browser console for real-time logs</li>
						<li>Try the manual test buttons if needed</li>
					</ul>
				</div>
			</div>
		</div>
	);
}