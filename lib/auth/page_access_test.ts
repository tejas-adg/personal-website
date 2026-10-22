import {
  ASTER_ACCESS_TAGS,
  evaluatePageAccess,
  type PageAccessDependencies,
} from "./page_access.ts";
import type { PublicUser } from "./types.ts";

function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("Values differ");
  }
}

const request = () => new Request("https://tejasam.com/test");
const user: PublicUser = {
  id: "example-user",
  name: "Example Person",
  email: "person@example.com",
  picture: null,
};

Deno.test("page access checks the fixed policy before any profile lookup", async () => {
  const req = request();
  const calls: string[] = [];
  const dependencies: PageAccessDependencies = {
    requireAccess(received, tags) {
      assert(received === req, "Guard must receive the original request");
      assert(tags === ASTER_ACCESS_TAGS, "Guard must use the server policy");
      assert(Object.isFrozen(tags), "The server policy must be immutable");
      equal(tags, ["aster:read"]);
      calls.push("guard");
      return Promise.resolve(new Response("Not Found", { status: 404 }));
    },
    currentUser(received) {
      assert(received === req, "Profile must use the same request");
      equal(calls, ["guard"]);
      calls.push("profile");
      return Promise.resolve(null);
    },
  };

  equal(await evaluatePageAccess(req, dependencies), "signin");
  equal(calls, ["guard", "profile"]);
});

Deno.test("a successful guard allows the page without another profile lookup", async () => {
  let profileCalls = 0;
  const access = await evaluatePageAccess(request(), {
    requireAccess: () => Promise.resolve(null),
    currentUser() {
      profileCalls++;
      return Promise.reject(new Error("Profile lookup must not run"));
    },
  });

  equal(access, "allowed");
  equal(profileCalls, 0);
});

Deno.test("a failed guard presents sign-in when no valid public user exists", async () => {
  equal(
    await evaluatePageAccess(request(), {
      requireAccess: () =>
        Promise.resolve(
          new Response("Not Found", {
            status: 404,
          }),
        ),
      currentUser: () => Promise.resolve(null),
    }),
    "signin",
  );
});

Deno.test("a signed-in profile cannot override any guard failure response", async () => {
  for (const status of [200, 303, 403, 404, 500]) {
    equal(
      await evaluatePageAccess(request(), {
        requireAccess: () => Promise.resolve(new Response(null, { status })),
        currentUser: () => Promise.resolve(user),
      }),
      "denied",
    );
  }
});

Deno.test("a guard exception fails closed without reading a profile", async () => {
  let profileCalls = 0;
  const access = await evaluatePageAccess(request(), {
    requireAccess: () => Promise.reject(new Error("Guard unavailable")),
    currentUser() {
      profileCalls++;
      return Promise.resolve(user);
    },
  });

  equal(access, "signin");
  equal(profileCalls, 0);
});

Deno.test("a failed profile lookup cannot turn a guard denial into access", async () => {
  equal(
    await evaluatePageAccess(request(), {
      requireAccess: () =>
        Promise.resolve(
          new Response("Not Found", {
            status: 404,
          }),
        ),
      currentUser: () => Promise.reject(new Error("Profile unavailable")),
    }),
    "signin",
  );
});

Deno.test("client authorization hints cannot replace the server access policy", async () => {
  const req = new Request(
    "https://tejasam.com/test?accessTags=aster%3Aread&authorized=true",
    {
      headers: {
        Cookie: "accessTags=aster:read; authorized=true",
        "X-Authorized": "true",
      },
    },
  );
  let guardCalls = 0;
  equal(
    await evaluatePageAccess(req, {
      requireAccess(received, tags) {
        guardCalls++;
        assert(received === req);
        assert(tags === ASTER_ACCESS_TAGS);
        return Promise.resolve(new Response("Not Found", { status: 404 }));
      },
      currentUser: () => Promise.resolve(user),
    }),
    "denied",
  );
  equal(guardCalls, 1);
});
