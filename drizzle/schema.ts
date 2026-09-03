import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const ewastePosts = mysqlTable("ewastePosts", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  deviceType: varchar("deviceType", { length: 32 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["open", "accepted", "collected"]).default("open").notNull(),
  photoKey: varchar("photoKey", { length: 512 }),
  photoUrl: varchar("photoUrl", { length: 1024 }),
  photoName: varchar("photoName", { length: 255 }),
  photoMimeType: varchar("photoMimeType", { length: 100 }),
  photoSize: int("photoSize"),
  collectionEvidenceKey: varchar("collectionEvidenceKey", { length: 512 }),
  collectionEvidenceUrl: varchar("collectionEvidenceUrl", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EwastePost = typeof ewastePosts.$inferSelect;
export type InsertEwastePost = typeof ewastePosts.$inferInsert;