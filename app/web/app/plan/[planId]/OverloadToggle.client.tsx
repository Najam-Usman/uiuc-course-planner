"use client";

import { useRouter } from "next/navigation";
import { setOverload } from "@/lib/plan";
import { Zap } from "lucide-react";

export default function OverloadToggle({
  id,
  value,
}: {
  id: string;
  value: boolean;
}) {
  const router = useRouter();

  async function flip() {
    try {
      await setOverload(id, !value);
      router.refresh();
    } catch {
      alert("Failed to toggle overload.");
    }
  }

  return (
    <button
      type="button"
      onClick={flip}
      title={value ? "Overload: On" : "Overload: Off"}
      aria-label={value ? "Overload on" : "Overload off"}
      className={`icon-btn h-8 w-8 ${value ? "text-primary border-primary/40 bg-primary/10" : ""}`}
    >
      <Zap size={16} />
    </button>
  );
}
