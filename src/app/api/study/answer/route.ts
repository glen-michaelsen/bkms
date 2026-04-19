import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { userItemProgress, userDailyActivity } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { itemId, itemType, isCorrect } = await req.json()
  if (!itemId || !itemType || typeof isCorrect !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const userId = parseInt(session.user.id)
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC

  // ── Update item progress ──────────────────────────────────────────────────
  const existing = await db
    .select()
    .from(userItemProgress)
    .where(
      and(
        eq(userItemProgress.userId, userId),
        eq(userItemProgress.itemId, itemId),
        eq(userItemProgress.itemType, itemType)
      )
    )
    .get()

  let progress: { correctCount: number; incorrectCount: number; streak: number }

  if (existing) {
    progress = {
      correctCount: isCorrect ? existing.correctCount + 1 : existing.correctCount,
      incorrectCount: isCorrect ? existing.incorrectCount : existing.incorrectCount + 1,
      streak: isCorrect ? existing.streak + 1 : 0,
    }
    await db
      .update(userItemProgress)
      .set({ ...progress, lastSeenAt: new Date() })
      .where(eq(userItemProgress.id, existing.id))
  } else {
    progress = {
      correctCount: isCorrect ? 1 : 0,
      incorrectCount: isCorrect ? 0 : 1,
      streak: isCorrect ? 1 : 0,
    }
    await db.insert(userItemProgress).values({
      userId, itemId, itemType, ...progress, lastSeenAt: new Date(),
    })
  }

  // ── Upsert daily activity ─────────────────────────────────────────────────
  const todayActivity = await db
    .select()
    .from(userDailyActivity)
    .where(and(eq(userDailyActivity.userId, userId), eq(userDailyActivity.date, today)))
    .get()

  if (todayActivity) {
    await db
      .update(userDailyActivity)
      .set({ answersCount: todayActivity.answersCount + 1 })
      .where(eq(userDailyActivity.id, todayActivity.id))
  } else {
    await db.insert(userDailyActivity).values({ userId, date: today, answersCount: 1 })
  }

  return NextResponse.json({ ok: true, progress })
}
