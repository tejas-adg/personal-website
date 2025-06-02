import { Head } from "$fresh/runtime.ts";
import TestingLayout from "../components/TestingLayout.tsx";
import InputMethodStatus from "../islands/InputMethodStatus.tsx";
import InputDetectorInit from "../islands/InputDetectorInit.tsx";

export default function TestRoute() {
	const navItems = [
		{ text: "Home" }, // /home
		{ text: "Testing", href: "/test" }, // current page
		{ text: "Blog" }, // /blog
		{ text: "About", href: "/about-page" }, // custom link
		{ text: "Contact" }, // /contact
	];

	return (
		<TestingLayout>
			<Head>
				<title>Testing Page</title>
				<meta name="description" content="A page for testing components." />
			</Head>
			
			{/* Initialize the input detector */}
			<InputDetectorInit />
			
			{/* Show the input method status */}
			<InputMethodStatus />
		</TestingLayout>
	);
}