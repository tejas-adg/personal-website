// This file is auto-generated by build-icons.ts
// Icon: ArrowUp (outline)
/**
 * xmlns: http://www.w3.org/2000/svg, fill: none, viewBox: 0 0 24 24, stroke-width: 1.5, stroke: currentColor, aria-hidden: true, data-slot: icon
 */

import { IconBaseProps } from "../icon-base-props.ts";
type ArrowUpProps = IconBaseProps;

export default function ArrowUp({
	size = 45,
	color = "currentColor",
	className = "",
	strokeWidth = "1.5",
	...rest
}: ArrowUpProps) {
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
				d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
			/>
		</svg>
	);
}
