import SubjectSearch from "@/components/site/SubjectSearch.client";
import { api } from "@/lib/api";
import type { Course } from "@/types";

async function getCoursesBySubject(
  subject: string,
  q?: string,
  level?: string
): Promise<(Course & { avgGpa?: number | null })[]> {
  const usp = new URLSearchParams();
  if (q) usp.set("q", q);
  if (level) usp.set("level", level);
  const path = `/courses/by-subject/${encodeURIComponent(subject)}${
    usp.toString() ? `?${usp.toString()}` : ""
  }`;
  try {
    return await api<(Course & { avgGpa?: number | null })[]>(path);
  } catch {
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    subject?: string | string[];
    sq?: string | string[];
    level?: string | string[];
  }>;
}) {
  const sp = await searchParams;

  const subject =
    typeof sp.subject === "string"
      ? sp.subject
      : Array.isArray(sp.subject)
      ? sp.subject[0]
      : "";

  if (!subject) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Find a Subject</h1>
        <SubjectSearch className="max-w-full" />
        <p className="text-sm text-gray-600">
          Start typing to see subjects. Press ↑/↓ to navigate, Enter to select.
        </p>
      </div>
    );
  }

  
  const sq =
    typeof sp.sq === "string" ? sp.sq : Array.isArray(sp.sq) ? sp.sq[0] : "";
  const level =
    typeof sp.level === "string"
      ? sp.level
      : Array.isArray(sp.level)
      ? sp.level[0]
      : "";

  const items = await getCoursesBySubject(subject, sq, level);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{subject} Courses</h1>

      <form className="flex flex-wrap items-center gap-2" action="/search">
        <input type="hidden" name="subject" value={subject} />
        <input
          name="sq"
          defaultValue={sq}
          placeholder={`Search within ${subject} (e.g., "400", "data", "intro")`}
          className="w-[28rem] max-w-full rounded-md border px-3 py-2 text-sm"
        />
        <select
          name="level"
          defaultValue={level}
          className="w-[140px] rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Any level</option>
          <option value="100">100-level</option>
          <option value="200">200-level</option>
          <option value="300">300-level</option>
          <option value="400">400-level</option>
        </select>
        <button className="rounded-md border px-3 py-2 text-sm">Apply</button>
        <a className="ml-auto text-sm underline" href="/search">
          ← Change subject
        </a>
      </form>

      <div className="grid gap-3">
        {items.map((c) => (
          <div key={c.courseId} className="card p-3 hover:shadow-[var(--shadow-soft)] hover:-translate-y-[1px] transition will-change-transform">
            <div className="font-semibold">
              {c.subject} {c.number} — {c.title}
            </div>
            <div className="text-xs mt-1 flex items-center gap-3">
              {typeof c.credits === "number" && (
                <span className="pill pill-blue">
                  Credits: {c.credits}
                </span>
              )}
              {typeof c.avgGpa === "number" && (
                <span className="pill pill-green">
                  Avg GPA: {c.avgGpa.toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-xs mt-1 flex flex-wrap items-center gap-2">  
              {Array.isArray((c as any).genEds) && (c as any).genEds.length > 0 && (
                <>
                  {(c as any).genEds.slice(0, 4).map((g: string, i: number) => (
                    <span key={g} className={`pill ${["pill-orange","pill-pink","pill-mint","pill-blue"][i%4]}`}>{g}</span>
                  ))}
                  {(c as any).genEds.length > 4 && (
                    <span className="pill">+{(c as any).genEds.length - 4} more</span>
                  )}
                </>
              )}
            </div>

            {c.prereqText && (
              <div className="text-sm opacity-70 mt-1">
                Prereq: {c.prereqText}
              </div>
            )}
            <a
              className="text-blue-600 text-sm underline mt-2 inline-block"
              href={`/c/${encodeURIComponent(c.courseId)}`}
            >
              View
            </a>
          </div>
        ))}
        {!items.length && (
          <div className="text-sm opacity-70">
            No courses found in {subject}.
          </div>
        )}
      </div>
    </div>
  );
}
