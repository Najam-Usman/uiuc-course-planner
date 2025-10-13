"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { renameSemester } from "@/lib/plan";
import { Pencil, Check, X } from "lucide-react";

export default function RenameTermInline({
  planId,
  term,
  className = "",
  onSaved,
}: {
  planId: string;
  term: string;
  className?: string;
  onSaved?: (nextTerm: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(term);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function save() {
    const next = value.trim();
    if (!next || next === term) { setEditing(false); setValue(term); return; }
    setBusy(true);
    try {
      await renameSemester(planId, term, next);
      onSaved?.(next);
      setEditing(false);
      router.refresh();
    } catch (e) {
      alert("Failed to rename semester.");
    } finally {
      setBusy(false);
    }
  }
  function cancel() { setEditing(false); setValue(term); }

  if (!editing) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="font-semibold">{term}</span>
        <button
          type="button"
          aria-label="Rename semester"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-accent"
          onClick={() => setEditing(true)}
        >
          <Pencil size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        ref={inputRef}
        disabled={busy}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
        className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:shadow-[var(--shadow-glow)]"
      />
      <button
        type="button"
        className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border text-green-600 border-green-200 hover:bg-green-50"
        onClick={save}
        disabled={busy}
        aria-label="Save semester name"
      >
        <Check size={16} />
      </button>
      <button
        type="button"
        className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border text-red-600 border-red-200 hover:bg-red-50"
        onClick={cancel}
        disabled={busy}
        aria-label="Cancel rename"
      >
        <X size={16} />
      </button>
    </div>
  );
}
