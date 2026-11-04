import { db } from "@/db"
import { oauthClients } from "@/db/schema"
import { corsPreflight, isAllowedRedirectUri, MCP_SCOPE, oauthJson, randomToken } from "@/lib/oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const OPTIONS = corsPreflight

// Dynamic client registration (RFC 7591). Clients are public: PKCE replaces a secret.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { redirect_uris?: unknown; client_name?: unknown } | null
  const uris = body?.redirect_uris
  if (!Array.isArray(uris) || uris.length === 0 || uris.length > 5 || !uris.every(isAllowedRedirectUri)) {
    return oauthJson({
      error: "invalid_redirect_uri",
      error_description: "redirect_uris must list 1 to 5 https or loopback URLs",
    }, 400)
  }

  const name = typeof body?.client_name === "string" && body.client_name.trim()
    ? body.client_name.trim().slice(0, 100)
    : "Unnamed app"
  const clientId = randomToken()
  await db.insert(oauthClients).values({ clientId, name, redirectUris: JSON.stringify(uris) })

  return oauthJson({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: name,
    redirect_uris: uris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    scope: MCP_SCOPE,
  }, 201)
}
