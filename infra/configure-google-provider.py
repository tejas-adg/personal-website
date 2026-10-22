#!/usr/bin/env python3
"""Configure Google federation without placing client secrets in arguments or output.

Run without --apply to validate credentials and prepare/review the change only.
Uses the AWS CLI rather than a Python SDK. Credential input must be owner-readable.
"""

import argparse
import hmac
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile
import time


ROOT = Path(__file__).resolve().parent
MAPPING = {
    "email": "email",
    "email_verified": "email_verified",
    "name": "name",
    "picture": "picture",
}
READ_ONLY = {"ClientSecret", "CreationDate", "LastModifiedDate"}


class AwsError(Exception):
    def __init__(self, action, stderr):
        match = re.search(r"An error occurred \(([^)]+)\)", stderr)
        self.code = match.group(1) if match else "CLIError"
        self.no_updates = "No updates are to be performed" in stderr
        super().__init__(f"AWS {action} failed ({self.code}); details withheld to protect secrets.")


def canonical(value):
    if isinstance(value, dict):
        return {key: canonical(item) for key, item in value.items()}
    if isinstance(value, list):
        items = [canonical(item) for item in value]
        return sorted(items) if all(isinstance(item, str) for item in items) else items
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--credentials", type=Path, default=Path("/tmp/tejasam-google-oauth.json"))
    parser.add_argument("--profile", default="personal")
    parser.add_argument("--stack-name", default="tejasam-auth")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    metadata = args.credentials.lstat()
    if not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != os.getuid():
        raise ValueError("Credential input must be a regular file owned by the current user.")
    if stat.S_IMODE(metadata.st_mode) & 0o077:
        raise ValueError("Credential input must have owner-only permissions (0600).")
    credentials = json.loads(args.credentials.read_text())
    credentials = credentials.get("web", credentials)
    client_id = credentials.get("client_id")
    client_secret = credentials.get("client_secret")
    if not isinstance(client_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]+\.apps\.googleusercontent\.com", client_id):
        raise ValueError("A Google Web application OAuth client ID is required.")
    if not isinstance(client_secret, str) or len(client_secret) < 16 or any(ord(char) < 33 for char in client_secret):
        raise ValueError("A valid Google OAuth client secret is required.")
    outputs = json.loads((ROOT / "auth-outputs.json").read_text())
    if outputs["region"] != "us-east-2":
        raise ValueError("This project must remain in its selected Region us-east-2.")
    pool_id = outputs["UserPoolId"]
    cognito_client = outputs["ClientId"]
    aws = shutil.which("aws") or str(Path.home() / ".local/bin/aws")

    def call(service, action, *arguments):
        command = [aws, service, action, *arguments, "--profile", args.profile,
                   "--region", "us-east-2", "--output", "json"]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode:
            raise AwsError(f"{service}:{action}", result.stderr)
        return json.loads(result.stdout or "{}")

    def current_client():
        return call("cognito-idp", "describe-user-pool-client", "--user-pool-id", pool_id,
                    "--client-id", cognito_client)["UserPoolClient"]

    before = current_client()
    accepted = set(call("cognito-idp", "update-user-pool-client", "--generate-cli-skeleton", "input"))
    unexpected = set(before) - accepted - READ_ONLY
    if unexpected:
        raise ValueError("The CLI cannot round-trip every app-client setting; update the CLI before continuing.")
    desired = {key: value for key, value in before.items() if key not in READ_ONLY}
    providers = [name for name in before.get("SupportedIdentityProviders", []) if name != "COGNITO"]
    if "Google" not in providers:
        providers.append("Google")
    desired["SupportedIdentityProviders"] = providers
    if "email_verified" in desired.get("WriteAttributes", []):
        raise ValueError("email_verified is provider-controlled and must not be writable by the app client.")
    if not set(MAPPING) <= set(desired.get("ReadAttributes", [])):
        raise ValueError("The app client must be able to read all four mapped attributes.")
    if not {"email", "name", "picture"} <= set(desired.get("WriteAttributes", [])):
        raise ValueError("The app client must allow the three mutable profile mappings.")
    try:
        existing = call("cognito-idp", "describe-identity-provider", "--user-pool-id", pool_id,
                        "--provider-name", "Google")["IdentityProvider"]
    except AwsError as error:
        if error.code != "ResourceNotFoundException":
            raise
        existing = None
    if existing and existing.get("ProviderType") != "Google":
        raise ValueError("An unrelated provider already uses the name Google; no provider was changed.")
    provider = {
        "UserPoolId": pool_id,
        "ProviderName": "Google",
        "ProviderDetails": {
            "client_id": client_id,
            "client_secret": client_secret,
            "authorize_scopes": "profile email openid",
        },
        "AttributeMapping": {**(existing or {}).get("AttributeMapping", {}), **MAPPING},
    }
    if existing and "IdpIdentifiers" in existing:
        provider["IdpIdentifiers"] = existing["IdpIdentifiers"]
    if not existing:
        provider["ProviderType"] = "Google"
    print("Prepared Google federation: four provider mappings; scopes profile/email/openid; "
          "preserve complete app-client configuration and update stack provider parameter.", flush=True)
    if not args.apply:
        print("Read-only review complete. No AWS resources were changed.")
        return

    with tempfile.TemporaryDirectory(prefix="tejasam-google-config-") as temporary:
        def private_json(name, value):
            path = Path(temporary) / name
            descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(descriptor, "w") as handle:
                json.dump(value, handle)
            return "file://" + str(path)

        provider_file = private_json("provider.json", provider)
        client_file = private_json("client.json", desired)
        private_json("client-before.json", before)
        action = "update-identity-provider" if existing else "create-identity-provider"
        call("cognito-idp", action, "--cli-input-json", provider_file)
        print("Google identity provider configured; updating the complete app client.", flush=True)
        call("cognito-idp", "update-user-pool-client", "--cli-input-json", client_file)
        stack = call("cloudformation", "describe-stacks", "--stack-name", args.stack_name)["Stacks"][0]
        parameters = []
        for parameter in stack["Parameters"]:
            key = parameter["ParameterKey"]
            parameters.append({"ParameterKey": key, "ParameterValue": ",".join(providers)}
                              if key == "SupportedProviders" else {"ParameterKey": key, "UsePreviousValue": True})
        if next((item.get("ParameterValue") for item in stack["Parameters"]
                 if item["ParameterKey"] == "SupportedProviders"), None) != ",".join(providers):
            parameter_file = private_json("stack-parameters.json", parameters)
            try:
                call("cloudformation", "update-stack", "--stack-name", args.stack_name,
                     "--use-previous-template", "--parameters", parameter_file)
            except AwsError as error:
                if not error.no_updates:
                    raise
            print("Preserving the Google provider list in the CloudFormation stack.", flush=True)
            deadline = time.monotonic() + 300
            while True:
                status = call("cloudformation", "describe-stacks", "--stack-name", args.stack_name)["Stacks"][0]["StackStatus"]
                if status == "UPDATE_COMPLETE":
                    break
                if status not in {"UPDATE_IN_PROGRESS", "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS"} or time.monotonic() > deadline:
                    raise RuntimeError("CloudFormation provider-parameter update did not finish successfully: " + status)
                time.sleep(3)
        after = current_client()
        comparable = lambda value: canonical({key: item for key, item in value.items() if key not in READ_ONLY})
        if comparable(after) != canonical(desired):
            # CloudFormation must not reset any existing setting it did not manage.
            call("cognito-idp", "update-user-pool-client", "--cli-input-json", client_file)
            after = current_client()
        if comparable(after) != canonical(desired):
            raise RuntimeError("App-client settings could not be preserved; review before enabling sign-in.")
        if not hmac.compare_digest(before.get("ClientSecret", ""), after.get("ClientSecret", "")):
            raise RuntimeError("The Cognito client secret unexpectedly changed; review runtime configuration.")
        configured = call("cognito-idp", "describe-identity-provider", "--user-pool-id", pool_id,
                          "--provider-name", "Google")["IdentityProvider"]
        if not all(configured["AttributeMapping"].get(key) == value for key, value in MAPPING.items()):
            raise RuntimeError("The provider attribute mapping did not match the intended configuration.")
        if configured["ProviderDetails"].get("client_id") != client_id:
            raise RuntimeError("The provider did not retain the intended Google client identifier.")
        if not hmac.compare_digest(configured["ProviderDetails"].get("client_secret", ""), client_secret):
            raise RuntimeError("The provider did not retain the intended Google client secret.")
        final_stack = call("cloudformation", "describe-stacks", "--stack-name", args.stack_name)["Stacks"][0]
        if next((item.get("ParameterValue") for item in final_stack["Parameters"]
                 if item["ParameterKey"] == "SupportedProviders"), None) != ",".join(providers):
            raise RuntimeError("The stack provider parameter does not match the configured client.")
    print("Google federation verified. Other app-client settings and its generated secret are unchanged.")


if __name__ == "__main__":
    try:
        main()
    except (AwsError, OSError, ValueError, RuntimeError) as error:
        raise SystemExit(str(error)) from None
