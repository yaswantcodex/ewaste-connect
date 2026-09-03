/* E-Waste Connect persistence: store post metadata and S3 keys, never binary file contents. */
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ewastePosts, InsertEwastePost, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEwastePost(post: InsertEwastePost) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(ewastePosts).values(post);
  const insertId = Number(result[0].insertId);
  const rows = await db.select().from(ewastePosts).where(eq(ewastePosts.id, insertId)).limit(1);
  return rows[0];
}

export async function getOpenEwastePosts(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ewastePosts)
    .where(eq(ewastePosts.status, "open"))
    .orderBy(desc(ewastePosts.createdAt))
    .limit(limit);
}

export async function getEwastePostsByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ewastePosts).where(eq(ewastePosts.ownerId, ownerId)).orderBy(desc(ewastePosts.createdAt));
}

export async function attachCollectionEvidence(postId: number, ownerId: number, file: { key: string; url: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(ewastePosts)
    .set({ collectionEvidenceKey: file.key, collectionEvidenceUrl: file.url, status: "collected" })
    .where(and(eq(ewastePosts.id, postId), eq(ewastePosts.ownerId, ownerId)));
  const rows = await db.select().from(ewastePosts).where(eq(ewastePosts.id, postId)).limit(1);
  return rows[0];
}

export async function acceptEwastePost(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(ewastePosts).set({ status: "accepted" }).where(eq(ewastePosts.id, postId));
  const rows = await db.select().from(ewastePosts).where(eq(ewastePosts.id, postId)).limit(1);
  return rows[0];
}
