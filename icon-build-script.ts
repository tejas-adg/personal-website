// build-icons.ts
// This script converts SVG icon files into Preact components for better performance

// Import path utilities from Deno's standard library
// join: combines path segments (e.g., join("a", "b", "c") => "a/b/c")
// dirname: gets the directory part of a path (e.g., dirname("a/b/c.txt") => "a/b")
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

// ensureDir: creates a directory and all parent directories if they don't exist
// Similar to mkdir -p in Unix
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

// walk: recursively traverses a directory tree
// Returns an async iterator of all files/directories found
import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

/**
 * Converts kebab-case strings to PascalCase for component names
 * Example: "arrow-left" becomes "ArrowLeft"
 * This follows React/Preact component naming conventions
 */
function toPascalCase(str: string): string {
	return str
		// Split the string by hyphens: "arrow-left" => ["arrow", "left"]
		.split("-")
		// For each word, capitalize first letter and keep the rest
		// "arrow" => "Arrow", "left" => "Left"
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		// Join all words together: ["Arrow", "Left"] => "ArrowLeft"
		.join("");
}

/**
 * Extracts the inner content of an SVG element
 * Takes the full SVG string and returns only what's between <svg> and </svg>
 * This is what we'll put inside our Preact component's SVG element
 */
function extractSvgChildren(svgString: string): string {
	// Remove any leading/trailing whitespace
	svgString = svgString.trim();

	// Regular expression breakdown:
	// <svg\b    - Match "<svg" followed by a word boundary
	// [^>]*     - Match any character except ">" zero or more times (captures attributes)
	// >         - Match the closing ">" of the opening tag
	// ([\s\S]*?) - Capture group 1: Match any character including newlines (non-greedy)
	// <\/svg>   - Match the closing </svg> tag (escaped forward slash)
	// i         - Case insensitive flag
	const match = svgString.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);

	// If we found a match, return the captured group (index 1)
	// Otherwise, return the original string (fallback)
	return match ? match[1].trim() : svgString;
}

/**
 * Extracts all attributes from the opening SVG tag
 * Returns them as a key-value object
 * Example: <svg width="24" height="24"> => { width: "24", height: "24" }
 */
function extractSvgAttributes(svgString: string): Record<string, string> {
	// First, try to match just the opening SVG tag
	// ^<svg\b   - Start of string, then "<svg" with word boundary
	// ([^>]*)   - Capture group 1: everything until the closing ">"
	// >         - The closing ">" of the tag
	// i         - Case insensitive
	const match = svgString.match(/^<svg\b([^>]*)>/i);

	// If no match found, return empty object
	if (!match) return {};

	// Extract the attributes string from the capture group
	const attrString = match[1];

	// Regular expression for matching individual attributes:
	// ([a-zA-Z_:.-]+)  - Capture group 1: attribute name (letters, underscore, colon, dot, hyphen)
	// \s*=\s*          - Equal sign with optional whitespace on both sides
	// "([^"]*)"        - Capture group 2: attribute value in quotes
	// g                - Global flag to find all matches
	const attrRegex = /([a-zA-Z_:.-]+)\s*=\s*"([^"]*)"/g;

	// Object to store our extracted attributes
	const attrs: Record<string, string> = {};

	// Variable to store regex match results
	let m;

	// exec() returns matches one at a time when used with global flag
	// It returns null when no more matches are found
	while ((m = attrRegex.exec(attrString))) {
		// m[0] is the full match, m[1] is attribute name, m[2] is attribute value
		// Example: m[1] = "width", m[2] = "24"
		attrs[m[1]] = m[2];
	}

	return attrs;
}

/**
 * Generates the complete Preact component code as a string
 * This creates a fully functional, typed component with all necessary props
 */
function generateComponent(
	componentName: string, // e.g., "ArrowLeft"
	svgChildren: string, // The inner SVG content (paths, circles, etc.)
	defaultAttributes: Record<string, string>, // Original SVG attributes
	iconType: "outline" | "solid", // Determines default styling behavior
): string {
	// Destructure known SVG attributes and collect any others
	// We handle these specific attributes specially in our component
	/** const {
    xmlns, // XML namespace (usually "http://www.w3.org/2000/svg")
    fill, // Default fill color
    viewBox, // SVG viewport (usually "0 0 24 24")
    "stroke-width": strokeWidth, // Default stroke width (renamed from kebab-case)
    stroke, // Default stroke color
    ...otherAttrs // Any other attributes we didn't explicitly handle
  } = defaultAttributes; */

	// Format the SVG children with proper indentation for readability
	const formattedChildren = svgChildren
		.split("\n") // Split into individual lines
		.map((line) => line.trim()) // Remove extra whitespace from each line
		.filter((line) => line.length > 0) // Remove empty lines
		.map((line) => `      ${line}`) // Add 6 spaces of indentation
		.join("\n"); // Join back with newlines

	// Return the complete component code as a template string
	return `// This file is auto-generated by build-icons.ts
// Icon: ${componentName} (${iconType})
/**
 * ${
		Object.entries(defaultAttributes).map(([key, value]) => `${key}: ${value}`)
			.join(", ")
	}
 */

import { IconBaseProps } from "../icon-base-props.ts";
type ${componentName}Props = IconBaseProps;

export default function ${componentName}({
  size = 45,
  color = "currentColor",
  className = "",
  ${iconType === "outline" ? 'strokeWidth = "1.5",' : ""}
  ...rest
}: ${componentName}Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill=${iconType === "solid" ? "{color}" : '"none"'}
      viewBox="0 0 24 24"
      ${iconType === "outline" ? "stroke-width={strokeWidth}" : ""}
      ${iconType === "outline" ? "stroke={color}" : ""}
      width={size}
      height={size}
      class={className}
      aria-hidden="true"
      data-slot="icon"
      {...rest}
    >
${formattedChildren}
    </svg>
  );
}
`;
}

/**
 * Main build function that orchestrates the entire conversion process
 * This reads all SVG files and generates corresponding Preact components
 */
async function buildIcons() {
	// Get the current working directory and construct paths
	const iconsDir = join(Deno.cwd(), "icons"); // Source directory
	const outputBaseDir = join(Deno.cwd(), "components", "icons"); // Output directory

	// Counters for tracking progress
	let totalProcessed = 0; // Total successful conversions
	let errors = 0; // Total errors encountered

	// Print startup information
	console.log("🚀 Starting icon build process...");
	console.log(`📁 Source directory: ${iconsDir}`);
	console.log(`📁 Output directory: ${outputBaseDir}`);
	console.log("");

	// Process each icon type separately
	// Using 'as const' makes TypeScript treat these as literal types, not just strings
	for (const iconType of ["outline", "solid"] as const) {
		// Construct paths for this specific icon type
		const sourceDir = join(iconsDir, iconType); // e.g., "icons/outline"
		const outputDir = join(outputBaseDir, iconType); // e.g., "components/icons/outline"

		// Create the output directory if it doesn't exist
		// This is recursive, so it creates parent directories too
		await ensureDir(outputDir);

		console.log(`📋 Processing ${iconType} icons...`);

		// Counter for this specific icon type
		let typeCount = 0;

		// Walk through all SVG files in the source directory
		// This is recursive by default but we only want SVG files
		for await (
			const entry of walk(sourceDir, {
				exts: [".svg"], // Only look for .svg files
				includeDirs: false, // Don't include directory entries, only files
			})
		) {
			try {
				// Read the SVG file content as a string
				const svgContent = await Deno.readTextFile(entry.path);

				// Extract the filename without extension
				// "arrow-left.svg" => "arrow-left"
				const fileName = entry.name.replace(".svg", "");

				// Convert to component name
				// "arrow-left" => "ArrowLeft"
				const componentName = toPascalCase(fileName);

				// Extract the SVG's inner content and attributes
				const svgChildren = extractSvgChildren(svgContent);
				const svgAttributes = extractSvgAttributes(svgContent);

				// Generate the complete component code
				const componentCode = generateComponent(
					componentName,
					svgChildren,
					svgAttributes,
					iconType,
				);

				// Determine output file path
				// e.g., "components/icons/outline/ArrowLeft.tsx"
				const outputPath = join(outputDir, `${componentName}.tsx`);

				// Write the component file
				await Deno.writeTextFile(outputPath, componentCode);

				// Increment counters
				typeCount++;
				totalProcessed++;

				// Log progress every 10 icons to avoid console spam
				if (typeCount % 10 === 0) {
					console.log(`  ✓ Processed ${typeCount} ${iconType} icons...`);
				}
			} catch (error) {
				// If anything goes wrong, log the error and continue
				errors++;
				console.error(`  ✗ Error processing ${entry.name}:`, error);
			}
		}

		// Summary for this icon type
		console.log(
			`✅ Completed ${iconType} icons: ${typeCount} components created`,
		);
		console.log("");
	}

	// Create index files for easier imports
	console.log("📝 Creating index files...");

	// Create an index file for each icon type
	for (const iconType of ["outline", "solid"] as const) {
		const indexPath = join(outputBaseDir, iconType, "index.ts");
		const iconDir = join(outputBaseDir, iconType);

		// Array to collect all export statements
		const exports: string[] = [];

		// Read all files in the icon directory
		for await (const entry of Deno.readDir(iconDir)) {
			// Only process .tsx files that aren't the index itself
			if (entry.name.endsWith(".tsx") && entry.name !== "index.ts") {
				// Extract component name from filename
				const componentName = entry.name.replace(".tsx", "");

				// Create export statement
				// e.g., 'export { default as ArrowLeft } from "./ArrowLeft.tsx";'
				exports.push(
					`export { default as ${componentName} } from "./${componentName}.tsx";`,
				);
			}
		}

		// Create index file content with sorted exports for consistency
		const indexContent =
			`// Auto-generated index file for ${iconType} icons\n\n${
				exports.sort().join("\n")
			}\n`;

		// Write the index file
		await Deno.writeTextFile(indexPath, indexContent);

		console.log(
			`  ✓ Created index.ts for ${iconType} icons (${exports.length} exports)`,
		);
	}

	// Create a main index file that re-exports everything
	const mainIndexPath = join(outputBaseDir, "index.ts");
	const mainIndexContent = `// Auto-generated main index file for all icons

// Re-export all outline icons
export * as outline from "./outline/index.ts";

// Re-export all solid icons
export * as solid from "./solid/index.ts";
`;
	await Deno.writeTextFile(mainIndexPath, mainIndexContent);
	console.log("  ✓ Created main index.ts");

	// Print final summary
	console.log("");
	console.log("🎉 Icon build complete!");
	console.log(
		`📊 Summary: ${totalProcessed} icons processed, ${errors} errors`,
	);

	// Warn if there were any errors
	if (errors > 0) {
		console.log(
			"⚠️  Some icons failed to process. Check the error messages above.",
		);
	}
}

// Check if this script is being run directly (not imported)
// import.meta.main is true when the module is the entry point
if (import.meta.main) {
	try {
		await buildIcons();
	} catch (error) {
		console.error("❌ Build failed:", error);
		// Exit with error code 1 to indicate failure
		Deno.exit(1);
	}
}

// Export functions for testing
export {
	extractSvgAttributes,
	extractSvgChildren,
	generateComponent,
	toPascalCase,
};
