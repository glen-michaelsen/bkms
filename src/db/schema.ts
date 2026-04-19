import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  language: text("language", { enum: ["sr", "hr"] }).notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  firstName: text("first_name"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
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

export type User = typeof users.$inferSelect
export type Category = typeof categories.$inferSelect
export type Level = typeof levels.$inferSelect
export type Word = typeof words.$inferSelect
export type Sentence = typeof sentences.$inferSelect
export type UserLevelConfig = typeof userLevelConfig.$inferSelect
