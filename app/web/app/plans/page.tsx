import { listPlans } from "@/lib/plan";
import NewPlanBar from "@/components/site/NewPlanBar.client";
import DeletePlanButton from "@/components/site/DeletePlanButton.client";
import RenamePlanInline from "@/components/site/RenamePlanInline.client";


{/* First-run hint */}
<FirstRunHint />

// …
function FirstRunHint() {
  if (typeof window === "undefined") return null;
  const seen = typeof window !== "undefined" && localStorage.getItem("uiuc-first-plans");
  if (seen) return null;
  // mark seen
  if (typeof window !== "undefined") localStorage.setItem("uiuc-first-plans", "1");
  return (
    <div className="card p-4 surface mb-4">
      <div className="text-sm">
        Tip: Click a plan title to open it. Use the <span className="pill pill-blue">+ Add course</span> button inside a semester to start building.
      </div>
    </div>
  );
}


export default async function PlansPage() {
  const plans = await listPlans();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Your Plans</h1>
        <NewPlanBar />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p._id} className="card p-4 hover:shadow-soft transition">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-10 w-10 rounded-xl bg-[hsl(var(--primary))]/10 flex items-center justify-center font-semibold text-[hsl(var(--primary))]">
                  {p.title.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  {/* Single title with edit icon; title itself links to the plan */}
                  <RenamePlanInline id={p._id} initial={p.title} linkHref={`/plan/${p._id}`} />
                  <div className="text-xs text-muted-foreground mt-1">
                    {p.semesters?.length ?? 0} semester{(p.semesters?.length ?? 0) === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              <DeletePlanButton id={p._id} />
            </div>
          </div>
        ))}

        {!plans.length && (
          <div className="text-sm text-muted-foreground">No plans yet — create your first one above.</div>
        )}
      </div>
    </div>
  );
}
