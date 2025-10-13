// web/lib/plan.ts
import { Plan } from "@/types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
export const USER_ID = "najam"; // later: read from auth

async function j<T>(res: Response) {
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function getPlan<T = any>() {
  const res = await fetch(`${API_BASE}/plans/${USER_ID}`, { cache: "no-store" });
  if (res.status === 404) return null;
  return j<T>(res);
}

export async function createOrReplacePlan(body: any) {
  const res = await fetch(`${API_BASE}/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, ...body }),
  });
  return j<any>(res);
}

export async function addToPlan(term: string, courseId: string, sectionId?: string | null) {
  const res = await fetch(`${API_BASE}/plans/${USER_ID}/add`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term, courseId, sectionId: sectionId ?? null }),
  });
  return j<any>(res);
}

export async function removeFromPlan(term: string, courseId: string, sectionId?: string) {
  const res = await fetch(`${API_BASE}/plans/${USER_ID}/remove`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term, courseId, sectionId }),
  });
  return j<any>(res);
}

// Multi-plan endpoints
export async function listPlans() {
  const res = await fetch(`${API_BASE}/plans?userId=${encodeURIComponent(USER_ID)}`, { cache: "no-store" });
  if (res.status === 404) return [];
  return j<Plan[]>(res);
}
export async function getPlanById(id: string) {
  const res = await fetch(`${API_BASE}/plans/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  return j<Plan>(res);
}
export async function createPlan(title: string) {
  const res = await fetch(`${API_BASE}/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, title, semesters: [], overload: false }),
  });
  return j<Plan>(res);
}
export async function renamePlan(id: string, title: string) {
  const res = await fetch(`${API_BASE}/plans/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op: "rename", title }),
  });
  return j<Plan>(res);
}
export async function setOverload(id: string, overload: boolean) {
  const res = await fetch(`${API_BASE}/plans/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op: "overload", overload }),
  });
  return j<Plan>(res);
}
export async function addCourse(id: string, term: string, courseId: string, credits?: number, sectionId?: string | null) {
  const res = await fetch(`${API_BASE}/plans/${id}/add`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term, courseId, sectionId: sectionId ?? null, credits }),
  });
  return j<Plan>(res);
}
export async function removeCourse(id: string, term: string, courseId: string, sectionId?: string) {
  const res = await fetch(`${API_BASE}/plans/${id}/remove`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term, courseId, sectionId }),
  });
  return j<Plan>(res);
}
export async function addSemester(id: string, term: string) {
  const res = await fetch(`${API_BASE}/plans/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op: "addTerm", term }),
  });
  return j<Plan>(res);
}

export async function renameSemester(id: string, oldTerm: string, newTerm: string) {
  const res = await fetch(`${API_BASE}/plans/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op: "renameTerm", oldTerm, newTerm }),
  });
  return j<Plan>(res);
}

// NEW: delete a plan
export async function deletePlan(id: string) {
  const res = await fetch(`${API_BASE}/plans/${id}`, { method: "DELETE" });
  if (res.status === 404) return { ok: false };
  return j<{ ok: true; id: string }>(res);
}
