type Props = { avg?: number; terms?: string[] };

export function GpaPill({ avg, terms }: Props) {
  if (avg == null) return null;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
      <span className="opacity-70">Avg GPA</span>
      <strong>{avg.toFixed(2)}</strong>
      {Array.isArray(terms) && <span className="text-xs opacity-60">({terms.length} terms)</span>}
    </span>
  );
}
