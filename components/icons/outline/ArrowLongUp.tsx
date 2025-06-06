// This file is auto-generated by build-icons.ts
// Icon: ArrowLongUp (outline)
/**
 * xmlns: http://www.w3.org/2000/svg, fill: none, viewBox: 0 0 24 24, stroke-width: 1.5, stroke: currentColor, aria-hidden: true, data-slot: icon
 */

import { IconBaseProps } from "../icon-base-props.ts";
type ArrowLongUpProps = IconBaseProps;

export default function ArrowLongUp({
	size = 45,
	color = "currentColor",
	className = "",
	strokeWidth = "1.5",
	...rest
}: ArrowLongUpProps) {
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
				d="M8.25 6.75 12 3m0 0 3.75 3.75M12 3v18"
			/>
		</svg>
	);
}
