import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { stories, storyImages } from "@/db/schema"

export const runtime = "nodejs"

// The version in the URL changes with every new photo, so a response never goes
// stale and the CDN can serve it forever without running this function again.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; version: string; size: string }> },
) {
  const { id, version, size } = await params
  const storyId = parseInt(id)
  const width = parseInt(size)
  if (!Number.isInteger(storyId) || !Number.isInteger(width)) return new Response(null, { status: 404 })

  const row = await db.select({ mimeType: storyImages.mimeType, data: storyImages.data })
    .from(storyImages)
    .innerJoin(stories, eq(stories.id, storyImages.storyId))
    .where(and(
      eq(storyImages.storyId, storyId),
      eq(storyImages.size, width),
      eq(stories.imageVersion, version),
    ))
    .get()
  if (!row) return new Response(null, { status: 404 })

  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
