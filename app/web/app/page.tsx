import Link from "next/link";

export default function Landing() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        <div className="absolute inset-0 -z-10 opacity-70"
             style={{
               background:
                 "radial-gradient(800px 400px at -10% -20%, rgba(255,122,51,.22), transparent), radial-gradient(900px 450px at 120% 10%, rgba(54,83,166,.25), transparent)",
             }}
        />
        <div className="px-6 py-12 md:px-10 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Plan UIUC semesters <span className="text-primary">without stress.</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Search courses by subject, build semester plans, track credits, and see Gen Eds &amp; GPA intel — all in one place.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link href="/onboarding" className="btn btn-primary px-4 py-3 text-base">Get Started</Link>
              <Link href="/search" className="btn btn-ghost px-4 py-3 text-base">Try a Search</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature
          title="Subject-first search"
          desc="Pick a subject (CS, MATH, STAT…) then filter by level and keyword. Cards show credits, Avg GPA, and Gen Ed tags."
          emoji="🔎"
        />
        <Feature
          title="Drag-free planning"
          desc="Add semesters like “Fall 2026” and drop in courses. Credit cap warnings and Overload toggle are built-in."
          emoji="🗂️"
        />
        <Feature
          title="Midnight & Sunset"
          desc="A moody dark theme and a bright warm theme — switch anytime. We remember your choice."
          emoji="🎨"
        />
      </section>

      <section className="surface p-8 text-center">
        <h2 className="text-2xl font-bold">Ready to build your first plan?</h2>
        <p className="mt-2 text-muted-foreground">
          It takes under a minute to set up. You can rename, duplicate, or delete plans anytime.
        </p>
        <div className="mt-5">
          <Link href="/onboarding" className="btn btn-primary px-5 py-3 text-base">Start Onboarding</Link>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, desc, emoji }: { title: string; desc: string; emoji: string }) {
  return (
    <div className="card p-5 surface">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-2 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
