import { isTouchInput } from "../utils/InputMethodSignal.ts";

export default function InputMethodStatus() {
	return (
		<>
			<h1>Input Method Detector Test</h1>
			<div>
				<label>
					Current Input Method:&nbsp;
					<span id="input-method-label">
						{isTouchInput.value ? "Touch" : "Mouse"}
					</span>
				</label>
			</div>
			<p>
				Try opening this page on a phone or desktop, or switching between mouse
				and touch on a hybrid device.
			</p>
		</>
	);
}
