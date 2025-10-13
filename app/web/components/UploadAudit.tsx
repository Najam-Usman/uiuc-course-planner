"use client";

import React from "react";
import type { AuditResponse } from "../lib/audit";

type Props = {
  onSuccess?: (data: AuditResponse) => void;
  className?: string;
};

export default function UploadAudit({ onSuccess, className }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<AuditResponse | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/audits/parse", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }

      setPreview(data as AuditResponse);
      onSuccess?.(data as AuditResponse);
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
      setPreview(null);
    } finally {
      setBusy(false);
      // Reset input so the same file can be selected again
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <label className="block">
        <span className="text-sm font-medium">Upload Degree Audit (PDF)</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          disabled={busy}
          className="mt-2 block w-full rounded-lg border p-2"
        />
      </label>

      {busy && <p className="mt-2 text-sm opacity-70">Parsing…</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {preview && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium">Preview (debug)</summary>
          <pre className="mt-2 max-h-64 overflow-auto text-xs bg-slate-50 p-2 rounded">
{JSON.stringify(preview, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
