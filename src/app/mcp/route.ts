import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { createMcpServer } from "@/lib/mcp-server"
import { authenticateAccessToken, CORS_HEADERS, corsPreflight, MCP_PATH, originFromHeaders } from "@/lib/oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const OPTIONS = corsPreflight

function unauthorized(origin: string, hadToken: boolean) {
  const challenge = [
    `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource${MCP_PATH}"`,
    ...(hadToken ? ['error="invalid_token"'] : []),
  ].join(", ")
  return new Response(null, { status: 401, headers: { ...CORS_HEADERS, "WWW-Authenticate": challenge } })
}

export async function POST(req: Request) {
  const origin = originFromHeaders(req.headers)
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
  const userId = token ? await authenticateAccessToken(token, origin) : null
  if (!userId) return unauthorized(origin, !!token)

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  const server = createMcpServer(userId)
  await server.connect(transport)

  const response = await transport.handleRequest(req)
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value)
  return new Response(response.body, { status: response.status, headers })
}

// Stateless server: no standalone event stream and no sessions to close.
const methodNotAllowed = () =>
  new Response(null, { status: 405, headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" } })

export const GET = methodNotAllowed
export const DELETE = methodNotAllowed
