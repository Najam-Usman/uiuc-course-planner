"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPlan } from "@/lib/plan";

const THEME_KEY = "uiuc-theme";
const PROFILE_KEY = "uiuc-profile";
const LIGHT = "theme-sunset";
const DARK = "theme-midnight";

type Profile = {
  name: string;
  theme: "light" | "dark";
  college?: string;
  major?: string;
  startTerm?: string;
  prefs?: { overload?: boolean; showGpa?: boolean };
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile>({
    name: "",
    theme: "dark",
    college: undefined,
    major: "",
    startTerm: "",
    prefs: { overload: false, showGpa: true },
  });

  const [pending, start] = useTransition();
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile((p) => ({ ...p, ...(JSON.parse(raw) as Profile) }));
    } catch {}
  }, []);
  useEffect(() => {
    const html = document.documentElement;
    const cls = profile.theme === "dark" ? DARK : LIGHT;
    html.classList.remove(DARK, LIGHT);
    html.classList.add(cls);
    localStorage.setItem(THEME_KEY, cls);
  }, [profile.theme]);

  function next() { setStep((s) => Math.min(3, s + 1)); }
  function back() { setStep((s) => Math.max(1, s - 1)); }

  const [colleges, setColleges] = useState<string[]>([]);
  const [majors, setMajors] = useState<{ name: string; degree?: string; collegeName?: string }[]>([]);
  const [majorQuery, setMajorQuery] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/meta/colleges`).then(r => r.ok ? r.json() : []).then(setColleges).catch(() => setColleges([]));
    fetch(`${API_BASE}/meta/majors`).then(r => r.ok ? r.json() : []).then(setMajors).catch(() => setMajors([]));
  }, [API_BASE]);

  const filteredMajors = useMemo(() => {
    let rows = majors;
    if (profile.college) {
      const q = profile.college.toLowerCase();
      rows = rows.filter(m => String(m.collegeName || "").toLowerCase().includes(q) || !m.collegeName);
    }
    if (majorQuery.trim()) {
      const q = majorQuery.toLowerCase();
      rows = rows.filter(m => m.name.toLowerCase().includes(q));
    }
    const seen = new Set<string>();
    rows = rows.filter(m => {
      const k = m.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return rows.slice(0, 200);
  }, [majors, profile.college, majorQuery]);

  async function finish() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    const title =
      profile.major ? `${profile.major} Plan` :
      profile.startTerm ? `${profile.startTerm} Plan` : "My Plan";
    try {
      const plan = await createPlan(title);
      router.push(`/plan/${plan._id}`);
      router.refresh();
    } catch {
      alert("Could not create a plan. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Progress current={step} />

      <div className="card p-6 surface mt-4 space-y-5">
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold">Welcome 👋</h1>
            <p className="text-muted-foreground">We’ll set up a few basics so you’re ready to plan.</p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Your name</label>
                <input
                  className="input mt-1"
                  placeholder="Zoe Student"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Theme</label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    className={`btn px-3 py-2 ${profile.theme === "light" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setProfile((p) => ({ ...p, theme: "light" }))}
                  >
                    Sunset (Light)
                  </button>
                  <button
                    type="button"
                    className={`btn px-3 py-2 ${profile.theme === "dark" ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setProfile((p) => ({ ...p, theme: "dark" }))}
                  >
                    Midnight (Dark)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div />
              <button className="btn btn-primary px-4" onClick={next} disabled={!profile.name.trim()}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold">Your academics</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">College</label>
                <select
                  className="input mt-1"
                  value={profile.college ?? ""}
                  onChange={(e) => {
                    const c = e.target.value || undefined;
                    setProfile((p) => ({ ...p, college: c, major: "" }));
                    setMajorQuery("");
                  }}
                >
                  <option value="">Select a college…</option>
                  {colleges.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Start term</label>
                <div className="mt-1 flex gap-2">
                  <select
                    className="input"
                    value={profile.startTerm?.split(" ")[0] ?? "Fall"}
                    onChange={(e) => {
                      const season = e.target.value;
                      const year = profile.startTerm?.split(" ")[1] ?? new Date().getFullYear().toString();
                      setProfile((p) => ({ ...p, startTerm: `${season} ${year}` }));
                    }}
                  >
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                  </select>
                  <input
                    className="input"
                    type="number"
                    min={new Date().getFullYear() - 1}
                    max={new Date().getFullYear() + 6}
                    placeholder={`${new Date().getFullYear()}`}
                    value={profile.startTerm?.split(" ")[1] ?? ""}
                    onChange={(e) => {
                      const yr = e.target.value;
                      const season = profile.startTerm?.split(" ")[0] ?? "Fall";
                      setProfile((p) => ({ ...p, startTerm: `${season} ${yr}` }));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-2">
              <label className="text-xs text-muted-foreground">Major</label>
              {!profile.college ? (
                <div className="mt-1 text-sm text-muted-foreground">Select a college first to see its majors.</div>
              ) : (
                <>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      className="input flex-1"
                      placeholder="Search majors (e.g., Computer, Statistics)"
                      value={majorQuery}
                      onChange={(e) => setMajorQuery(e.target.value)}
                    />
                    <button className="btn btn-ghost" onClick={() => setMajorQuery("")}>Clear</button>
                  </div>

                  <div className="menu max-h-64 overflow-auto mt-2 custom-scroll">
                    {filteredMajors.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No majors matched.</div>
                    )}
                    {filteredMajors.map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        className={`menu-item ${profile.major === m.name ? "bg-accent" : ""}`}
                        onClick={() => setProfile((p) => ({ ...p, major: m.name }))}
                      >
                        <span>{m.name}</span>
                        {m.degree && <span className="pill pill-blue">{m.degree}</span>}
                      </button>
                    ))}
                  </div>

                  {profile.major && (
                    <div className="mt-2 text-xs">
                      Selected: <span className="pill pill-blue">{profile.major}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary px-4" onClick={next} disabled={!profile.college || !profile.major}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold">Preferences</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!profile.prefs?.overload}
                  onChange={(e) => setProfile((p) => ({ ...p, prefs: { ...p.prefs, overload: e.target.checked } }))}
                />
                Allow overload semesters by default
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!profile.prefs?.showGpa}
                  onChange={(e) => setProfile((p) => ({ ...p, prefs: { ...p.prefs, showGpa: e.target.checked } }))}
                />
                Show Avg GPA on course cards
              </label>
            </div>

            <div className="flex items-center justify-between">
              <button className="btn btn-ghost" onClick={back}>Back</button>
              <button className="btn btn-primary px-4" onClick={() => start(finish)} disabled={pending}>
                {pending ? "Finishing…" : "Finish & Create Plan"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Progress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`h-2 flex-1 rounded-full ${i <= current ? "bg-primary" : "bg-accent"}`} />
      ))}
    </div>
  );
}
