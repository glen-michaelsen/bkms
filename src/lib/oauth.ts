import crypto from "node:crypto"
import { and, eq, gt, isNull } from "drizzle-orm"
import { db } from "@/db"
import { oauthClients, oauthTokens } from "@/db/schema"

export const MCP_PATH = "/mcp"
export const MCP_SCOPE = "learning:read"
export const ACCESS_TOKEN_TTL_S = 60 * 60
export const REFRESH_TOKEN_TTL_S = 60 * 60 * 24 * 30
export const CODE_TTL_S = 10 * 60

export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex")
export const randomToken = () => crypto.randomBytes(32).toString("base64url")

/** Public origin of this deployment, so dev and prod each advertise their own URLs. */
export function originFromHeaders(headers: Headers): string {
  const first = (name: string) => headers.get(name)?.split(",")[0].trim()
  const host = first("x-forwarded-host") ?? first("host")
  const proto = first("x-forwarded-proto") ?? "https"
  return host ? `${proto}://${host}` : "https://cujemose.com"
}

/** A client-supplied `resource` must identify this MCP server. Absent is allowed. */
export function isValidResource(resource: string | null | undefined, origin: string): boolean {
  if (!resource) return true
  return resource.replace(/\/+$/, "") === `${origin}${MCP_PATH}`
}

/** HTTPS, or plain HTTP on loopback for local clients. No fragments. */
export function isAllowedRedirectUri(uri: unknown): uri is string {
  if (typeof uri !== "string" || uri.length > 2000) return false
  try {
    const u = new URL(uri)
    if (u.hash || u.username || u.password) return false
    if (u.protocol === "https:") return true
    return u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)
  } catch {
    return false
  }
}

export function verifyPkce(verifier: string, challenge: string): boolean {
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false
  const computed = Buffer.from(crypto.createHash("sha256").update(verifier).digest("base64url"))
  const expected = Buffer.from(challenge)
  return computed.length === expected.length && crypto.timingSafeEqual(computed, expected)
}

export async function getClient(clientId: string) {
  const client = await db.select().from(oauthClients).where(eq(oauthClients.clientId, clientId)).get()
  if (!client) return null
  return { ...client, redirectUris: JSON.parse(client.redirectUris) as string[] }
}

export async function issueTokens(args: {
  clientId: string; userId: number; familyId: string; resource: string | null
}) {
  const accessToken = randomToken()
  const refreshToken = randomToken()
  const now = Date.now()
  await db.insert(oauthTokens).values([
    { ...args, tokenHash: sha256(accessToken), kind: "access", expiresAt: new Date(now + ACCESS_TOKEN_TTL_S * 1000) },
    { ...args, tokenHash: sha256(refreshToken), kind: "refresh", expiresAt: new Date(now + REFRESH_TOKEN_TTL_S * 1000) },
  ])
  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_S,
    refresh_token: refreshToken,
    scope: MCP_SCOPE,
  }
}

export const revokeFamily = (familyId: string) =>
  db.update(oauthTokens).set({ revokedAt: new Date() })
    .where(and(eq(oauthTokens.familyId, familyId), isNull(oauthTokens.revokedAt)))

/** Revokes every assistant connection, e.g. after a password change. */
export const revokeAllForUser = (userId: number) =>
  db.update(oauthTokens).set({ revokedAt: new Date() })
    .where(and(eq(oauthTokens.userId, userId), isNull(oauthTokens.revokedAt)))

/** Resolves a bearer token to its user, or null if unknown, expired, revoked or for another resource. */
export async function authenticateAccessToken(token: string, origin: string): Promise<number | null> {
  const row = await db.select().from(oauthTokens).where(and(
    eq(oauthTokens.tokenHash, sha256(token)),
    eq(oauthTokens.kind, "access"),
    isNull(oauthTokens.revokedAt),
    gt(oauthTokens.expiresAt, new Date()),
  )).get()
  if (!row || !isValidResource(row.resource, origin)) return null
  return row.userId
}

/** Credentialless OAuth and MCP endpoints authenticate by bearer token, never cookies, so any origin may call them. */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
}

export function oauthJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store" } })
}

export const corsPreflight = () => new Response(null, { status: 204, headers: CORS_HEADERS })

export function authServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [MCP_SCOPE],
    authorization_response_iss_parameter_supported: true,
  }
}

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}${MCP_PATH}`,
    authorization_servers: [origin],
    scopes_supported: [MCP_SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "Čujemo se",
  }
}
