import { assert, assertEquals } from "jsr:@std/assert";
import { handler } from "./icon-resolver.ts";

Deno.test("returns SVG children and attributes for valid SVG", async () => {
	// Arrange: fake SVG file
	const fakeSVG =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg>`;
	const origRead = Deno.readTextFile;
	// Stub Deno.readTextFile to return fakeSVG
	// @ts-ignore fake Deno.readTextFile to return fakeSVG
	Deno.readTextFile = () => Promise.resolve(fakeSVG);

	// Act
	const req = new Request(
		"http://localhost/api/icon-resolver?name=arrow-right&type=outline",
	);
	const resp = await handler(req, {} as unknown);

	// Assert
	assertEquals(resp.status, 200);
	const json = await resp.json();
	assert(json.children.includes('<path d="M0 0h24v24H0z" />'));
	assert(json.attributes["viewBox"] === "0 0 24 24");

	// Clean up
	Deno.readTextFile = origRead;
});

Deno.test("returns 404 for missing icon", async () => {
	// Arrange: force Deno.readTextFile to throw
	const origRead = Deno.readTextFile;
	// @ts-ignore fake Deno.readTextFile to throw an error
	Deno.readTextFile = () => Promise.reject(new Error("not found"));

	// Act
	const req = new Request(
		"http://localhost/api/icon-resolver?name=missing-icon&type=outline",
	);
	const resp = await handler(req, {} as unknown);

	// Assert
	assertEquals(resp.status, 404);
	const json = await resp.json();
	assert("error" in json);

	// Clean up
	Deno.readTextFile = origRead;
});

Deno.test("returns 400 for invalid type", async () => {
	const req = new Request(
		"http://localhost/api/icon-resolver?name=arrow-right&type=foobar",
	);
	const resp = await handler(req, {} as unknown);
	assertEquals(resp.status, 400);
	const json = await resp.json();
	assert("error" in json);
});

Deno.test("handles PascalCase icon names", async () => {
	const fakeSVG =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg>`;
	const origRead = Deno.readTextFile;
	// @ts-ignore fake Deno.readTextFile to return fakeSVG
	Deno.readTextFile = () => Promise.resolve(fakeSVG);

	const req = new Request(
		"http://localhost/api/icon-resolver?name=ArrowRight&type=solid",
	);
	const resp = await handler(req, {} as unknown);
	assertEquals(resp.status, 200);
	const json = await resp.json();
	assert(json.children.includes('<path d="M0 0h24v24H0z" />'));

	Deno.readTextFile = origRead;
});

Deno.test("returns original file for non-SVG input", async () => {
	const fakeTxt = `not an svg file at all`;
	const origRead = Deno.readTextFile;
	// @ts-ignore fake Deno.readTextFile to return fakeTxt
	Deno.readTextFile = () => Promise.resolve(fakeTxt);

	const req = new Request(
		"http://localhost/api/icon-resolver?name=random-text&type=outline",
	);
	const resp = await handler(req, {} as unknown);
	assertEquals(resp.status, 200);
	const json = await resp.json();
	assertEquals(json.children, fakeTxt);
	assertEquals(Object.keys(json.attributes).length, 0);

	Deno.readTextFile = origRead;
});

Deno.test("handles malicious SVG code without alteration", async () => {
	const fakeSVG =
		`<svg xmlns="http://www.w3.org/2000/svg" onload="alert('hacked')">
    <script>alert('evil')</script>
    <path d="M0 0h24v24H0z" onclick="alert('XSS')" />
  </svg>`;
	const origRead = Deno.readTextFile;
	// @ts-ignore for test stubbing
	Deno.readTextFile = () => Promise.resolve(fakeSVG);

	const req = new Request(
		"http://localhost/api/icon-resolver?name=malicious&type=outline",
	);
	const resp = await handler(req, {} as unknown);
	assertEquals(resp.status, 200);
	const json = await resp.json();

	// Make sure all malicious content is still there (i.e., nothing is altered/stripped by the API)
	assert(json.children.includes("<script>alert('evil')</script>"));
	assert(json.children.includes("onclick=\"alert('XSS')\""));
	assert("onload" in json.attributes);

	Deno.readTextFile = origRead;
});

Deno.test("handles SVG with encoded entities safely", async () => {
	const fakeSVG =
		`<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" /><text>&lt;script&gt;alert('xss')&lt;/script&gt;</text></svg>`;
	const origRead = Deno.readTextFile;
	// @ts-ignore for test stubbing
	Deno.readTextFile = () => Promise.resolve(fakeSVG);

	const req = new Request(
		"http://localhost/api/icon-resolver?name=entity-icon&type=outline",
	);
	const resp = await handler(req, {} as unknown);
	assertEquals(resp.status, 200);
	const json = await resp.json();

	assert(json.children.includes("&lt;script&gt;alert('xss')&lt;/script&gt;"));

	Deno.readTextFile = origRead;
});
