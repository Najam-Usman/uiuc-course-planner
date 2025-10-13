"use client";

import { useRouter } from "next/navigation";
import { deletePlan } from "@/lib/plan";
import { Trash2 } from "lucide-react";

export default function DeletePlanButton({
  id,
  redirectTo = "/plans",
  confirmText = "Delete this plan? This cannot be undone.",
  className = "",
}: {
  id: string;
  redirectTo?: string;
  confirmText?: string;
  className?: string;
}) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm(confirmText)) return;
    try {
      await deletePlan(id);
      router.push(redirectTo);
      router.refresh();
    } catch {
      alert("Failed to delete plan.");
    }
  }

  return (
    <button
      onClick={onDelete}
      aria-label="Delete plan"
      title="Delete plan"
      className={`icon-btn h-8 w-8 text-red-500 border-red-300/40 hover:bg-red-500/10 ${className}`}
    >
      <Trash2 size={16} />
    </button>
  );
}
