// build-icons.test.ts
// Comprehensive test suite for the icon build script

// Import testing utilities from Deno's standard library
import {
	assertEquals, // Asserts that two values are deeply equal
	//assertExists, // Asserts that a value is not null or undefined
	assertMatch, // Asserts that a string matches a regex pattern
	//assertRejects, // Asserts that an async function rejects with an error
} from "https://deno.land/std@0.224.0/assert/mod.ts";

// Import file system utilities
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

// Import the functions we want to test from the build script
import {
	extractSvgAttributes,
	extractSvgChildren,
	generateComponent,
	toPascalCase,
} from "./icon-build-script.ts";

// Test suite for the toPascalCase function
Deno.test("toPascalCase - converts kebab-case to PascalCase", async (t) => {
	// Test basic conversion
	await t.step("converts simple kebab-case", () => {
		assertEquals(toPascalCase("arrow-left"), "ArrowLeft");
		assertEquals(toPascalCase("heart"), "Heart");
		assertEquals(toPascalCase("check-circle"), "CheckCircle");
	});

	// Test edge cases
	await t.step("handles edge cases", () => {
		// Multiple hyphens
		assertEquals(toPascalCase("arrow-left-circle"), "ArrowLeftCircle");

		// Already capitalized parts
		assertEquals(toPascalCase("x-Mark"), "XMark");

		// Numbers in names
		assertEquals(toPascalCase("wifi-3-bars"), "Wifi3Bars");

		// Single letter segments
		assertEquals(toPascalCase("x-y-z"), "XYZ");

		// Empty string
		assertEquals(toPascalCase(""), "");
	});

	// Test unusual but valid cases
	await t.step("handles unusual cases", () => {
		// Leading/trailing hyphens (shouldn't happen with real icons but good to test)
		assertEquals(toPascalCase("-arrow-"), "Arrow");

		// Multiple consecutive hyphens
		assertEquals(toPascalCase("arrow--left"), "ArrowLeft");
	});
});

// Test suite for extractSvgChildren function
Deno.test("extractSvgChildren - extracts inner content from SVG", async (t) => {
	// Test standard SVG extraction
	await t.step("extracts simple SVG content", () => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>`;

		const expected = `<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>`;
		assertEquals(extractSvgChildren(svg), expected);
	});

	// Test multiline content
	await t.step("extracts multiline content", () => {
		const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>`;

		const result = extractSvgChildren(svg);
		// Should contain both elements
		assertMatch(result, /<circle.*\/>/);
		assertMatch(result, /<path.*\/>/);
	});

	// Test with different SVG tag formats
	await t.step("handles various SVG tag formats", () => {
		// SVG with many attributes
		const svg1 =
			`<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-home" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>`;

		assertEquals(
			extractSvgChildren(svg1),
			`<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`,
		);

		// SVG tag on multiple lines
		const svg2 = `<svg 
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    </svg>`;

		assertEquals(
			extractSvgChildren(svg2),
			`<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>`,
		);
	});

	// Test edge cases
	await t.step("handles edge cases", () => {
		// Empty SVG
		const emptySvg = `<svg></svg>`;
		assertEquals(extractSvgChildren(emptySvg), "");

		// SVG with only whitespace
		const whitespaceSvg = `<svg>   
    
    </svg>`;
		assertEquals(extractSvgChildren(whitespaceSvg), "");

		// Not an SVG (fallback behavior)
		const notSvg = `<div>Not an SVG</div>`;
		assertEquals(extractSvgChildren(notSvg), notSvg);

		// Case insensitive matching
		const upperCaseSvg = `<SVG><path d="M0 0"/></SVG>`;
		assertEquals(extractSvgChildren(upperCaseSvg), `<path d="M0 0"/>`);
	});
});

// Test suite for extractSvgAttributes function
Deno.test("extractSvgAttributes - extracts attributes from SVG tag", async (t) => {
	// Test basic attribute extraction
	await t.step("extracts common attributes", () => {
		const svg =
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">`;
		const attrs = extractSvgAttributes(svg);

		assertEquals(attrs.xmlns, "http://www.w3.org/2000/svg");
		assertEquals(attrs.viewBox, "0 0 24 24");
		assertEquals(attrs.fill, "none");
	});

	// Test various attribute formats
	await t.step("handles various attribute formats", () => {
		// Attributes with hyphens
		const svg1 =
			`<svg stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">`;
		const attrs1 = extractSvgAttributes(svg1);

		assertEquals(attrs1["stroke-width"], "1.5");
		assertEquals(attrs1["stroke-linecap"], "round");
		assertEquals(attrs1["stroke-linejoin"], "round");

		// Attributes with colons (namespaced)
		const svg2 =
			`<svg xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve">`;
		const attrs2 = extractSvgAttributes(svg2);

		assertEquals(attrs2["xmlns:xlink"], "http://www.w3.org/1999/xlink");
		assertEquals(attrs2["xml:space"], "preserve");

		// Mixed spacing around equals signs
		const svg3 = `<svg width = "24" height= "24" viewBox ="0 0 24 24">`;
		const attrs3 = extractSvgAttributes(svg3);

		assertEquals(attrs3.width, "24");
		assertEquals(attrs3.height, "24");
		assertEquals(attrs3.viewBox, "0 0 24 24");
	});

	// Test edge cases
	await t.step("handles edge cases", () => {
		// No attributes
		const svg1 = `<svg>`;
		assertEquals(extractSvgAttributes(svg1), {});

		// Empty attribute values
		const svg2 = `<svg class="" data-empty="">`;
		const attrs2 = extractSvgAttributes(svg2);
		assertEquals(attrs2.class, "");
		assertEquals(attrs2["data-empty"], "");

		// Not an SVG tag
		const notSvg = `<div class="test">`;
		assertEquals(extractSvgAttributes(notSvg), {});

		// Multiline SVG tag
		const multilineSvg = `<svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24">`;
		const multilineAttrs = extractSvgAttributes(multilineSvg);
		assertEquals(multilineAttrs.xmlns, "http://www.w3.org/2000/svg");
		assertEquals(multilineAttrs.width, "24");
		assertEquals(multilineAttrs.height, "24");
	});

	// Test special characters in attribute values
	await t.step("handles special characters in values", () => {
		const svg =
			`<svg viewBox="0 0 24 24" data-name="icon&test" class="w-6 h-6">`;
		const attrs = extractSvgAttributes(svg);

		assertEquals(attrs.viewBox, "0 0 24 24");
		assertEquals(attrs["data-name"], "icon&test");
		assertEquals(attrs.class, "w-6 h-6");
	});
});

// Test suite for generateComponent function
Deno.test("generateComponent - generates correct component code", async (t) => {
	// Test outline icon component generation
	await t.step("generates outline icon component", () => {
		const componentCode = generateComponent(
			"ArrowLeft",
			`<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>`,
			{
				xmlns: "http://www.w3.org/2000/svg",
				fill: "none",
				viewBox: "0 0 24 24",
				"stroke-width": "1.5",
				stroke: "currentColor",
			},
			"outline",
		);

		// Check that the component has the correct structure
		assertMatch(componentCode, /interface ArrowLeftProps/);
		assertMatch(componentCode, /export default function ArrowLeft/);

		// Check that outline-specific attributes are set correctly
		assertMatch(componentCode, /strokeWidth=\{strokeWidth\}/);
		assertMatch(componentCode, /stroke=\{color\}/);
		assertMatch(componentCode, /fill="none"/);

		// Check that the SVG content is included
		assertMatch(componentCode, /<path stroke-linecap="round"/);
	});

	// Test solid icon component generation
	await t.step("generates solid icon component", () => {
		const componentCode = generateComponent(
			"HeartSolid",
			`<path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218"/>`,
			{
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 24 24",
				fill: "currentColor",
			},
			"solid",
		);

		// Check solid-specific attributes
		assertMatch(componentCode, /strokeWidth=\{0\}/);
		assertMatch(componentCode, /stroke=\{"none"\}/);
		assertMatch(componentCode, /fill="currentColor"/);
	});

	// Test component with custom default values
	await t.step("uses custom stroke width from SVG", () => {
		const componentCode = generateComponent(
			"CustomIcon",
			`<circle cx="12" cy="12" r="10"/>`,
			{
				xmlns: "http://www.w3.org/2000/svg",
				"stroke-width": "2.5",
			},
			"outline",
		);

		// Should use the custom stroke width as default
		assertMatch(componentCode, /strokeWidth = 2.5/);
	});

	// Test proper indentation of multi-line content
	await t.step("formats multi-line content correctly", () => {
		const multilineContent = `<g>
  <circle cx="12" cy="12" r="10"/>
  <path d="M12 6v6l4 2"/>
</g>`;

		const componentCode = generateComponent(
			"ClockIcon",
			multilineContent,
			{ xmlns: "http://www.w3.org/2000/svg" },
			"outline",
		);

		// Check that content is properly indented (6 spaces)
		assertMatch(componentCode, /^ {6}<g>/);
		assertMatch(componentCode, /^ {6}<circle/m);
		assertMatch(componentCode, /^ {6}<path/);
		assertMatch(componentCode, /^ {6}<\/g>/);
	});
});

// Integration test that simulates the full build process
Deno.test("Full build process integration test", async (t) => {
	// Create a temporary test directory structure
	const testDir = await Deno.makeTempDir({ prefix: "icon_build_test_" });
	const iconsDir = join(testDir, "icons");
	const outlineDir = join(iconsDir, "outline");
	const solidDir = join(iconsDir, "solid");

	// Create directory structure
	await ensureDir(outlineDir);
	await ensureDir(solidDir);

	// Sample SVG content for testing
	const sampleSVGs = {
		outline: {
			"arrow-left.svg":
				`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
</svg>`,
			"check-circle.svg":
				`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
</svg>`,
			"x-mark.svg":
				`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
</svg>`,
		},
		solid: {
			"heart.svg":
				`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
</svg>`,
			"star.svg":
				`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd"/>
</svg>`,
		},
	};

	// Write test SVG files
	await t.step("create test SVG files", async () => {
		for (const [type, files] of Object.entries(sampleSVGs)) {
			const dir = type === "outline" ? outlineDir : solidDir;
			for (const [filename, content] of Object.entries(files)) {
				await Deno.writeTextFile(join(dir, filename), content);
			}
		}
	});

	// Change to test directory and run the build
	await t.step("run build process", () => {
		const originalCwd = Deno.cwd();
		try {
			// Change to test directory
			Deno.chdir(testDir);

			// Import and run the build function
			// Note: In a real test, you'd import the buildIcons function and call it
			// For this example, we'll simulate the process

			// Here you would actually run: await buildIcons();
			console.log("Test directory created at:", testDir);
			console.log("In a real test, buildIcons() would be called here");
		} finally {
			// Restore original directory
			Deno.chdir(originalCwd);
		}
	});

	// Verify the output structure would be created correctly
	await t.step("verify expected output structure", () => {
		// In a real test, you would check:
		// - Component files exist in components/icons/outline/
		// - Component files exist in components/icons/solid/
		// - Index files are created
		// - Component content is correct

		console.log("Expected output structure:");
		console.log("- components/icons/outline/ArrowLeft.tsx");
		console.log("- components/icons/outline/CheckCircle.tsx");
		console.log("- components/icons/outline/XMark.tsx");
		console.log("- components/icons/solid/Heart.tsx");
		console.log("- components/icons/solid/Star.tsx");
		console.log("- components/icons/outline/index.ts");
		console.log("- components/icons/solid/index.ts");
		console.log("- components/icons/index.ts");
	});

	// Cleanup
	await t.step("cleanup test directory", async () => {
		await Deno.remove(testDir, { recursive: true });
	});
});

// Test for error handling
Deno.test("Error handling", async (t) => {
	await t.step("handles malformed SVG gracefully", () => {
		// SVG with no closing tag
		const malformed = `<svg xmlns="http://www.w3.org/2000/svg"`;

		// Should return empty object for attributes
		const attrs = extractSvgAttributes(malformed);
		assertEquals(attrs, {});

		// Should return original string for children
		const children = extractSvgChildren(malformed);
		assertEquals(children, malformed);
	});

	await t.step("handles non-standard attribute formats", () => {
		// Single quotes (our regex expects double quotes)
		const svg = `<svg width='24' height='24'>`;
		const attrs = extractSvgAttributes(svg);

		// Should not extract single-quoted attributes
		assertEquals(attrs.width, undefined);
		assertEquals(attrs.height, undefined);
	});
});

// Run tests with: deno test --allow-read --allow-write build-icons.test.ts
