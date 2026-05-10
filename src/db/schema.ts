import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  language: text("language", { enum: ["sr", "hr"] }).notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  firstName: text("first_name"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  hintEnabled: integer("hint_enabled", { mode: "boolean" }).notNull().default(false),
  // Timezone & email preferences
  timezone: text("timezone").notNull().default("Europe/Belgrade"),
  streakMailEnabled: integer("streak_mail_enabled", { mode: "boolean" }).notNull().default(false),
  streakMailHour: integer("streak_mail_hour").notNull().default(20),
  verbOfDayEnabled: integer("verb_of_day_enabled", { mode: "boolean" }).notNull().default(false),
  verbOfDayEnabledAt: text("verb_of_day_enabled_at"), // YYYY-MM-DD, set when first enabled
  // Idempotency guards for cron mailers
  streakMailLastSentDate: text("streak_mail_last_sent_date"),
  verbMailLastSentDate: text("verb_mail_last_sent_date"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const levels = sqliteTable("levels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const words = sqliteTable("words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  english: text("english").notNull(),
  serbian: text("serbian").notNull(),
  croatian: text("croatian").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const sentences = sqliteTable("sentences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  english: text("english").notNull(),
  serbian: text("serbian").notNull(),
  croatian: text("croatian").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  levelId: integer("level_id").references(() => levels.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const userLevelConfig = sqliteTable("user_level_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  levelId: integer("level_id")
    .notNull()
    .references(() => levels.id),
  percentage: integer("percentage").notNull(),
})

export const userDailyActivity = sqliteTable("user_daily_activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD UTC
  answersCount: integer("answers_count").notNull().default(1),
})

export const userItemProgress = sqliteTable("user_item_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull(),
  itemType: text("item_type", { enum: ["word", "sentence"] }).notNull(),
  correctCount: integer("correct_count").notNull().default(0),
  incorrectCount: integer("incorrect_count").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const crosswordPuzzles = sqliteTable("crossword_puzzles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(), // YYYY-MM-DD
  puzzleJson: text("puzzle_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const userCrosswordProgress = sqliteTable("user_crossword_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD
  inputJson: text("input_json").notNull().default("{}"), // Record<"row,col", letter>
  solvedAt: integer("solved_at", { mode: "timestamp" }),
})

export const verbs = sqliteTable("verbs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  infinitive: text("infinitive").notNull(),       // Serbian infinitive, e.g. "piti"
  translation: text("translation").notNull(),     // English, e.g. "to drink"
  ja: text("ja").notNull(),                       // Serbian conjugations
  ti: text("ti").notNull(),
  onOna: text("on_ona").notNull(),
  mi: text("mi").notNull(),
  vi: text("vi").notNull(),
  oni: text("oni").notNull(),
  // Croatian forms — null means same as Serbian
  infinitiveHr: text("infinitive_hr"),
  jaHr: text("ja_hr"),
  tiHr: text("ti_hr"),
  onOnaHr: text("on_ona_hr"),
  miHr: text("mi_hr"),
  viHr: text("vi_hr"),
  oniHr: text("oni_hr"),
  examplesJson: text("examples_json").notNull().default("[]"), // [{serbian, croatian?, english}]
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const wordMatchPuzzles = sqliteTable("word_match_puzzles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(), // YYYY-MM-DD
  wordsJson: text("words_json").notNull(), // [{id, serbian, english}]
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const userWordMatchProgress = sqliteTable("user_word_match_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD
  solvedAt: integer("solved_at", { mode: "timestamp" }),
})

export type User = typeof users.$inferSelect
export type Verb = typeof verbs.$inferSelect
export type Category = typeof categories.$inferSelect
export type Level = typeof levels.$inferSelect
export type Word = typeof words.$inferSelect
export type Sentence = typeof sentences.$inferSelect
export type UserLevelConfig = typeof userLevelConfig.$inferSelect
