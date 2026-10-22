/** The only user shape allowed in HTML, island props, or API responses. */
export interface PublicUser {
  id: string;
  name: string;
  email: string | null;
  picture: string | null;
}

export type ProviderId = "Google" | "LoginWithAmazon" | "Facebook";

export interface AuthProvider {
  id: ProviderId;
  name: string;
  configured: boolean;
}

/** SERVER ONLY. Never spread this object into page data or JSON. */
export interface UserRecord extends PublicUser {
  subject: string;
  emailVerified: boolean;
  /** PRIVATE AUTHORIZATION DATA. Never display, serialize, log, or accept from a user. */
  accessTags: readonly string[];
}

export interface SessionRecord {
  userId: string;
  authenticatedAt: number;
  expiresAt: number;
}

export interface OAuthTransaction {
  browserHash: string;
  verifier: string;
  nonce: string;
  returnTo: string;
  redirectUri: string;
  expiresAt: number;
}

export interface Identity {
  subject: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  picture: string | null;
  authenticatedAt: number;
}

export interface AuthStore {
  putTransaction(key: string, transaction: OAuthTransaction): Promise<void>;
  consumeTransaction(
    key: string,
    browserHash: string,
    now: number,
  ): Promise<OAuthTransaction | null>;
  upsertUser(id: string, identity: Identity, now: number): Promise<PublicUser>;
  getUser(id: string): Promise<UserRecord | null>;
  putSession(key: string, session: SessionRecord): Promise<void>;
  getSession(key: string): Promise<SessionRecord | null>;
  deleteSession(key: string): Promise<void>;
}

export function publicUser(user: PublicUser): PublicUser {
  // Explicit allowlist: accessTags and every future private column stay server-side.
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    picture: user.picture,
  };
}
