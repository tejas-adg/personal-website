// VerticalNavigation.tsx
// This component is a vertical navigation menu that highlights the active link.
// It is built to be dynamic so you can pass navigation items as props.
// Deno Fresh will handle this as an "island" or a component.

import { useState } from "preact/hooks";

// Define the type for each navigation item.
interface NavItem {
	text: string; // The label to display
	href?: string; // Optional: If provided, the link for the label
}

// Props for the whole component: an array of NavItem
interface VerticalNavigationProps {
	navItems: NavItem[];
}

export default function VerticalNavigation(
	{ navItems }: VerticalNavigationProps,
) {
	// Store the active link in state. Initialize with the first item in navItems.
	const [activeHref, setActiveHref] = useState<string>(
		navItems[0]?.href || `/${navItems[0]?.text.toLowerCase()}`,
	);

	// Helper function to get the href for each nav item
	function getHref(item: NavItem): string {
		// If the item has an href, use it
		// Otherwise, default to "/" + lowercased text
		return item.href ? item.href : `/${item.text.toLowerCase()}`;
	}

	// Render the navigation menu
	return (
		<nav // Set background and text colors according to user preferences (using Tailwind classes)
		 class="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-screen w-56 flex flex-col p-4 gap-2 shadow-md rounded-2xl" // min-h-screen: full viewport height
			// w-56: fixed width (14rem)
			// flex-col: vertical layout
			// p-4: padding
			// gap-2: spacing between items
			// shadow-md: subtle shadow
			// rounded-2xl: large rounded corners
		>
			{navItems.map((item) => {
				// Compute the href for this nav item
				const href = getHref(item);
				return (
					<a
						// Use "a" tag for navigation
						//href={href}
						// Set Tailwind classes for styling and active effect
						class={
							// flex items-center: horizontal layout inside the link
							// px-3 py-2: padding for each item
							// rounded-lg: rounded edges
							// font-bold: only if active
							// bg-slate-200: subtle highlight if active (light)
							// bg-slate-800/80: subtle highlight if active (dark)
							// transition-colors: smooth hover/active transitions
							`flex items-center px-3 py-2 rounded-lg transition-colors duration-150 select-none cursor-pointer ` +
							(activeHref === href
								? "bg-slate-200 dark:bg-slate-800/40 font-bold"
								: "hover:bg-slate-200 dark:hover:bg-slate-800/40 font-normal")
						}
						// When clicked, set this as active (without preventing navigation)
						onClick={() => setActiveHref(href)}
						// Give each link a unique key (using href is fine)
						key={href}
					>
						{/* Show the navigation text */}
						{item.text}
					</a>
				);
			})}
		</nav>
	);
}
