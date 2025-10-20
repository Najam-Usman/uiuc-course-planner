"use client";

import { useEffect, useState } from "react";
import { addSemester, removeCourse, setOverload } from "@/lib/plan";
import type { Plan } from "@/types";
import CoursePicker from "./picker.client";
import PrereqBadge from "@/components/PrereqBadge";
import { buildSatisfiedSets } from "@/lib/audit";
import RenameTermInline from "@/components/site/RenameTermInline.client";

type PlanCourse = { courseId: string; sectionId?: string; credits?: number };

export default function PlanClient({
  initialPlan,
  planId,
}: {
  initialPlan: Plan | null;
  planId: string;
}) {
  const [plan, setPlan] = useState<Plan | null>(initialPlan);
  const [addingTerm, setAddingTerm] = useState("");

  useEffect(() => {
    setPlan(initialPlan);
  }, [initialPlan]);

  if (!plan) return <div className="text-sm">Plan not found.</div>;

  const cap = 18;

  function sumCredits(courses: PlanCourse[]) {
    return courses.reduce((a, c) => a + (c.credits ?? 0), 0);
  }

  async function onAddCourse(term: string, course: PlanCourse) {
    setPlan((prev) => {
      if (!prev) return prev;
      const next: Plan = {
        ...prev,
        semesters: prev.semesters.map((s) =>
          s.term === term ? { ...s, courses: [...s.courses] } : { ...s, courses: [...s.courses] }
        ),
      };
      const idx = next.semesters.findIndex((s) => s.term === term);
      if (idx === -1) {
        next.semesters = [...next.semesters, { term, courses: [course] }];
      } else {
        const target = next.semesters[idx];
        if (!target.courses.find((c) => c.courseId === course.courseId)) {
          target.courses.push(course);
        }
      }
      return next;
    });
  }

  async function onRemoveCourse(term: string, courseId: string) {
    setPlan((prev) => {
      if (!prev) return prev;
      const next: Plan = {
        ...prev,
        semesters: prev.semesters.map((s) =>
          s.term === term ? { ...s, courses: s.courses.filter((c) => c.courseId !== courseId) } : s
        ),
      };
      return next;
    });

    try {
      await removeCourse(planId, term, courseId);
    } catch {
      alert("Failed to remove course. Please refresh and try again.");
    }
  }

  async function onToggleOverload(val: boolean) {
    setPlan((prev) => (prev ? { ...prev, overload: val } as Plan : prev));
    try {
      await setOverload(planId, val);
    } catch {
      setPlan((prev) => (prev ? { ...prev, overload: !val } as Plan : prev));
      alert("Failed to update overload setting.");
    }
  }

  async function onAddSemester() {
    const term = addingTerm.trim();
    if (!term) return;

    setPlan((prev) => {
      if (!prev) return prev;
      if (prev.semesters.find((s) => s.term === term)) return prev;
      const next: Plan = { ...prev, semesters: [...prev.semesters, { term, courses: [] }] };
      return next;
    });
    setAddingTerm("");

    try {
      await addSemester(planId, term);
    } catch {
      alert("Failed to add semester on server. Reload may be required.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="text-2xl font-bold">{plan.title}</div>
        <label className="ml-auto inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!plan.overload}
            onChange={(e) => onToggleOverload(e.target.checked)}
          />
          Allow overload &gt; {cap}
        </label>
      </div>

      

      <div className="flex items-center gap-2">
        <input
          placeholder="e.g., 2026-sp"
          value={addingTerm}
          onChange={(e) => setAddingTerm(e.target.value)}
          className="w-48 rounded-md border px-3 py-2 text-sm"
        />
        <button className="rounded-md border px-3 py-2 text-sm bg-white" onClick={onAddSemester}>
          Add semester
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plan.semesters.map((s) => {
          const credits = sumCredits(s.courses);
          const over = credits > cap && !plan.overload;

          return (
            <div key={s.term} className="rounded-xl border p-3 bg-white space-y-3 relative">
              <div className="flex items-center justify-between">
                
                <div className="flex items-center justify-between">
                  <RenameTermInline
                    planId={plan._id}
                    term={s.term}
                    onSaved={(next) => {
                      setPlan((p) => {
                        if (!p) return p;
                        const copy = structuredClone(p);
                        const sem = copy.semesters.find((x) => x.term === s.term);
                        if (sem) sem.term = next;
                        return copy;
                      });
                    }}
                  />
                </div>

                <div className={`text-sm ${over ? "text-red-600" : "text-gray-600"}`}>
                  {credits} / {cap} cr {over && "(cap reached)"}
                </div>
              </div>

 
              <CoursePicker
                planId={planId}
                term={s.term}
                currentCredits={credits}
                overload={!!plan.overload}
                
              />

              <ul className="space-y-2">
                {s.courses.map((c, i) => (
                  <li key={i} className="flex items-center justify-between rounded border p-2">
                    <div>
                      {c.courseId}
                      {c.credits ? ` • ${c.credits} cr` : ""}
                    </div>
                    <button
                      className="rounded-md border px-3 py-1 text-sm bg-white"
                      onClick={() => onRemoveCourse(s.term, c.courseId)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        Use “+ Add course” on a semester to search and add. Changes appear instantly; network failures will show an alert.
      </p>
    </div>
  );
}
