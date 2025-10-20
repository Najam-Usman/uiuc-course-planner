"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const SUBJECTS = ["", "CS", "STAT", "MATH", "ECE", "IS", "PHYS"]; 
const LEVELS = ["", "100", "200", "300", "400"];

export default function SearchFilters({ initial }: { initial: { q?: string; subject?: string; level?: string } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(initial.q ?? "");
  const [subject, setSubject] = useState(initial.subject ?? "");
  const [level, setLevel] = useState(initial.level ?? "");

  useEffect(() => {
    setQ(sp.get("q") ?? "");
    setSubject(sp.get("subject") ?? "");
    setLevel(sp.get("level") ?? "");
  }, [sp]);

  function apply() {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (subject) qs.set("subject", subject);
    if (level) qs.set("level", level);
    router.push(`/search?${qs.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search (e.g., CS 225, 'data')" className="w-[28rem] max-w-full" />
      <Select value={subject} onValueChange={setSubject}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Subject" /></SelectTrigger>
        <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s || "Any subject"}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={level} onValueChange={setLevel}>
        <SelectTrigger className="w-[120px]"><SelectValue placeholder="Level" /></SelectTrigger>
        <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l || "Any level"}</SelectItem>)}</SelectContent>
      </Select>
      <Button onClick={apply}>Apply</Button>
    </div>
  );
}
