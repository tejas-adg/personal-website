// Button.tsx – A flexible, fully-commented Preact button component using Tailwind CSS classes

import { JSX } from "preact";

/**
 * Props for the Button component
 */
interface ButtonProps {
	/** Text label displayed inside the button */
	label: string;
	/**
	 * Color scheme:
	 * - 'primary': solid slate
	 * - 'option-a': light gray solid
	 * - 'option-b': outlined
	 * - 'option-c': outlined with secondary hover
	 */
	variant?: "primary" | "option-a" | "option-b" | "option-c";
	/** Corner radius:
	 * - 'square': 0
	 * - 'small': md
	 * - 'large': lg
	 * - 'full': pill
	 */
	shape?: "square" | "small" | "large" | "full";
	/** Shadow profile:
	 * - 'none'
	 * - 'soft': subtle soft shadow
	 * - 'bottom': raised bottom-edge
	 * - 'top': raised top-edge
	 */
	shadow?: "none" | "soft";
	/** Gradient overlay:
	 * - 'none'
	 * - 'vertical': top-to-bottom
	 * - 'horizontal': left-to-right
	 */
	gradient?: "none" | "vertical" | "horizontal";
	/** Border style - only applies to 'option-b' and 'option-c' variants:
	 * - 'none': no special border styling
	 * - 'thin': 1px border
	 * - 'medium': 2px border
	 * - 'thick': 3px border
	 */
	border?: "none" | "thin" | "medium" | "thick";
	/** Icon placement relative to label */
	iconPosition?: "left" | "right";
	/** Any Preact children (e.g., icon components) */
	children?: JSX.Element;
	/** Additional button attributes like onClick, type, disabled, etc. */
	[key: string]: unknown;
}

/**
 * Button component
 */
const Button = ({
	label,
	variant = "primary",
	shape = "small",
	shadow = "none",
	gradient = "none",
	border = "none",
	iconPosition,
	children,
	extraClass = "",
	...rest
}: ButtonProps) => {
	// Map props to Tailwind classes
	const variantClasses: Record<string, string> = {
		primary: "btn-primary-slate-colors",
		"option-a": "btn-primary-slate-colors-inverted",
		"option-b": "transparent-btn-slate-colors",
		"option-c": "transparent-btn-slate-colors-inverted",
	};

	const shapeClasses = {
		square: "rounded-none",
		small: "rounded-md",
		large: "rounded-lg",
		full: "rounded-full",
	};

	const gradientClasses = {
		none: "",
		vertical: "bg-gradient-to-b from-slate-500 to-slate-700",
		horizontal: "bg-gradient-to-r from-slate-500 to-slate-700",
	};

	const shadowClasses = {
		none: "shadow-none",
		soft:
			"shadow-sm dark:shadow-md shadow-slate-500/25 dark:shadow-slate-950/25 active:shadow-none dark:active:shadow-none", // More visible soft shadow using Tailwind classes
	};

	// Border style classes - only applied for option-b and option-c variants
	const borderClasses = {
		none: "",
		thin: "border border-slate-300",
		medium: "border-2 border-slate-300",
		thick: "border-4 border-slate-300",
	};

	// Check if current variant supports custom border styling
	// Get the border class to apply
	const borderClass =
		(variant === "option-b" || variant === "option-c") && border !== "none"
			? borderClasses[border]
			: "";

	// Combine all class segments
	const classes = [
		"inline-flex items-center justify-center px-4 py-2 font-medium outline-none transition-colors duration-300",
		gradient !== "none" ? gradientClasses[gradient] : variantClasses[variant],
		shapeClasses[shape],
		shadowClasses[shadow],
		borderClass,
		extraClass,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<button className={classes} {...rest}>
			{/* Icon on left if specified */}
			{iconPosition === "left" && children && (
				<span className="mr-2 inline-flex items-center">{children}</span>
			)}

			{/* Button label */}
			<span>{label}</span>

			{/* Icon on right if specified */}
			{iconPosition === "right" && children && (
				<span className="ml-2 inline-flex items-center">{children}</span>
			)}
		</button>
	);
};

export default Button;
