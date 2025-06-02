import { isTouchInput, inputCapabilities } from "../utils/InputMethodSignal.ts";

export default function InputMethodStatus() {
	return (
		<div class="p-6 space-y-4">
			<h1 class="text-2xl font-bold">Input Method Detector Test</h1>
			
			<div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
				<h2 class="text-lg font-semibold mb-2">Primary Input Method</h2>
				<div class="text-xl">
					<span class="font-medium">Current Input Method: </span>
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

			<div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
				<h2 class="text-lg font-semibold mb-2">Device Capabilities</h2>
				<div id="input-details-label" class="space-y-2">
					<div class="flex items-center gap-2">
						<span class="font-medium">Can Hover:</span>
						<span class={`px-2 py-1 rounded text-sm ${
							inputCapabilities.value.hasHover ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
						}`}>
							{inputCapabilities.value.hasHover ? 'Yes' : 'No'}
						</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="font-medium">Coarse Pointer:</span>
						<span class={`px-2 py-1 rounded text-sm ${
							inputCapabilities.value.hasCoarsePointer ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'
						}`}>
							{inputCapabilities.value.hasCoarsePointer ? 'Yes' : 'No'}
						</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="font-medium">Any Hover:</span>
						<span class={`px-2 py-1 rounded text-sm ${
							inputCapabilities.value.canHover ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
						}`}>
							{inputCapabilities.value.canHover ? 'Yes' : 'No'}
						</span>
					</div>
				</div>
			</div>

			<div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
				<h2 class="text-lg font-semibold mb-2">Testing Instructions</h2>
				<ul class="space-y-2 text-sm">
					<li>📱 <strong>On Mobile:</strong> Should show "Touch" with Can Hover: No, Coarse Pointer: Yes</li>
					<li>🖥️ <strong>On Desktop:</strong> Should show "Mouse/Pointer" with Can Hover: Yes, Coarse Pointer: No</li>
					<li>💻 <strong>On Laptop with Touchscreen:</strong> May show "Mouse/Pointer" initially, but touch the screen to see if it switches</li>
					<li>🖱️ <strong>Hybrid Device:</strong> Try switching between mouse and touch to see real-time detection</li>
				</ul>
			</div>

			<div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
				<h2 class="text-lg font-semibold mb-2">What This Means for Navigation</h2>
				<div class="text-sm space-y-1">
					{isTouchInput.value ? (
						<>
							<p class="text-blue-700 dark:text-blue-300">✅ <strong>Touch Mode:</strong> Menu items will require tap to expand, then tap again to navigate</p>
							<p class="text-gray-600 dark:text-gray-400">❌ <strong>Hover:</strong> Disabled - menus won't expand on hover</p>
						</>
					) : (
						<>
							<p class="text-green-700 dark:text-green-300">✅ <strong>Mouse Mode:</strong> Menu items will expand on hover, click to navigate</p>
							<p class="text-gray-600 dark:text-gray-400">❌ <strong>Touch Expansion:</strong> Not needed - hover handles menu expansion</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
}