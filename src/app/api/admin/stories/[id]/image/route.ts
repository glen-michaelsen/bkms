import crypto from "node:crypto"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { stories, storyImages } from "@/db/schema"
import { STORY_IMAGE_SIZES } from "@/lib/stories"

export const runtime = "nodejs"

const MAX_BYTES_PER_SIZE = 1024 * 1024

/** Trusts the bytes rather than the upload's claimed type, since the type is served back to browsers. */
function sniffMimeType(bytes: Buffer): "image/webp" | "image/jpeg" | null {
  if (bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") {
    return "image/webp"
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  return null
}

async function authorizedStoryId(params: Promise<{ id: string }>) {
  const session = await auth()
  if (session?.user.role !== "admin") return { error: NextResponse.json({ error: "Not authorized" }, { status: 403 }) }
  const id = parseInt((await params).id)
  const story = Number.isInteger(id)
    ? await db.select({ id: stories.id }).from(stories).where(eq(stories.id, id)).get()
    : null
  if (!story) return { error: NextResponse.json({ error: "Story not found" }, { status: 404 }) }
  return { id: story.id }
}

function refresh() {
  revalidatePath("/stories", "layout")
  revalidatePath("/admin")
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const story = await authorizedStoryId(params)
  if (story.error) return story.error

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: "Invalid upload" }, { status: 400 })

  const rows = []
  for (const size of STORY_IMAGE_SIZES) {
    const file = form.get(String(size))
    if (!(file instanceof Blob)) return NextResponse.json({ error: `Missing ${size}px image` }, { status: 400 })
    if (file.size > MAX_BYTES_PER_SIZE) return NextResponse.json({ error: `${size}px image is too large` }, { status: 400 })
    const data = Buffer.from(await file.arrayBuffer())
    const mimeType = sniffMimeType(data)
    if (!mimeType) return NextResponse.json({ error: "Only WebP or JPEG images are accepted" }, { status: 400 })
    rows.push({ storyId: story.id, size, mimeType, data })
  }

  const imageVersion = crypto.randomBytes(8).toString("hex")
  await db.batch([
    db.delete(storyImages).where(eq(storyImages.storyId, story.id)),
    db.insert(storyImages).values(rows),
    db.update(stories).set({ imageVersion }).where(eq(stories.id, story.id)),
  ])
  refresh()
  return NextResponse.json({ imageVersion })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const story = await authorizedStoryId(params)
  if (story.error) return story.error
  await db.batch([
    db.update(stories).set({ imageVersion: null }).where(eq(stories.id, story.id)),
    db.delete(storyImages).where(eq(storyImages.storyId, story.id)),
  ])
  refresh()
  return NextResponse.json({})
}
