"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { renamePlan } from "@/lib/plan";
import { Pencil, Check, X } from "lucide-react";

export default function RenamePlanInline({
  id,
  initial,
  linkHref,
  className = "",
  onSaved,
}: {
  id: string;
  initial: string;
  linkHref?: string;
  className?: string;
  onSaved?: (nextTitle: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initial);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function save() {
    const next = title.trim();
    if (!next || next === initial) { setEditing(false); setTitle(initial); return; }
    setBusy(true);
    try {
      await renamePlan(id, next);
      onSaved?.(next);
      setEditing(false);
      router.refresh();
    } catch { alert("Failed to rename plan."); }
    finally { setBusy(false); }
  }
  function cancel() { setEditing(false); setTitle(initial); }

  if (!editing) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {linkHref ? <a href={linkHref} className="font-semibold hover:underline">{initial}</a>
                  : <span className="font-semibold">{initial}</span>}
        <button
          type="button"
          aria-label="Rename plan"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-accent"
          onClick={() => setEditing(true)}
        >
          <Pencil size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <input
        ref={inputRef}
        disabled={busy}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
        className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:shadow-[var(--shadow-glow)]"
      />
      <button
        type="button"
        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg border text-green-600 border-green-200 hover:bg-green-50"
        onClick={save}
        disabled={busy}
        aria-label="Save name"
      >
        <Check size={16} />
      </button>
      <button
        type="button"
        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg border text-red-600 border-red-200 hover:bg-red-50"
        onClick={cancel}
        disabled={busy}
        aria-label="Cancel rename"
      >
        <X size={16} />
      </button>
    </div>
  );
}
