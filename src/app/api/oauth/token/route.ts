import { and, eq, isNull } from "drizzle-orm"
import { db } from "@/db"
import { oauthCodes, oauthTokens } from "@/db/schema"
import {
  corsPreflight, isValidResource, issueTokens, oauthJson, originFromHeaders, revokeFamily, sha256, verifyPkce,
} from "@/lib/oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const OPTIONS = corsPreflight

const invalidGrant = () => oauthJson({ error: "invalid_grant" }, 400)

export async function POST(req: Request) {
  const params = new URLSearchParams(await req.text())
  const grantType = params.get("grant_type")
  const clientId = params.get("client_id")
  const resource = params.get("resource")

  if (!clientId) return oauthJson({ error: "invalid_client" }, 401)
  if (!isValidResource(resource, originFromHeaders(req.headers))) {
    return oauthJson({ error: "invalid_target" }, 400)
  }

  if (grantType === "authorization_code") return exchangeCode(params, clientId)
  if (grantType === "refresh_token") return rotateRefreshToken(params, clientId)
  return oauthJson({ error: "unsupported_grant_type" }, 400)
}

async function exchangeCode(params: URLSearchParams, clientId: string) {
  const code = params.get("code")
  const verifier = params.get("code_verifier")
  if (!code || !verifier) return oauthJson({ error: "invalid_request" }, 400)

  const row = await db.select().from(oauthCodes).where(eq(oauthCodes.codeHash, sha256(code))).get()
  if (!row || row.clientId !== clientId) return invalidGrant()

  // A replayed code means it leaked: revoke whatever was issued from it.
  if (row.usedAt) {
    await revokeFamily(row.familyId)
    return invalidGrant()
  }
  if (
    row.expiresAt.getTime() < Date.now() ||
    row.redirectUri !== params.get("redirect_uri") ||
    !verifyPkce(verifier, row.codeChallenge)
  ) {
    return invalidGrant()
  }

  // The used_at guard makes redemption atomic if two requests race.
  const consumed = await db.update(oauthCodes).set({ usedAt: new Date() })
    .where(and(eq(oauthCodes.id, row.id), isNull(oauthCodes.usedAt)))
    .returning({ id: oauthCodes.id })
  if (consumed.length === 0) return invalidGrant()

  return oauthJson(await issueTokens({
    clientId, userId: row.userId, familyId: row.familyId, resource: row.resource,
  }))
}

async function rotateRefreshToken(params: URLSearchParams, clientId: string) {
  const token = params.get("refresh_token")
  if (!token) return oauthJson({ error: "invalid_request" }, 400)

  const row = await db.select().from(oauthTokens).where(and(
    eq(oauthTokens.tokenHash, sha256(token)),
    eq(oauthTokens.kind, "refresh"),
  )).get()
  if (!row || row.clientId !== clientId) return invalidGrant()

  if (row.usedAt) {
    await revokeFamily(row.familyId)
    return invalidGrant()
  }
  if (row.revokedAt || row.expiresAt.getTime() < Date.now()) return invalidGrant()

  const rotated = await db.update(oauthTokens).set({ usedAt: new Date() })
    .where(and(eq(oauthTokens.id, row.id), isNull(oauthTokens.usedAt)))
    .returning({ id: oauthTokens.id })
  if (rotated.length === 0) {
    await revokeFamily(row.familyId)
    return invalidGrant()
  }

  return oauthJson(await issueTokens({
    clientId, userId: row.userId, familyId: row.familyId, resource: row.resource,
  }))
}
