import { Head } from "$fresh/runtime.ts";
//import { useSignal } from "@preact/signals";
import TestingLayout from "../components/TestingLayout.tsx";
//import VerticalNavigation from "../islands/VerticalNavigation.tsx"; // adjust path as needed
//import VerticalNavigation from "../components/VNav.tsx"; // Importing the VerticalNavigation component
//import Button from "../components/Button.tsx";
//import Counter from "../islands/Counter.tsx";
//import ArrowUp from "../components/icons/outline/ArrowUp.tsx";
import InputMethodStatus from "../islands/InputMethodStatus.tsx";

export default function TestRoute() {
	//const c = useSignal(0); // Initialize a signal for the counter

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
			{/* <VerticalNavigation navItems={navItems} /> */}
			<InputMethodStatus />
		</TestingLayout>
	);
}
