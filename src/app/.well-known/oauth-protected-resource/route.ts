import { corsPreflight, oauthJson, originFromHeaders, protectedResourceMetadata } from "@/lib/oauth"

export const dynamic = "force-dynamic"

export const GET = (req: Request) => oauthJson(protectedResourceMetadata(originFromHeaders(req.headers)))
export const OPTIONS = corsPreflight
