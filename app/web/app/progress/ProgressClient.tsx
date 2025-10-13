"use client";

import UploadAudit from "@/components/UploadAudit";
import type { AuditResponse, AuditDoc } from "@/lib/audit";
import { saveAudit, fetchLatestAudit } from "@/lib/audit";
import React from "react";
import { extractActionableNeeds, ActionableNeeds } from "@/lib/requirements";

function buildTakenSet(raw: any) {
  const set = new Set<string>();
  const rows = Array.isArray(raw?.courses) ? raw.courses : [];
  for (const r of rows) {
    const id = `${String(r.subject).toUpperCase()} ${String(r.number)}`;
    if (r.status === "completed" || r.status === "in_progress") set.add(id);
  }
  return set;
}

export default function ProgressClient({ initial }: { initial: AuditDoc | null }) {
  const [latest, setLatest] = React.useState<AuditDoc | null>(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [needs, setNeeds] = React.useState<ActionableNeeds>({ geneds: [], courses: [] });

  React.useEffect(() => {
    if (latest) return;
    fetchLatestAudit().then((doc) => {
      setLatest(doc);
      setNeeds({ geneds: [], courses: [] }); // recompute on next upload
    }).catch(() => {});
  }, [latest]);

  async function handleSuccess(data: AuditResponse) {
    setError(null);
    setSaving(true);
    try {
      const taken = buildTakenSet(data.raw);
      const actionable = extractActionableNeeds(data.raw, taken);
      setNeeds(actionable);

      await saveAudit(data, [...actionable.geneds, ...actionable.courses] as any);
      const fresh = await fetchLatestAudit();
      setLatest(fresh);
    } catch (e: any) {
      setError(e?.message || "Failed to save audit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <UploadAudit onSuccess={handleSuccess} />
      {saving && <p className="mt-2 text-sm opacity-70">Saving…</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {latest && (
        <div className="rounded-xl border p-4 mt-6">
          <div className="text-sm mb-2">
            <span className="font-semibold">Last import:</span>{" "}
            {latest.meta.program} ({latest.meta.degree}) · {latest.meta.catalog_year}
            {" · "}
            <span className="opacity-70">{new Date(latest.createdAt).toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <KPI label="Earned Hours" value={latest.counters.earned_hours ?? 0} />
            <KPI label="Adv. Hrs (earned)" value={latest.counters.advanced_hours_earned ?? 0} />
            <KPI label="Adv. Hrs (in progress)" value={latest.counters.advanced_hours_in_progress ?? 0} />
            <KPI label="Adv. Hrs (needed)" value={latest.counters.advanced_hours_needed ?? 0} />
            <KPI label="UIUC GPA" value={fmt(latest.counters.uiuc_gpa)} />
            <KPI label="Major GPA" value={fmt(latest.counters.major_gpa)} />
          </div>

          {(needs.geneds.length > 0 || needs.courses.length > 0) && (
            <div className="mt-6 space-y-6">
              {needs.geneds.length > 0 && (
                <Section title="General Education to finish">
                  {needs.geneds.map((n) => (
                    <NeedRow key={n.id} title={n.title} needText={n.needText} link={n.searchPath} />
                  ))}
                </Section>
              )}

              {needs.courses.length > 0 && (
                <Section title="Major courses to pick">
                  {needs.courses.map((n) => (
                    <NeedRow
                      key={n.id}
                      title={n.title}
                      needText={
                        n.options?.length ? `${n.needText} · Options: ${n.options.join(", ")}` : n.needText
                      }
                      link={n.searchPath}
                    />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function NeedRow({ title, needText, link }: { title: string; needText: string; link?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs opacity-70">{needText}</div>
      {link && (
        <a href={link} className="mt-2 inline-block text-xs underline">
          Find courses
        </a>
      )}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-base font-semibold">{value as any}</div>
    </div>
  );
}
function fmt(x?: number) { return typeof x === "number" ? x.toFixed(2) : "—"; }
