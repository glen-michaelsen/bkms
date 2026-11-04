import { authServerMetadata, corsPreflight, oauthJson, originFromHeaders } from "@/lib/oauth"

export const dynamic = "force-dynamic"

export const GET = (req: Request) => oauthJson(authServerMetadata(originFromHeaders(req.headers)))
export const OPTIONS = corsPreflight
