// This file is auto-generated by build-icons.ts
// Icon: Window (outline)
/**
 * xmlns: http://www.w3.org/2000/svg, fill: none, viewBox: 0 0 24 24, stroke-width: 1.5, stroke: currentColor, aria-hidden: true, data-slot: icon
 */

import { IconBaseProps } from "../icon-base-props.ts";
type WindowProps = IconBaseProps;

export default function Window({
	size = 45,
	color = "currentColor",
	className = "",
	strokeWidth = "1.5",
	...rest
}: WindowProps) {
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
				d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25m-18 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6ZM7.5 6h.008v.008H7.5V6Zm2.25 0h.008v.008H9.75V6Z"
			/>
		</svg>
	);
}
