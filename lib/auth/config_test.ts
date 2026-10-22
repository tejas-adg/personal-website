import {
  authProviders,
  readAuthConfig,
  requestOrigin,
  safeReturnTo,
} from "./config.ts";

function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}

function equal(actual: unknown, expected: unknown, message = "Values differ") {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`,
    );
  }
}

function rejects(action: () => unknown, message: string) {
  let failed = false;
  try {
    action();
  } catch {
    failed = true;
  }
  assert(failed, message);
}

function environment(): Record<string, string> {
  return {
    COGNITO_USER_POOL_ID: "us-east-2_Test123",
    COGNITO_CLIENT_ID: "testclient123",
    COGNITO_CLIENT_SECRET: "server-only-test-secret",
    COGNITO_DOMAIN: "https://test-auth.auth.us-east-2.amazoncognito.com",
    AUTH_TABLE_NAME: "test-auth",
    AUTH_STORE_URL: "https://abcdefghijklmnop.lambda-url.us-east-2.on.aws/",
    AUTH_STORE_SECRET: "a".repeat(43),
    AUTH_ORIGIN: "https://tejasam.com",
    AUTH_DEV_ORIGIN: "http://localhost:5173",
    AUTH_PROVIDERS: "Google,LoginWithAmazon,Facebook",
  };
}

Deno.test("incomplete authentication configuration stays disabled", () => {
  equal(readAuthConfig({}), null);
  for (
    const key of [
      "COGNITO_USER_POOL_ID",
      "COGNITO_CLIENT_ID",
      "COGNITO_CLIENT_SECRET",
      "COGNITO_DOMAIN",
      "AUTH_TABLE_NAME",
      "AUTH_STORE_URL",
      "AUTH_STORE_SECRET",
    ]
  ) {
    const env = environment();
    delete env[key];
    equal(
      readAuthConfig(env),
      null,
      `Missing ${key} must disable authentication`,
    );
  }
});

Deno.test("configuration pins AWS resources to the selected Region and uses bounded defaults", () => {
  const config = readAuthConfig(environment());
  assert(config);
  equal(config.region, "us-east-2");
  equal(
    config.issuer,
    "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_Test123",
  );
  equal(config.origin, "https://tejasam.com");
  equal(config.allowedOrigins, [
    "https://tejasam.com",
    "http://localhost:5173",
  ]);
  equal(config.recentSeconds, 900);
  equal(config.sessionSeconds, 28_800);
  equal(config.providers, ["Google", "LoginWithAmazon", "Facebook"]);
});

Deno.test("provider configuration accepts only explicit supported provider IDs", () => {
  const env = environment();
  env.AUTH_PROVIDERS = " Google, Google, Facebook ";
  equal(readAuthConfig(env)?.providers, ["Google", "Facebook"]);
  env.AUTH_PROVIDERS = "";
  equal(readAuthConfig(env)?.providers, []);
  for (
    const unsupported of [
      "google",
      "COGNITO",
      "GitHub",
      "toString",
      "constructor",
      "__proto__",
    ]
  ) {
    rejects(
      () => readAuthConfig({ ...env, AUTH_PROVIDERS: unsupported }),
      `Unsupported provider ${unsupported} must be rejected`,
    );
  }
});

Deno.test("only enabled providers become available to the sign-in page", () => {
  equal(authProviders(null), [
    { id: "Google", name: "Google", configured: false },
    { id: "LoginWithAmazon", name: "Amazon", configured: false },
    { id: "Facebook", name: "Facebook", configured: false },
  ]);
  const config = readAuthConfig({ ...environment(), AUTH_PROVIDERS: "Google" });
  assert(config);
  equal(authProviders(config), [
    { id: "Google", name: "Google", configured: true },
    { id: "LoginWithAmazon", name: "Amazon", configured: false },
    { id: "Facebook", name: "Facebook", configured: false },
  ]);
});

Deno.test("Cognito identifiers and domains cannot redirect token requests elsewhere", () => {
  const env = environment();
  for (const poolId of ["us-east-1_Test123", "../../foreign", "us-east-2_"]) {
    rejects(
      () => readAuthConfig({ ...env, COGNITO_USER_POOL_ID: poolId }),
      "Invalid pool identifier accepted",
    );
  }
  for (const clientId of ["with spaces", "UPPERCASE", "../../foreign"]) {
    rejects(
      () => readAuthConfig({ ...env, COGNITO_CLIENT_ID: clientId }),
      "Invalid client identifier accepted",
    );
  }
  for (
    const domain of [
      "http://test-auth.auth.us-east-2.amazoncognito.com",
      "https://test-auth.auth.us-east-1.amazoncognito.com",
      "https://test-auth.auth.us-east-2.amazoncognito.com.attacker.example",
      "https://user:password@test-auth.auth.us-east-2.amazoncognito.com",
      "https://test-auth.auth.us-east-2.amazoncognito.com:8443",
      "https://test-auth.auth.us-east-2.amazoncognito.com/other",
      "https://test-auth.auth.us-east-2.amazoncognito.com/?query=1",
      "https://test-auth.auth.us-east-2.amazoncognito.com/#fragment",
    ]
  ) {
    rejects(
      () => readAuthConfig({ ...env, COGNITO_DOMAIN: domain }),
      `Invalid domain accepted: ${domain}`,
    );
  }
});

Deno.test("allowed origins require exact HTTPS origins or explicit loopback development", () => {
  const env = environment();
  for (
    const origin of [
      "http://tejasam.com",
      "https://tejasam.com/",
      "https://tejasam.com/path",
      "https://tejasam.com?query=1",
      "https://tejasam.com#fragment",
      "https://user:password@tejasam.com",
      "null",
    ]
  ) {
    rejects(
      () => readAuthConfig({ ...env, AUTH_ORIGIN: origin }),
      `Invalid origin accepted: ${origin}`,
    );
  }
  const config = readAuthConfig(env);
  assert(config);
  equal(
    requestOrigin(new Request("https://tejasam.com/login"), config),
    "https://tejasam.com",
  );
  equal(
    requestOrigin(new Request("http://localhost:5173/login"), config),
    "http://localhost:5173",
  );
  rejects(
    () => requestOrigin(new Request("https://attacker.example/login"), config),
    "Unregistered origin must be rejected",
  );
  const deduplicated = readAuthConfig({
    ...env,
    AUTH_DEV_ORIGIN: "https://tejasam.com",
  });
  equal(deduplicated?.allowedOrigins, ["https://tejasam.com"]);
});

Deno.test("authentication durations reject unsafe, noninteger and out-of-range values", () => {
  const env = environment();
  for (const seconds of ["0", "59", "3601", "1.5", "NaN", "Infinity", "-1"]) {
    rejects(
      () => readAuthConfig({ ...env, AUTH_RECENT_SECONDS: seconds }),
      `Unsafe recent-auth duration accepted: ${seconds}`,
    );
  }
  for (const seconds of ["0", "299", "86401", "1.5", "NaN", "Infinity", "-1"]) {
    rejects(
      () => readAuthConfig({ ...env, AUTH_SESSION_SECONDS: seconds }),
      `Unsafe session duration accepted: ${seconds}`,
    );
  }
  const bounded = readAuthConfig({
    ...env,
    AUTH_RECENT_SECONDS: "60",
    AUTH_SESSION_SECONDS: "300",
  });
  equal(bounded?.recentSeconds, 60);
  equal(bounded?.sessionSeconds, 300);
});

Deno.test("return paths keep local navigation and strip URL fragments", () => {
  equal(safeReturnTo("/archives?sort=recent#section"), "/archives?sort=recent");
  equal(safeReturnTo("/"), "/");
  equal(safeReturnTo("/nested/../archives"), "/archives");
  for (
    const unsafe of [
      undefined,
      null,
      "",
      "https://attacker.example",
      "//attacker.example",
      "/\\attacker.example",
      "/with space",
      "/line\nbreak",
      "/control\u0000character",
      "/auth/signin",
      "/nested/../auth/logout",
      "/" + "a".repeat(2048),
    ]
  ) equal(safeReturnTo(unsafe), "/account", `Unsafe return path: ${unsafe}`);
});
