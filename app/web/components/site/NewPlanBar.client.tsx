"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPlan } from "@/lib/plan";
import { Plus } from "lucide-react";

export default function NewPlanBar() {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onCreate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const plan = await createPlan(title.trim());
      router.push(`/plan/${plan._id}`);
      router.refresh();
    } catch {
      alert("Failed to create plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onCreate} className="flex w-full max-w-xl items-center gap-2">
      <input
        className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:shadow-[var(--shadow-glow)]"
        placeholder='Plan name (e.g., "3 Year Plan")'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm bg-primary text-primary-foreground border-transparent disabled:opacity-60"
      >
        <Plus size={16} /> Create
      </button>
    </form>
  );
}
