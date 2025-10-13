import fs from "fs";
import path from "path";
export const auditsDir = path.resolve(path.join(process.cwd(), "..", "data", "audits"));
export function ensureAuditsDirSync() {
  if (!fs.existsSync(auditsDir)) fs.mkdirSync(auditsDir, { recursive: true });
}
