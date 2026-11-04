import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { categories, levels, sentences, userItemProgress, users, words } from "@/db/schema"
import { getItemStatus, type KnowledgeStatus } from "@/lib/progress"

const INSTRUCTIONS = `Čujemo se is a Serbian and Croatian learning app. These tools return what this learner has practised.

Status meanings: "known" = 3 or more correct in a row. "familiar" = answered correctly at least once. "learning" = practised but never correct yet. "new" = not practised yet.

When asked for a story, dialogue or exercise, call get_learning_profile first to see the target language and level of progress. Build mainly on known and familiar items, work in learning items for repetition, and introduce new vocabulary sparingly unless asked. Write in the target language the profile reports, using the exact forms returned, since they already match the learner's language and gender.`

const STATUSES = ["known", "familiar", "learning", "new"] as const
const PRACTISED: KnowledgeStatus[] = ["known", "familiar", "learning"]

type Learner = { language: "sr" | "hr"; gender: "male" | "female"; studyDirection: "to_slavic" | "to_english" }

type Translatable = {
  english: string; serbian: string; croatian: string
  serbianFemale: string | null; croatianFemale: string | null
}

async function getLearner(userId: number): Promise<Learner> {
  const row = await db.select({
    language: users.language, gender: users.gender, studyDirection: users.studyDirection,
  }).from(users).where(eq(users.id, userId)).get()
  if (!row) throw new Error("Learner not found")
  return row
}

/** Same form selection as the study sessions, so the assistant uses what the learner sees. */
function targetAndTranslation(item: Translatable, learner: Learner) {
  const base = learner.language === "sr" ? item.serbian : item.croatian
  const female = learner.language === "sr" ? item.serbianFemale : item.croatianFemale
  const slavic = learner.gender === "female" && female ? female : base
  return learner.studyDirection === "to_english"
    ? { target: item.english, translation: slavic }
    : { target: slavic, translation: item.english }
}

const progressFields = {
  correct: userItemProgress.correctCount,
  incorrect: userItemProgress.incorrectCount,
  streak: userItemProgress.streak,
  lastSeenAt: userItemProgress.lastSeenAt,
}

const fetchWords = (userId: number) => db
  .select({
    id: words.id,
    english: words.english, serbian: words.serbian, croatian: words.croatian,
    serbianFemale: words.serbianFemale, croatianFemale: words.croatianFemale,
    category: categories.name,
    ...progressFields,
  })
  .from(words)
  .leftJoin(categories, eq(words.categoryId, categories.id))
  .leftJoin(userItemProgress, and(
    eq(userItemProgress.itemId, words.id),
    eq(userItemProgress.itemType, "word"),
    eq(userItemProgress.userId, userId),
  ))
  .all()
  .then(rows => rows.map(r => ({ ...r, level: null as string | null })))

const fetchSentences = (userId: number) => db
  .select({
    id: sentences.id,
    english: sentences.english, serbian: sentences.serbian, croatian: sentences.croatian,
    serbianFemale: sentences.serbianFemale, croatianFemale: sentences.croatianFemale,
    category: categories.name,
    level: levels.name,
    ...progressFields,
  })
  .from(sentences)
  .leftJoin(categories, eq(sentences.categoryId, categories.id))
  .leftJoin(levels, eq(sentences.levelId, levels.id))
  .leftJoin(userItemProgress, and(
    eq(userItemProgress.itemId, sentences.id),
    eq(userItemProgress.itemType, "sentence"),
    eq(userItemProgress.userId, userId),
  ))
  .all()

type Row = Awaited<ReturnType<typeof fetchSentences>>[number]

function statusOf(row: Row): KnowledgeStatus {
  if (row.correct === null || row.incorrect === null || row.streak === null) return "new"
  return getItemStatus({ correctCount: row.correct, incorrectCount: row.incorrect, streak: row.streak })
}

function countByStatus(rows: Row[]) {
  const counts = { known: 0, familiar: 0, learning: 0, new: 0, total: rows.length }
  for (const row of rows) counts[statusOf(row)]++
  return counts
}

const listInput = {
  status: z.array(z.enum(STATUSES)).optional()
    .describe('Statuses to include. Defaults to everything practised: known, familiar and learning.'),
  category: z.string().optional().describe('Only this category, e.g. "Food". Case-insensitive.'),
  sort: z.enum(["recent", "struggling", "alphabetical"]).optional()
    .describe('"recent" (default) = last practised first. "struggling" = most wrong answers first.'),
  limit: z.number().int().min(1).max(500).optional().describe("Items per page, default 100."),
  offset: z.number().int().min(0).optional().describe("Items to skip, for paging."),
}

type ListArgs = {
  status?: KnowledgeStatus[]; category?: string
  sort?: "recent" | "struggling" | "alphabetical"; limit?: number; offset?: number
}

function listItems(rows: Row[], learner: Learner, args: ListArgs) {
  const statuses = args.status?.length ? args.status : PRACTISED
  const category = args.category?.trim().toLowerCase()
  const limit = args.limit ?? 100
  const offset = args.offset ?? 0

  const items = rows
    .map(row => ({ row, status: statusOf(row), ...targetAndTranslation(row, learner) }))
    .filter(i => statuses.includes(i.status))
    .filter(i => !category || i.row.category?.toLowerCase() === category)

  const seenAt = (i: (typeof items)[number]) => i.row.lastSeenAt?.getTime() ?? 0
  const compare: Record<NonNullable<ListArgs["sort"]>, (a: typeof items[number], b: typeof items[number]) => number> = {
    recent: (a, b) => seenAt(b) - seenAt(a),
    struggling: (a, b) =>
      (b.row.incorrect ?? 0) - (a.row.incorrect ?? 0) || (a.row.correct ?? 0) - (b.row.correct ?? 0),
    alphabetical: (a, b) => a.target.localeCompare(b.target),
  }
  items.sort(compare[args.sort ?? "recent"])

  return {
    total: items.length,
    offset,
    limit,
    hasMore: offset + limit < items.length,
    items: items.slice(offset, offset + limit).map(i => ({
      target: i.target,
      translation: i.translation,
      status: i.status,
      correct: i.row.correct ?? 0,
      incorrect: i.row.incorrect ?? 0,
      lastPractised: i.row.lastSeenAt?.toISOString().slice(0, 10) ?? null,
      category: i.row.category,
      ...(i.row.level ? { level: i.row.level } : {}),
    })),
  }
}

const asResult = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data) }],
})

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }

/** A fresh server per request: the endpoint is stateless and each is bound to one authenticated user. */
export function createMcpServer(userId: number) {
  const server = new McpServer({ name: "cujemose", version: "1.0.0" }, { instructions: INSTRUCTIONS })

  server.registerTool("get_learning_profile", {
    title: "Get learning profile",
    description: "The learner's target language, gender for word forms, progress counts for words and sentences, and available categories. Call this first.",
    annotations: READ_ONLY,
  }, async () => {
    const [learner, wordRows, sentenceRows] = await Promise.all([
      getLearner(userId), fetchWords(userId), fetchSentences(userId),
    ])
    const slavic = learner.language === "sr" ? "Serbian" : "Croatian"
    const names = [...new Set([...wordRows, ...sentenceRows].map(r => r.category).filter(Boolean))].sort()
    return asResult({
      targetLanguage: learner.studyDirection === "to_english" ? "English" : slavic,
      translationLanguage: learner.studyDirection === "to_english" ? slavic : "English",
      gender: learner.gender,
      words: countByStatus(wordRows),
      sentences: countByStatus(sentenceRows),
      categories: names,
    })
  })

  server.registerTool("get_words", {
    title: "Get words",
    description: "Words with this learner's status and practice history. Use to base stories and exercises on vocabulary they are actually learning.",
    inputSchema: listInput,
    annotations: READ_ONLY,
  }, async (args) => {
    const [learner, rows] = await Promise.all([getLearner(userId), fetchWords(userId)])
    return asResult(listItems(rows, learner, args))
  })

  server.registerTool("get_sentences", {
    title: "Get sentences",
    description: "Sentences with this learner's status and practice history. Use to see which structures and phrases they have practised.",
    inputSchema: listInput,
    annotations: READ_ONLY,
  }, async (args) => {
    const [learner, rows] = await Promise.all([getLearner(userId), fetchSentences(userId)])
    return asResult(listItems(rows, learner, args))
  })

  return server
}
