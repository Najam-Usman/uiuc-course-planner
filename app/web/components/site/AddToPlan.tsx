"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { listPlans, getPlanById, addCourse } from "@/lib/plan";
import { api } from "@/lib/api";
import type { Plan } from "@/types";

export default function AddToPlan({
  courseId,
  courseCredits,
  onAdded,
  className = "",
}: {
  courseId: string;
  courseCredits?: number;
  onAdded?: () => void;
  className?: string;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState<string>("");
  const [terms, setTerms] = useState<string[]>([]);
  const [term, setTerm] = useState<string>("");
  const [message, setMessage] = useState<string>(""); 
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      try {
        const ps = await listPlans();
        setPlans(ps);
        if (ps.length && !planId) setPlanId(ps[0]._id);
      } catch (e) {
        setMessage("Failed to load plans.");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ courseId: string; terms: string[] }>(
          `/sections/${encodeURIComponent(courseId)}/terms`
        );
        const ts = Array.isArray(data?.terms) ? data.terms : [];
        setTerms(ts);
        if (ts.length && !term) setTerm(ts[0]);
      } catch {
        const fallback = ["2025-fa", "2026-sp", "2026-fa"];
        setTerms(fallback);
        if (!term) setTerm(fallback[0]);
      }
    })();
  }, [courseId]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p._id === planId) ?? null,
    [plans, planId]
  );

  async function handleAdd() {
    setMessage("");
    if (!planId) {
      setMessage("Select a plan first.");
      return;
    }
    if (!term) {
      setMessage("Select a term.");
      return;
    }

    startTransition(async () => {
      try {
        const freshPlan = await getPlanById(planId);
        if (!freshPlan) {
          setMessage("Plan not found on server.");
          return;
        }
        const sem = freshPlan.semesters.find((s) => s.term === term);
        const current = (sem?.courses ?? []).reduce(
          (acc, c) => acc + (c.credits ?? 0),
          0
        );
        const addCr = courseCredits ?? 0;
        const newTotal = current + addCr;
        const cap = 18;

        if (!freshPlan.overload && newTotal > cap) {
          setMessage(
            `Adding this would exceed ${cap} credits for ${term}. Enable overload on the plan to exceed the cap.`
          );
          return;
        }

        await addCourse(planId, term, courseId, courseCredits);
        setMessage(`Added ${courseId} to ${term}.`);
        onAdded?.();
      } catch (e: any) {
        setMessage(
          typeof e?.message === "string" ? e.message : "Failed to add course."
        );
      }
    });
  }

  return (
    <div className={`rounded-lg border p-3 space-y-2 bg-white ${className}`}>
      <div className="text-sm font-medium">Add to Plan</div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="w-[220px] rounded-md border px-3 py-2 text-sm"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
        >
          {plans.length === 0 && <option value="">No plans found</option>}
          {plans.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title || "Untitled Plan"}
            </option>
          ))}
        </select>

        <select
          className="w-[160px] rounded-md border px-3 py-2 text-sm"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        >
          {terms.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          {terms.length === 0 && <option value="">No terms</option>}
        </select>

        {typeof courseCredits === "number" && (
          <span className="text-xs opacity-70">{courseCredits} cr</span>
        )}

        <button
          className="rounded-md border px-3 py-2 text-sm bg-white"
          onClick={handleAdd}
          disabled={isPending || !planId || !term}
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </div>

      {selectedPlan && (
        <div className="text-xs text-gray-600">
          Cap: 18 cr {selectedPlan.overload ? "(overload enabled)" : ""}
        </div>
      )}

      {message && (
        <div className="text-xs rounded border px-2 py-1 bg-gray-50">{message}</div>
      )}
    </div>
  );
}
