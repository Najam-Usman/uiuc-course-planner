import ProgressClient from "./ProgressClient";
import { headers } from "next/headers";
import type { AuditDoc } from "@/lib/audit";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  let latest: AuditDoc | null = null;
  try {
    const h = headers();
    const host = (await h).get("x-forwarded-host") ?? (await h).get("host");
    const proto = (await h).get("x-forwarded-proto") ?? "http";
    const base = `${proto}://${host}`;
    const r = await fetch(`${base}/api/audits/latest`, { cache: "no-store" });
    if (r.ok) latest = (await r.json()) as AuditDoc;
  } catch {
    // ignore; client will try on mount
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Progress</h1>
      <p className="text-sm opacity-80">
        Import your UIUC degree audit PDF to populate your progress and power the planner.
      </p>
      <ProgressClient initial={latest} />
    </main>
  );
}
