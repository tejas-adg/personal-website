import { useEffect } from "preact/hooks";
import { initInputDetector } from "../utils/InputMethodSignal.ts";

export default function InputDetectorInit() {
	useEffect(() => {
		console.log("InputDetectorInit island mounted, initializing detector...");
		initInputDetector();
	}, []);

	// This island is invisible - it just initializes the detector
	return null;
}
