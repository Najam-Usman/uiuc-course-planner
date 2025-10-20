"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCourse } from "@/lib/plan";
import { X } from "lucide-react";

type CourseRow = {
  courseId: string;
  subject: string;
  number: string;
  title: string;
  description?: string;
  prereqText?: string;
  credits?: number;
  avgGpa?: number | null;
  genEds?: string[];
};

export default function CoursePicker({
  planId,
  term,
  currentCredits,
  overload,
}: {
  planId: string;
  term: string;
  currentCredits: number;
  overload: boolean;
}) {
  const [open, setOpen] = useState(false);

  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [subjQuery, setSubjQuery] = useState("");
  const [subject, setSubject] = useState<string>("");
  const [subjOpen, setSubjOpen] = useState(false);
  const [subjHighlight, setSubjHighlight] = useState(-1);
  const subjBoxRef = useRef<HTMLDivElement | null>(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [sq, setSq] = useState("");
  const [level, setLevel] = useState("");
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [pending, start] = useTransition();

  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
  const CAP = 18;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoadingSubjects(true);
    fetch(`${API_BASE}/courses/subjects`)
      .then((r) => (r.ok ? r.json() : []))
      .then((arr: string[]) => {
        if (!alive) return;
        const uniq = Array.from(
          new Set(
            (arr || []).filter(Boolean).map((s) => String(s).trim().toUpperCase())
          )
        ).sort((a, b) => a.localeCompare(b));
        setAllSubjects(uniq);
      })
      .catch(() => setAllSubjects([]))
      .finally(() => alive && setLoadingSubjects(false));
    return () => {
      alive = false;
    };
  }, [API_BASE, open]);

  const filteredSubjects = useMemo(() => {
    const q = subjQuery.trim().toUpperCase();
    if (!q) return allSubjects.slice(0, 50);
    const starts = allSubjects.filter((s) => s.startsWith(q));
    const contains = allSubjects.filter((s) => !s.startsWith(q) && s.includes(q));
    return [...starts, ...contains].slice(0, 50);
  }, [allSubjects, subjQuery]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!subjBoxRef.current) return;
      if (!subjBoxRef.current.contains(e.target as Node)) setSubjOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function fetchCoursesForSubject(s: string, q: string, lvl: string) {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    if (lvl) usp.set("level", lvl);
    const url = `${API_BASE}/courses/by-subject/${encodeURIComponent(
      s
    )}${usp.toString() ? `?${usp.toString()}` : ""}`;

    start(async () => {
      const res = await fetch(url, { cache: "no-store" });
      setRows(res.ok ? await res.json() : []);
    });
  }

  useEffect(() => {
    if (!open || !subject) return;
    fetchCoursesForSubject(subject, sq, level);
  }, [subject, sq, level, open]);

  function chooseSubject(s: string) {
    setSubject(s);
    setSubjOpen(false);
  }

  function onSubjectKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!subjOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setSubjOpen(true);
      return;
    }
    if (!subjOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSubjHighlight((h) =>
        filteredSubjects.length ? (h + 1) % filteredSubjects.length : -1
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSubjHighlight((h) =>
        filteredSubjects.length
          ? (h - 1 + filteredSubjects.length) % filteredSubjects.length
          : -1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (subjHighlight >= 0 && subjHighlight < filteredSubjects.length) {
        chooseSubject(filteredSubjects[subjHighlight]);
      } else if (filteredSubjects.length === 1) {
        chooseSubject(filteredSubjects[0]);
      }
    } else if (e.key === "Escape") {
      setSubjOpen(false);
    }
  }

  async function add(c: CourseRow) {
    const credits = typeof c.credits === "number" ? c.credits : 0;
    const newTotal = currentCredits + credits;
    if (!overload && newTotal > CAP) {
      alert(`Adding this would exceed ${CAP} credits for ${term}. Toggle overload to allow it.`);
      return;
    }
    try {
      await addCourse(planId, term, c.courseId, credits);
      router.refresh();
    } catch {
      alert("Failed to add course.");
    }
  }

  return (
    <>
      <button className="btn btn-ghost h-8 px-3" onClick={() => { setOpen(true); setSubjOpen(true); setSubjQuery(""); setSubjHighlight(0); }}>
        + Add course
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-3xl card p-4 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary/70" />
            <div className="flex items-center justify-between">
              <div className="font-semibold">Add course to {term}</div>
              <button className="icon-btn h-8 w-8" onClick={() => setOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="mt-3">
              <label className="text-xs text-muted-foreground">Subject</label>
              <div className="relative mt-1" ref={subjBoxRef}>
                <input
                  value={subject ? subject : subjQuery}
                  onChange={(e) => { setSubject(""); setSubjQuery(e.target.value); setSubjOpen(true); setSubjHighlight(0); }}
                  onFocus={() => setSubjOpen(true)}
                  onKeyDown={onSubjectKeyDown}
                  placeholder="Start typing (e.g., STAT, CS, MATH)"
                  className="input"
                  aria-autocomplete="list"
                  aria-expanded={subjOpen}
                  aria-controls="subject-suggestions"
                  role="combobox"
                />
                {subjOpen && (
                  <div id="subject-suggestions" className="menu max-h-64 overflow-auto mt-1 w-full custom-scroll" role="listbox">
                    {loadingSubjects && <div className="px-3 py-2 text-sm text-muted-foreground">Loading…</div>}
                    {!loadingSubjects && filteredSubjects.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {subjQuery ? "No subjects matched." : "Start typing a subject…"}
                      </div>
                    )}
                    {!loadingSubjects &&
                      filteredSubjects.map((s, i) => (
                        <button
                          type="button"
                          key={s}
                          role="option"
                          aria-selected={subjHighlight === i}
                          className={`menu-item ${subjHighlight === i ? "bg-accent" : ""}`}
                          onMouseEnter={() => setSubjHighlight(i)}
                          onClick={() => chooseSubject(s)}
                        >
                          <span>{s}</span>
                          <span className="text-xs opacity-60">↵</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {subject && (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <input
                    value={sq}
                    onChange={(e) => setSq(e.target.value)}
                    placeholder={`Search within ${subject} (e.g., "400", "data", "intro")`}
                    className="input w-[28rem] max-w-full"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fetchCoursesForSubject(subject, sq, level); } }}
                  />
                  <select value={level} onChange={(e) => setLevel(e.target.value)} className="input w-[140px]">
                    <option value="">Any level</option>
                    <option value="100">100-level</option>
                    <option value="200">200-level</option>
                    <option value="300">300-level</option>
                    <option value="400">400-level</option>
                  </select>
                  <button className="btn btn-ghost h-9" onClick={() => fetchCoursesForSubject(subject, sq, level)} disabled={pending}>
                    {pending ? "Loading…" : "Apply"}
                  </button>
                  <button className="btn btn-ghost h-9" onClick={() => { setSq(""); setLevel(""); fetchCoursesForSubject(subject, "", ""); }}>
                    Reset
                  </button>
                </div>

                <ul className="mt-3 max-h-[60vh] overflow-auto space-y-2 custom-scroll">
                  {rows.map((r) => (
                    <li key={r.courseId} className="card p-3 hover:shadow-[var(--shadow-soft)] transition">
                      <div className="font-medium">
                        {r.subject} {r.number} — {r.title}
                      </div>
                      <div className="text-xs mt-1 flex flex-wrap items-center gap-2">
                        {typeof r.credits === "number" && (<span className="pill pill-blue">Credits: {r.credits}</span>)}
                        {typeof r.avgGpa === "number" && (<span className="pill pill-green">Avg GPA: {r.avgGpa.toFixed(2)}</span>)}
                        {Array.isArray(r.genEds) && r.genEds.length > 0 && (
                          <>
                            {r.genEds.slice(0, 4).map((g, i) => (<span key={g} className={`pill ${["pill-orange","pill-pink","pill-mint","pill-blue"][i%4]}`}>{g}</span>))}
                            {r.genEds.length > 4 && (<span className="pill">+{r.genEds.length - 4} more</span>)}
                          </>
                        )}
                      </div>
                      <div className="mt-2">
                        <button className="btn btn-primary h-8 px-3 text-sm" onClick={() => add(r)}>
                          Add
                        </button>
                      </div>
                    </li>
                  ))}
                  {!rows.length && (<div className="text-sm opacity-70">No courses found in {subject}.</div>)}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
