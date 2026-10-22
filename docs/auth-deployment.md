# Authentication deployment

The website uses Cognito's authorization-code flow with PKCE, OAuth state, and
an OIDC nonce. Deno's built-in `fetch` and Web Crypto APIs perform the exchange
and token verification; there is no third-party authentication framework. The
official AWS SDK accesses DynamoDB only inside a dedicated AWS Lambda function.
The Deno server calls that function through a signed storage RPC.

Infrastructure is defined in [`infra/auth.yaml`](../infra/auth.yaml). Deploy it
only in `us-east-2`, using the `personal` AWS CLI profile. The template does not
deploy the website or configure a Google application.

Both AWS stacks are live in `us-east-2`. The Google Cloud project and Web
application OAuth client are configured for basic identity scopes, Google is
enabled in Cognito, and Deno Deploy's Production runtime environment is
configured. Real Google sign-in, public session API projection, and logout have
been verified both locally and at `https://tejasam.com`, including the earlier
Deno production revision `n1qs88w73cpe`. Anonymous `/account` access returns
404, and the `www` sign-in entry redirects to the registered canonical origin.
The Aster journal now has a separate server-side access gate described below.
Amazon and Facebook registration is deferred at the user's request.

## Infrastructure

The stack creates a Cognito Lite user pool, a confidential OAuth client, a
Cognito prefix domain, and one DynamoDB table. Classic hosted UI version 1 is
intentional: the newer managed login requires a higher Cognito feature plan.
Native self-registration and password API authentication are disabled. `COGNITO`
was a bootstrap provider only; the website does not offer it as a login method.
The deployed app client now enables Google instead.

The table uses provisioned 5 read and 5 write capacity units, no indexes, and
the AWS-owned encryption key. `SSEEnabled: false` selects that key; DynamoDB
still encrypts the data at rest. Cognito and the table are retained on stack
deletion. Removing this stack does not remove retained user data. Review a
replacement or cleanup separately.

After approval to provision the selected services:

```sh
aws cloudformation deploy \
  --template-file infra/auth.yaml \
  --stack-name tejasam-auth \
  --profile personal \
  --region us-east-2

aws cloudformation describe-stacks \
  --stack-name tejasam-auth \
  --query 'Stacks[0].Outputs' \
  --profile personal \
  --region us-east-2
```

No IAM role is created by this first template. The separate storage bridge
creates a Lambda service role, scoped to this exact table. The generated Cognito
client secret is deliberately excluded from stack outputs.

The deployed stack's nonsecret identifiers are recorded in
[`infra/auth-outputs.json`](../infra/auth-outputs.json). The rendered
[`infra/auth-app-policy.json`](../infra/auth-app-policy.json) scopes the policy
to that deployed table. The storage bridge embeds the same database restrictions
in its Lambda service role.

Provider registration without a subscription does not imply unlimited free AWS
usage. Check the project's remaining Free Tier allowances and credits in AWS
Settings before launch. The template does not upgrade the project's plan.

## Google first

1. Sign in to Google Cloud in the in-app browser and select the website's Google
   Cloud project. Configure Google Auth Platform branding, audience, and consent
   settings. OAuth client registration does not itself require a Google Cloud
   Free Trial subscription.
2. Create a **Web application** OAuth client. Register the stack's
   `GoogleRedirectUri` output, which ends in `/oauth2/idpresponse`, as an
   authorized redirect URI. Google returns to Cognito, which then returns to the
   website. Do not use the website's `/auth/callback` as Google's redirect URI.
3. In the Cognito user pool, add the Google social provider with that Google
   client ID and secret. Request only `openid email profile`. Map `email`,
   `email_verified`, `name`, and `picture` from Google. Mapped email
   verification comes from the provider; the website sends no verification
   emails.
4. Enable Google on the Cognito app client and remove the bootstrap `COGNITO`
   provider. For CLI changes, first describe the complete app client, remove
   only read-only response fields, change the provider list, and submit the full
   configuration. `update-user-pool-client` replaces omitted settings with
   defaults; a provider-only update can silently break the client.
5. Preserve the provider list in infrastructure as well. Set the template's
   `SupportedProviders` parameter to `Google` on the next stack update and
   retain that value on later updates. The identity provider must exist before
   it is included in this parameter.
6. Set the runtime `AUTH_PROVIDERS` value to `Google` only when the entire flow
   is configured. Complete one real login and logout before enabling it
   publicly.

Keep the Google client secret in the provider configuration, not source control.
If a CLI operation needs it, pass a private, owner-readable JSON file with
`file://`; never interpolate it into command arguments or print it. The
website's `COGNITO_CLIENT_SECRET` is a different secret, generated by Cognito.

The configured project now uses Google in both Cognito and the stack's
`SupportedProviders` parameter. The repeatable setup helper accepts an
owner-readable JSON credential file outside the repository containing
`client_id` and `client_secret` (or Google's `web` document). It performs a
read-only review by default; `--apply` changes AWS resources:

```sh
python3 infra/configure-google-provider.py --credentials /private/path/google-oauth.json
python3 infra/configure-google-provider.py --credentials /private/path/google-oauth.json --apply
```

The helper preserves every writable app-client setting, verifies the generated
Cognito client secret is unchanged, and preserves the selected provider list in
CloudFormation. Google controls the `email_verified` mapping; this attribute is
readable but cannot be granted app-client write permission. The mutable profile
mappings `email`, `name`, and `picture` remain writable for federation.

Only the basic Google identity scopes `openid`, `email`, and `profile` are
requested. Google explicitly exempts this scope set from the Testing status's
test-user allowlist and seven-day refresh-token expiry. This exception permits
basic sign-in testing without registering each tester; it does not establish
verified branding or request access to other Google APIs. See Google's
[OAuth app state comparison](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview)
and
[refresh-token expiration rules](https://developers.google.com/identity/protocols/oauth2/#expiration).

Google branding is not yet verified. The consent flow currently identifies the
Cognito hostname rather than the website's chosen display name and logo. Google
documents separate brand verification for a Published external app to display
that branding, including ownership checks for its authorized domains. Basic
identity scopes do not remove that branding requirement. See
[Google brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification).

Sources:
[Cognito social providers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html),
[attribute mapping](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-specifying-attribute-mapping.html),
[app clients](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html),
and
[Google OAuth for web servers](https://developers.google.com/identity/protocols/oauth2/web-server).
See also
[Cognito's Google mapping requirements](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp-google.html).

## Additional providers

The application includes native Cognito provider scaffolding for Amazon and
Facebook. Neither provider is registered or enabled yet. Each needs its own
developer registration, credentials, Cognito attribute mapping, and callback
configuration before its sign-in button is enabled. Follow the official
[Login with Amazon setup](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp-lwa.html)
or
[Facebook setup](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp-facebook.html).

After verifying a provider's complete flow, add its Cognito name
`LoginWithAmazon` or `Facebook` to both the stack's `SupportedProviders` and the
server's `AUTH_PROVIDERS` list. Google is the only configured provider today. Do
not automatically merge users just because different providers return the same
email address.

## Deno Deploy and the signed storage bridge

The application is `tejas-adg/personal-website` on the current Deno Deploy
service at `console.deno.com`, using the Fresh framework preset and
`deno task build`. Keep it dynamic: the server executes authentication and
authorization checks before protected content is returned.

The current AWS experience blocks IAM identity-provider operations, which
prevents Deno's direct OIDC Cloud Connection. Both Free and Paid project
policies contain that restriction. This implementation keeps the current
experience and uses a different, supported service integration: Lambda assumes a
service role and accesses DynamoDB. Deno receives no AWS access keys or AWS role
credentials. No IAM provider or team-member role is created.

[`infra/auth-store.yaml`](../infra/auth-store.yaml) creates this bridge with:

- A Node.js 22 Lambda handler, 128 MB memory, 15-second timeout, and reserved
  concurrency of 2. It has no VPC or provisioned concurrency.
- A Function URL with application-level authentication. Every operation requires
  an HMAC-SHA256 signature over the exact body, timestamp, and random nonce.
  Timestamps must be within 30 seconds; conditional DynamoDB nonce records
  prevent replay. No CORS policy is configured.
- A Lambda-only execution role with the reviewed table policy. Log writes are
  limited to its own precreated CloudWatch log group, retained for 7 days.
- Both required public Function URL invoke permissions. The underlying invoke
  permission is restricted to calls through the Function URL; ordinary direct
  Lambda invocation is not publicly allowed.

The URL is publicly reachable, so an invalid request still invokes the handler;
its signature is checked before database operations. The concurrency limit caps
simultaneous execution, but is not a monthly spending limit or WAF. The handler
accepts only the seven fixed `AuthStore` methods, never arbitrary table
commands. The signing secret stays exclusively in Lambda and Deno server
environments.

Each private screenshot requires fresh session and user reads through two RPC
calls. A gallery can therefore burst past the bridge's reserved concurrency of
2. `HttpAuthStore` serializes operations within each application instance and
uses one 10-second deadline that includes queue time, requests, and retries.
Only explicit HTTP 429 responses are retried, with bounded jittered backoff and
a new nonce and signature for each attempt. Ambiguous network failures and
server errors are not retried, so a write whose outcome is unknown cannot be
replayed automatically. This scheduling does not cache access grants or increase
AWS capacity; exhausted deadlines still fail closed.

The canonical Lambda source is
[`infra/auth-store-handler.cjs`](../infra/auth-store-handler.cjs). Before every
bridge deployment, regenerate the template's inline copy:

```sh
python3 infra/build-auth-store-template.py
aws cloudformation validate-template \
  --template-body file://infra/auth-store.yaml \
  --profile personal \
  --region us-east-2
```

The `AuthTableName` and `AuthTableArn` parameters must refer to the same
existing authentication table. Generate at least 32 cryptographically random
bytes for `AuthStoreSecret`, encode them as URL-safe text, and supply the value
through an owner-readable parameter file outside source control. The parameter
is `NoEcho`; it is never a stack output. Do not put its value in CLI arguments,
logs, public page data, or build-time variables. Initial provisioning uses the
stack name `tejasam-auth-store` with `CAPABILITY_IAM`. Updates should preserve
the existing secret unless rotating both runtimes together.

The stack's nonsecret outputs are saved in
[`infra/auth-store-outputs.json`](../infra/auth-store-outputs.json). Set the
`StoreUrl` output as `AUTH_STORE_URL` and the same private secret as
`AUTH_STORE_SECRET` in the Production runtime context. No Deno AWS Cloud
Connection is needed for this integration.

Sources:
[AWS project policy restrictions](https://docs.aws.amazon.com/accounts/latest/reference/scps-and-rcps-for-projects.html),
[Lambda Function URL authentication and permissions](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html),
[Lambda execution roles](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html),
[Deno Deploy build configuration](https://docs.deno.com/deploy/reference/builds/).

## Runtime configuration

Add these under Deno Deploy's application-level environment variables for the
Production context. Runtime secrets do not belong in the Build context. The
current application has these values configured for Production only. Check the
Deno Console for the revision currently routed to the production domains rather
than assuming a branch preview uses this context. Local verification uses a
separate gitignored environment file.

| Variable                | Value                                                             | Secret  |
| ----------------------- | ----------------------------------------------------------------- | ------- |
| `AUTH_ORIGIN`           | `https://tejasam.com` without a trailing slash                    | No      |
| `AUTH_TABLE_NAME`       | Authentication stack `TableName` output                           | No      |
| `AUTH_STORE_URL`        | Storage bridge stack `StoreUrl` output                            | No      |
| `AUTH_STORE_SECRET`     | Same private random signing secret as Lambda                      | **Yes** |
| `COGNITO_USER_POOL_ID`  | Stack `UserPoolId` output                                         | No      |
| `COGNITO_CLIENT_ID`     | Stack `ClientId` output                                           | No      |
| `COGNITO_CLIENT_SECRET` | Cognito app client's generated secret                             | **Yes** |
| `COGNITO_DOMAIN`        | Stack `CognitoDomain` output, including `https://`                | No      |
| `AUTH_PROVIDERS`        | `Google`; later `Google,LoginWithAmazon,Facebook` once configured | No      |
| `AUTH_SESSION_SECONDS`  | Optional; default `28800` (8 hours)                               | No      |
| `AUTH_RECENT_SECONDS`   | Optional; default `900` (15 minutes)                              | No      |

For local development, also set `AUTH_DEV_ORIGIN=http://localhost:5173` in a
gitignored environment file, use the same configured development callback, and
use the signed bridge configuration as well. Production should have no
`AUTH_DEV_ORIGIN`. The website needs no AWS CLI profile or AWS credentials. Do
not give preview deployments production secrets or unrestricted callback URLs.

The Cognito client registers exactly these website callbacks:

- `https://tejasam.com/auth/callback`
- `http://localhost:5173/auth/callback`

Its logout URLs are the corresponding origins with trailing `/`. New domains,
ports, or preview URLs must be registered deliberately; redirects must match
exactly.

Source:
[Deno Deploy environment variables and contexts](https://docs.deno.com/deploy/reference/env_vars_and_contexts/).

## Private user access tags

The table has one string partition key, `pk`, and three record families
(including an internal OAuth-prefix subtype):

| Prefix       | Purpose                                                        | Expiration  |
| ------------ | -------------------------------------------------------------- | ----------- |
| `USER#`      | Stable user identity and profile; private `accessTags` list    | No TTL      |
| `SESSION#`   | Opaque session-token hash and authentication timestamps        | `expiresAt` |
| `OAUTH#`     | Single-use browser-bound OAuth state, nonce, and PKCE verifier | `expiresAt` |
| `OAUTH#RPC:` | One-time signed storage-request nonce                          | `expiresAt` |

`accessTags` is an administrator-only list. The database is schemaless, so the
application reserves this attribute but never writes it during sign-in. An
absent list means `[]` and grants no tagged access. An administrator can
materialize or update it later without changing the profile schema. Keep the
administrative credential outside the deployed application.

The application policy permits profile metadata updates but excludes
`accessTags`; it also denies replacing or deleting `USER#` records and denies
explicit tag mutations. Sessions and OAuth transactions can be written or
removed only under their own prefixes. The backend still reads tags to enforce
access, using strongly consistent reads so successful role changes are reflected
on the next authorization check.

Future protected routes must call the server-side authorization guard before
loading or rendering content. Require both a matching tag and recent
authentication, and return 404 for anonymous, expired, stale, or untagged
access. At the user's explicit request, `/test` may show public sign-in or
access-denied screens within that 404 response. Other protected routes and all
protected asset failures retain the same generic 404 response. Never include
`accessTags` in page data, island props, JSON, cookies, provider attributes,
tokens, analytics, or logs. Public profiles must use the explicit public-user
allowlist.

DynamoDB TTL is delayed cleanup. Always compare `expiresAt` with the current
time in code, even when the record still exists. Do not put private content
under `static/` or another public asset path.

Sources:
[DynamoDB read consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html),
[TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html),
and
[IAM condition keys](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/specifying-conditions.html).

## Protected Aster journal

[`routes/test.tsx`](../routes/test.tsx) calls `requireAccess` with the immutable
server-side policy from [`lib/auth/page_access.ts`](../lib/auth/page_access.ts)
before importing the journal. A successful guard returns the journal with status
200. A failed guard returns status 404 with either the public sign-in screen or,
for a recognized signed-in user, the access-denied screen. A valid public
profile alone never grants access; it only selects the failure screen. Sign-in
links preserve `/test` as the return destination.

The content module (`private/AsterStory.tsx`), timeline
(`private/aster-story.ts`), and manifests (`private/aster-images.json` and
`private/aster-gallery.json`) stay in the server build. The route passes only
the public presentation state into page data. It sets
`Cache-Control: private, no-store`, `Vary: Cookie`, and
`X-Robots-Tag: noindex, nofollow` for both successful and failed page requests.

[`lib/auth/aster_assets.ts`](../lib/auth/aster_assets.ts) protects `/aster/*`
before Fresh's static-file middleware. Every request calls the same guard before
loading the manifest, checking file existence, or reading bytes. Only manifest
WebP basenames are served; JSON metadata, traversal, encoded paths, and unknown
files return the generic 404. HEAD, range, and conditional requests cannot
bypass the guard. Authorized responses are private and noncacheable; range and
conditional requests receive a full authorized response without a public
validator. No authorization result is cached between requests.

[`vite.config.ts`](../vite.config.ts) copies the 288 WebP files from
`private/aster/` into `_fresh/server/private/aster/` after the server build. It
does not emit them through Vite's public asset pipeline. Its filesystem deny
list also blocks `private/` through Vite's development file-serving endpoints.
During deployment verification, confirm `_fresh/client/` contains no journal
images or manifests and test direct image URLs as well as the page.

Only an administrator can assign or remove journal permission in the existing
AWS user record. Preserve unrelated permissions and condition updates on the
expected user identity and prior value to avoid replacing concurrent changes.
Use separate administrator credentials, never a browser request or the deployed
application role. Verify the result by checking access decisions; do not log or
return the private authorization list.

The public GitHub repository still contains the journal source and images,
including the files now in `private/`. Earlier deployments also published them.
This boundary protects requests to the updated website; it does not change
repository visibility, hide source files on GitHub, or retract historical
copies.

Validate signed-out sign-in presentation, allowed-user journal and image access,
denied-user failure presentation, and logout revocation. Both failed page states
must remain 404 and contain no journal data or image references. Repeat image
requests without authorization, including HEAD, Range, and conditional headers;
each must return the generic 404 without private bytes. The automated access and
asset tests run with `deno task test`; the full code checks and production build
remain `deno task check` and `deno task build`.

## Validation and policy review

The YAML and JSON files are parsed locally. The AWS `validate-template`
operation performs a read-only service validation; it does not provision
resources. `cfn-lint` and `cfn-guard` are not installed, so their
property-schema and compliance checks have not been run.

The storage bridge's change set passed CloudFormation's account-aware
pre-deployment validation. IAM simulation confirmed that profile metadata can be
updated, private tags cannot be changed, users cannot be replaced or deleted,
and session/OAuth operations remain confined to their key prefixes. The bridge
embeds the exact same reviewed database policy as the standalone policy files.
No CloudTrail trail is configured in the selected Region; management event
history provides the default 90-day record without durable trail retention.

The deployed bridge passed live checks for unsigned-request rejection, signed
request replay rejection, browser-bound single-use OAuth state, profile updates,
preservation of administrator-assigned tags, and session
creation/read/revocation. All synthetic verification records were removed
afterward. The deployed role, Function URL permissions, runtime limits, and log
retention were read back and matched the template. The configured Google
provider passed a real login against the local application. The local
`/api/session` response was checked to expose only the public user projection,
and a real logout revoked the session and returned to the website. The updated
Deno production revision `n1qs88w73cpe` passed a real Google login/logout smoke
test, public session field projection, anonymous account 404, and canonical
`www` sign-in redirect checks. That authentication baseline had 57 website tests
and 13 bridge tests passing, with formatting, lint, type checks, and the
production build passing. The journal gate adds separate page and
protected-asset coverage; report its deployment and browser results against the
actual new revision rather than the baseline revision above.

Run the handler's typed behavior tests with its isolated Node.js 22 type
configuration:

```sh
deno task test:infra
```

`deno task check` also formats, lints, and type-checks the bridge with this
configuration; the website keeps its browser and Deno types separately.

The original direct SDK adapter was checked with IAM Policy Autopilot 0.3.0. The
Lambda adapter uses the same four DynamoDB item actions. To repeat a source
policy analysis against the deployed handler:

```sh
uvx iam-policy-autopilot@0.3.0 generate-policies \
  /absolute/path/to/Personal\ Website/infra/auth-store-handler.cjs \
  --region us-east-2 \
  --account YOUR_AWS_PROJECT_IDENTIFIER \
  --service-hints dynamodb \
  --pretty
```

The reviewed application policy narrows that baseline to the four item
operations used here, the exact table, and permitted key prefixes and profile
attributes. It omits cross-Region replication and customer-KMS permissions
because this application uses neither. Re-run the analysis and review the policy
when new AWS SDK calls or database attributes are added.
