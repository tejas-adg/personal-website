// This file is auto-generated by build-icons.ts
// Icon: ArrowLeftCircle (outline)
/**
 * xmlns: http://www.w3.org/2000/svg, fill: none, viewBox: 0 0 24 24, stroke-width: 1.5, stroke: currentColor, aria-hidden: true, data-slot: icon
 */

import { IconBaseProps } from "../icon-base-props.ts";
type ArrowLeftCircleProps = IconBaseProps;

export default function ArrowLeftCircle({
	size = 45,
	color = "currentColor",
	className = "",
	strokeWidth = "1.5",
	...rest
}: ArrowLeftCircleProps) {
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
				d="m11.25 9-3 3m0 0 3 3m-3-3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
			/>
		</svg>
	);
}
