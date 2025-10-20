"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialQuery?: string;
  placeholder?: string;
  className?: string;
};

export default function SubjectSearch({
  initialQuery = "",
  placeholder = "Search subjects (e.g., STAT, CS, MATH)",
  className = "",
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

  const fetchSubjects = useCallback(
    (q: string) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const url =
        q.trim().length > 0
          ? `${API_BASE}/courses/subjects?q=${encodeURIComponent(q)}`
          : `${API_BASE}/courses/subjects`;

      setLoading(true);
      fetch(url, { signal: controller.signal })
        .then(async (r) => (r.ok ? r.json() : []))
        .then((data: string[]) => {
          setItems(data || []);
          setOpen(true);
          setHighlight(data.length ? 0 : -1);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setItems([]);
            setOpen(true);
            setHighlight(-1);
          }
        })
        .finally(() => setLoading(false));
    },
    [API_BASE]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSubjects(query);
    }, 200);
    return () => clearTimeout(t);
  }, [query, fetchSubjects]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function go(subject: string) {
    setOpen(false);
    router.push(`/search?subject=${encodeURIComponent(subject)}&sq=`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (items.length ? (h + 1) % items.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) =>
        items.length ? (h - 1 + items.length) % items.length : -1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && highlight < items.length) {
        go(items[highlight]);
      } else if (items.length === 1) {
        go(items[0]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`} ref={boxRef}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-[28rem] max-w-full rounded-md border px-3 py-2 text-sm"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="subject-suggestions"
        role="combobox"
      />
      {open && (
        <div
          id="subject-suggestions"
          className="menu max-h-64 overflow-auto mt-1 w-full"
          role="listbox"
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Loading…</div>
          )}
          {!loading && items.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              {query ? "No subjects matched." : "Start typing a subject…"}
            </div>
          )}
          {!loading &&
            items.map((s, i) => (
              <button
                type="button"
                key={s}
                role="option"
                aria-selected={highlight === i}
                className={"menu-item"}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => go(s)}
              >
                <span>{s}</span>
                <span className="text-xs text-gray-400">↵</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
