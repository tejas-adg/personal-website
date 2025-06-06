// This file is auto-generated by build-icons.ts
// Icon: Power (outline)
/**
 * xmlns: http://www.w3.org/2000/svg, fill: none, viewBox: 0 0 24 24, stroke-width: 1.5, stroke: currentColor, aria-hidden: true, data-slot: icon
 */

import { IconBaseProps } from "../icon-base-props.ts";
type PowerProps = IconBaseProps;

export default function Power({
	size = 45,
	color = "currentColor",
	className = "",
	strokeWidth = "1.5",
	...rest
}: PowerProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width={strokeWidth}
			stroke={color}
			width={size}
			height={size}
			class={className}
			aria-hidden="true"
			data-slot="icon"
			{...rest}
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"
			/>
		</svg>
	);
}
