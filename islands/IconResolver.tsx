import { useEffect, useState } from "preact/hooks";

interface IconResolverProps {
	name: string;
	type?: "outline" | "solid";
	size?: number | string;
	color?: string;
	className?: string;
	[key: string]: unknown; // future-proofing
}

export default function IconResolver({
	name,
	type = "outline",
	size = 24,
	color,
	className = "",
	...rest
}: IconResolverProps) {
	const [svgData, setSvgData] = useState<
		{ children: string; attributes: Record<string, string> } | null
	>(null);

	useEffect(() => {
		fetch(`/api/icon-resolver?name=${name}&type=${type}`)
			.then((res) => res.json())
			.then((json) => setSvgData(json))
			.catch(() => setSvgData(null));
	}, [name, type]);

	if (!svgData) return <span class={className} {...rest}>Icon not found</span>;

	// Prepare SVG attributes, ensuring user props (size/color) take precedence
	const svgAttrs: Record<string, string | number | boolean | undefined> = {
		...svgData.attributes,
		width: size,
		height: size,
		...(color && { stroke: color, fill: color }),
		class: className,
		...rest,
	};

	// Remove duplicate/conflicting attributes if user has overridden
	if (color) {
		delete svgAttrs["stroke"];
		delete svgAttrs["fill"];
		svgAttrs.stroke = color;
		if (type === "solid") {
			svgAttrs.fill = color;
		} else {
			svgAttrs.fill = "transparent"; // Ensure outline icons have transparent fill
		}
	}
	svgAttrs.width = size;
	svgAttrs.height = size;
	svgAttrs.class = className;

	return (
		<svg
			{...svgAttrs}
			// deno-lint-ignore react-no-danger
			dangerouslySetInnerHTML={{ __html: svgData.children }} // Appaerntly this is safe as we control the SVG content
		/>
	);
}
