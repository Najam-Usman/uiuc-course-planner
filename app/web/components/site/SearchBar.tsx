"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "CS 225");

  useEffect(() => {
    setQ(sp.get("q") ?? "CS 225");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams({ q }).toString();
    router.push(`/search?${qs}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search courses (e.g., CS 225, STAT 400, 'data structures')"
        className="w-[32rem] max-w-full"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}
