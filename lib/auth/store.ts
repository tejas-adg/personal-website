import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  type AuthStore,
  type Identity,
  type OAuthTransaction,
  publicUser,
  type SessionRecord,
  type UserRecord,
} from "./types.ts";

/** Server-only adapter. No table scanning or public attribute-update endpoint. */
export class DynamoAuthStore implements AuthStore {
  private client;
  constructor(private tableName: string) {
    // Deno Deploy Cloud Connections supply AWS_ROLE_ARN + AWS_WEB_IDENTITY_TOKEN_FILE.
    // The official SDK default chain uses those short-lived, server-only credentials.
    this.client = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: "us-east-2", maxAttempts: 3 }),
      { marshallOptions: { removeUndefinedValues: true } },
    );
  }

  async putTransaction(
    key: string,
    transaction: OAuthTransaction,
  ): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: { pk: `OAUTH#${key}`, entity: "oauth", ...transaction },
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
  }

  async consumeTransaction(
    key: string,
    browserHash: string,
    now: number,
  ): Promise<OAuthTransaction | null> {
    try {
      const result = await this.client.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { pk: `OAUTH#${key}` },
          ConditionExpression: "browserHash = :browser AND expiresAt > :now",
          ExpressionAttributeValues: { ":browser": browserHash, ":now": now },
          ReturnValues: "ALL_OLD",
        }),
      );
      return result.Attributes as OAuthTransaction | undefined ?? null;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) return null;
      throw error;
    }
  }

  async upsertUser(id: string, identity: Identity, now: number) {
    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: `USER#${id}` },
        // accessTags is deliberately absent. Only an administrator may assign it.
        UpdateExpression:
          "SET entity = :entity, id = :id, subject = :subject, #name = :name, email = :email, emailVerified = :verified, picture = :picture, updatedAt = :now, lastSignInAt = :now, createdAt = if_not_exists(createdAt, :now)",
        ExpressionAttributeNames: { "#name": "name" },
        ExpressionAttributeValues: {
          ":entity": "user",
          ":id": id,
          ":subject": identity.subject,
          ":name": identity.name,
          ":email": identity.email,
          ":verified": identity.emailVerified,
          ":picture": identity.picture,
          ":now": now,
        },
      }),
    );
    return publicUser({
      id,
      name: identity.name,
      email: identity.email,
      picture: identity.picture,
    });
  }

  async getUser(id: string): Promise<UserRecord | null> {
    const { Item } = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `USER#${id}` },
        ConsistentRead: true,
      }),
    );
    if (
      !Item || Item.entity !== "user" || Item.id !== id ||
      typeof Item.name !== "string" || typeof Item.subject !== "string"
    ) return null;
    const tags = Array.isArray(Item.accessTags) &&
        Item.accessTags.every((tag: unknown) => typeof tag === "string")
      ? Item.accessTags as string[]
      : [];
    return {
      id,
      subject: Item.subject,
      name: Item.name,
      email: typeof Item.email === "string" ? Item.email : null,
      emailVerified: Item.emailVerified === true,
      picture: typeof Item.picture === "string" ? Item.picture : null,
      accessTags: tags,
    };
  }

  async putSession(key: string, session: SessionRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: { pk: `SESSION#${key}`, entity: "session", ...session },
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
  }

  async getSession(key: string): Promise<SessionRecord | null> {
    const { Item } = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `SESSION#${key}` },
        ConsistentRead: true,
      }),
    );
    if (
      !Item || Item.entity !== "session" || typeof Item.userId !== "string" ||
      !Number.isSafeInteger(Item.authenticatedAt) ||
      !Number.isSafeInteger(Item.expiresAt)
    ) return null;
    return {
      userId: Item.userId,
      authenticatedAt: Item.authenticatedAt,
      expiresAt: Item.expiresAt,
    };
  }

  async deleteSession(key: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `SESSION#${key}` },
      }),
    );
  }
}
