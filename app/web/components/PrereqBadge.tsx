"use client";

import React from "react";
import { SatisfiedSets, courseKey } from "../lib/audit";

type Props = {
  prereqs: Array<{ subject: string; number: string }>;
  sets: SatisfiedSets;
};

export default function PrereqBadge({ prereqs, sets }: Props) {
  if (!Array.isArray(prereqs) || prereqs.length === 0) {
    return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">No prereqs</span>;
  }
  const unmet: string[] = [];
  let hasInProgress = false;

  for (const p of prereqs) {
    const key = courseKey(p.subject, p.number);
    if (!sets.satisfied.has(key)) unmet.push(key);
    if (sets.inProgress.has(key)) hasInProgress = true;
  }

  if (unmet.length === 0)
    return <span className="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-xs text-green-800">Prereqs satisfied</span>;

  if (hasInProgress)
    return <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">Prereqs in progress</span>;

  return (
    <span className="inline-flex items-center rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-800">
      Prereqs unmet
    </span>
  );
}
