import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  language: text("language", { enum: ["sr", "hr"] }).notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const words = sqliteTable("words", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  english: text("english").notNull(),
  serbian: text("serbian").notNull(),
  croatian: text("croatian").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const sentences = sqliteTable("sentences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  english: text("english").notNull(),
  serbian: text("serbian").notNull(),
  croatian: text("croatian").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type User = typeof users.$inferSelect
export type Word = typeof words.$inferSelect
export type Sentence = typeof sentences.$inferSelect
