// VerticalNavigation.tsx
// A vertical navigation menu for Deno Fresh that highlights the active link using [data-current] attribute (no state required)

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
	// Helper function to get the href for each nav item
	function getHref(item: NavItem): string {
		// If the item has an href, use it
		// Otherwise, default to "/" + lowercased text
		return item.href ? item.href : `/${item.text.toLowerCase()}`;
	}

	// Render the navigation menu
	return (
		<nav // Set background and text colors according to user preferences (using Tailwind classes)
		 class="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-screen w-56 flex flex-col p-4 gap-2 rounded-2xl transition-colors duration-300">
			{navItems.map((item) => {
				// Compute the href for this nav item
				const href = getHref(item);
				return (
					<a
						href={href} // The navigation link
						key={href} // Unique key for React/Preact rendering
						// Tailwind classes: use aria-[current] to style the active link
						class={
							// flex items-center: horizontal layout inside the link
							// px-3 py-2: padding for each item
							// rounded-lg: rounded edges
							// transition-colors: smooth hover/active transitions
							// aria-[current]:...: apply bold and highlight to the current/active link only
							`flex items-center px-3 py-2 rounded-lg transition-colors duration-150 select-none cursor-pointer font-normal 
                hover:bg-slate-200/50 dark:hover:bg-slate-800/45
                aria-[current]:font-bold aria-[current]:bg-slate-200 aria-[current]:dark:bg-slate-800/90`
						}
					>
						{item.text}
					</a>
				);
			})}
		</nav>
	);
}
