"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPlan } from "@/lib/plan";

export default function NewPlan() {
  const [title, setTitle] = useState("My Plan!");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-60 rounded-md border px-3 py-2 text-sm"
      />
      <button
        disabled={!title || pending}
        className="rounded-md border px-3 py-2 text-sm bg-white"
        onClick={() =>
          start(async () => {
            const plan = await createPlan(title.trim());
            router.push(`/plan/${plan._id}`);
          })
        }
      >
        {pending ? "Creating..." : "New plan"}
      </button>
    </div>
  );
}
