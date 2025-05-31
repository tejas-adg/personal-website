// routes/api/icon-resolver.ts
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

function extractSvgChildren(svgString: string): string {
	svgString = svgString.trim();
	const match = svgString.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
	return match ? match[1] : svgString;
}

function extractSvgAttributes(svgString: string): Record<string, string> {
	const match = svgString.match(/^<svg\b([^>]*)>/i);
	if (!match) return {};
	const attrString = match[1];
	const attrRegex = /([a-zA-Z_:.-]+)\s*=\s*"([^"]*)"/g;
	const attrs: Record<string, string> = {};
	let m;
	while ((m = attrRegex.exec(attrString))) {
		attrs[m[1]] = m[2];
	}
	return attrs;
}

// In-memory server-side cache
const iconCache: Record<string, string> = {};

function toKebabCase(str: string) {
	return str
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
		.toLowerCase();
}

export const handler = async (req: Request, _ctx: unknown) => {
	const url = new URL(req.url);
	let name = url.searchParams.get("name") || "";
	const type = url.searchParams.get("type") || "outline";
	name = toKebabCase(name);

	// For logging purposes
	const clientIP = req.headers.get("x-forwarded-for") || "unknown";

	// Validate type
	if (!["outline", "solid"].includes(type)) {
		console.log(
			`[IconResolver] [${clientIP}] Invalid type '${type}' for icon '${name}'.`,
		);
		return new Response(
			JSON.stringify({ error: "Invalid type. Use 'outline' or 'solid'." }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const cacheKey = `${type}:${name}`;

	// Check server-side cache
	if (iconCache[cacheKey]) {
		console.log(
			`[IconResolver] [${clientIP}] Served '${cacheKey}' from cache.`,
		);
		if (iconCache[cacheKey].trim().toLowerCase().startsWith("<svg")) {
			const children = extractSvgChildren(iconCache[cacheKey]);
			const attrs = extractSvgAttributes(iconCache[cacheKey]);

			return new Response(
				JSON.stringify({ children, attributes: attrs }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		} else {
			// Not SVG, just return original
			return new Response(
				JSON.stringify({ children: iconCache[cacheKey], attributes: {} }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	}

	// File system lookup
	const filePath = join(
		Deno.cwd(),
		"icons",
		type,
		`${name}.svg`,
	);

	try {
		console.log(
			`[IconResolver] [${clientIP}] Looking for '${cacheKey}' at '${filePath}'.`,
		);
		const svg = await Deno.readTextFile(filePath);
		iconCache[cacheKey] = svg; // Cache it
		console.log(`[IconResolver] [${clientIP}] Cached '${cacheKey}'.`);
		if (svg.trim().toLowerCase().startsWith("<svg")) {
			const children = extractSvgChildren(svg);
			const attrs = extractSvgAttributes(svg);

			return new Response(
				JSON.stringify({ children, attributes: attrs }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		} else {
			// Not SVG, just return original
			return new Response(
				JSON.stringify({ children: svg, attributes: {} }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	} catch {
		console.log(`[IconResolver] [${clientIP}] Icon '${cacheKey}' not found.`);
		return new Response(
			JSON.stringify({ error: "Icon not found." }),
			{ status: 404, headers: { "Content-Type": "application/json" } },
		);
	}
};
