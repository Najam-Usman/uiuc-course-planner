import { getDb } from "../db.js";

const COLLECTION = "audits";

export async function saveAudit({ userId, audit, includeRaw = false, needs = [] }) {
  const db = await getDb();
  const doc = {
    userId: userId ?? "demo",
    meta: audit.meta,
    counters: audit.counters,
    courses: audit.raw?.courses ?? [],
    stats: audit.stats ?? {},
    needs: Array.isArray(needs) ? needs : [],
    raw: includeRaw ? audit.raw : undefined,
    createdAt: new Date(),
  };
  await db.collection(COLLECTION).insertOne(doc);
  if (!includeRaw) delete doc.raw;
  return doc;
}

export async function getLatestAudit(userId = "demo") {
  const db = await getDb();
  const doc = await db
    .collection(COLLECTION)
    .find({ userId })
    .project({ raw: 0 }) 
    .sort({ createdAt: -1 })
    .limit(1)
    .next();
  return doc || null;
}
