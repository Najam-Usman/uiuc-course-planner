import type { RequirementNeed } from "./requirements";

export type CourseStatus = "completed" | "in_progress" | "ignored";
export type ParsedCourse = {
  term: string; subject: string; number: string; section: string | null;
  credits: number; grade: string; flags: string[]; status: CourseStatus; raw: string;
};

export type AuditCounters = {
  college_min_advanced_hours?: number; uiuc_gpa?: number; major_gpa?: number;
  earned_hours?: number; advanced_hours_earned?: number;
  advanced_hours_in_progress?: number; advanced_hours_needed?: number;
};

export type AuditMeta = { program: string; program_code?: string; degree: string; catalog_year: string; };

export type AuditResponse = {
  meta: AuditMeta; counters: AuditCounters;
  sample: { courses_count: number; sections_count: number };
  raw: any;
  stats: { courses_completed: number; courses_in_progress: number; courses_ignored: number };
};

export type AuditDoc = {
  _id: string; userId: string; meta: AuditMeta; counters: AuditCounters;
  courses: ParsedCourse[]; stats: AuditResponse["stats"];
  needs?: RequirementNeed[];            // <-- NEW
  createdAt: string;
};

export async function saveAudit(audit: AuditResponse, needs?: RequirementNeed[]) {
  const r = await fetch("/api/audits", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ audit, includeRaw: false, needs: needs ?? [] }),
  });
  const text = await r.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch {
    throw new Error(`Save proxy returned non-JSON (status ${r.status}): ${text.slice(0,120)}`);
  }
  if (!r.ok) throw new Error(data?.error || `Save failed (${r.status})`);
  return data as AuditDoc;
}

export async function fetchLatestAudit(): Promise<AuditDoc | null> {
  const r = await fetch("/api/audits/latest", { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error((await r.json()).error || `Fetch failed (${r.status})`);
  return (await r.json()) as AuditDoc;
}

/* prereq helpers (unchanged) */
export const courseKey = (s: string, n: string | number) => `${String(s).trim().toUpperCase()} ${String(n).trim()}`;
export type SatisfiedSets = { satisfied: Set<string>; completed: Set<string>; inProgress: Set<string>; };
export function buildSatisfiedSets(auditLike: { courses?: ParsedCourse[] }): SatisfiedSets {
  const satisfied = new Set<string>(), completed = new Set<string>(), inProgress = new Set<string>();
  for (const c of auditLike?.courses ?? []) {
    const id = courseKey(c.subject, c.number);
    if (c.status === "completed") { satisfied.add(id); completed.add(id); }
    else if (c.status === "in_progress") { satisfied.add(id); inProgress.add(id); }
  }
  return { satisfied, completed, inProgress };
}
