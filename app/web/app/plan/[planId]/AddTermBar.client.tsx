"use client";

import { useState } from "react";
import { addSemester } from "@/lib/plan";
import { useRouter } from "next/navigation";

export default function AddTermBar({
  planId,
  placeholder = "e.g., 2026-sp",
  disabled = false,
}: {
  planId: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [term, setTerm] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim() || busy || disabled) return;
    setBusy(true);
    try {
      await addSemester(planId, term.trim());
      setTerm("");
      router.refresh();
    } catch {
      alert("Failed to add semester.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-3">
      <input
        className="input w-[18rem] max-w-full"
        placeholder={placeholder}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        disabled={busy || disabled}
      />
      <button
        type="submit"
        disabled={busy || disabled || !term.trim()}
        className="btn btn-primary disabled:opacity-60"
      >
        Add semester
      </button>
    </form>
  );
}
