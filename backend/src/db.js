// Simple Mongo helper using the native driver
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/course_planner";
let client;
let db;

export async function getDb() {
  if (db) return db;
  client = new MongoClient(uri, { ignoreUndefined: true });
  await client.connect();
  const dbName = (new URL(uri)).pathname?.slice(1) || "course_planner";
  db = client.db(dbName);
  return db;
}
