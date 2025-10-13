import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlanById } from "@/lib/plan";

import RenamePlanInline from "@/components/site/RenamePlanInline.client";
import DeletePlanButton from "@/components/site/DeletePlanButton.client";
import RenameTermInline from "@/components/site/RenameTermInline.client";
import CoursePicker from "./picker.client";
import AddTermBar from "./AddTermBar.client";
import OverloadToggle from "./OverloadToggle.client";

export default async function PlanPage({
  params,
}: {
  params: { planId: string };
}) {
  const plan = await getPlanById(params.planId);
  if (!plan) return notFound();

  const creditsOf = (term: string) =>
    (plan.semesters.find((s) => s.term === term)?.courses || []).reduce(
      (sum, c) => sum + (typeof c.credits === "number" ? c.credits : 0),
      0
    );

  const CAP = 18;

  return (
    <div className="space-y-6">
      {/* Compact toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/plans" className="btn btn-ghost h-8 px-3">← Plans</Link>
          <RenamePlanInline id={plan._id} initial={plan.title} />
        </div>
        <div className="flex items-center gap-2">
          <OverloadToggle id={plan._id} value={!!plan.overload} />
          <DeletePlanButton id={plan._id} redirectTo="/plans" />
        </div>
      </div>

      {/* Add semester */}
      <AddTermBar planId={plan._id} />

      {/* Semesters */}
      <div className="grid gap-4">
        {plan.semesters.map((s) => {
          const used = creditsOf(s.term);
          return (
            <section key={s.term} className="card p-4 surface">
              <div className="flex items-center justify-between">
                <RenameTermInline planId={plan._id} term={s.term} />
                <div className="text-sm opacity-80">{used} / {CAP} cr</div>
              </div>

              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <CoursePicker
                    planId={plan._id}
                    term={s.term}
                    currentCredits={used}
                    overload={!!plan.overload}
                  />
                </div>

                {s.courses?.length ? (
                  <ul className="mt-3 space-y-2">
                    {s.courses.map((c) => (
                      <li key={`${s.term}-${c.courseId}`} className="card p-3 surface">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{c.courseId}</div>
                          <div className="text-xs pill pill-blue">
                            {typeof c.credits === "number" ? c.credits : 0} cr
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 text-sm text-muted-foreground">
                    No courses yet. Use <span className="pill pill-blue">+ Add course</span> to start building {s.term}.
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {!plan.semesters?.length && (
          <div className="card p-4 surface">
            <div className="text-sm text-muted-foreground">
              Add your first semester above. Try formats like{" "}
              <span className="pill pill-mint">Fall 2026</span> or{" "}
              <span className="pill pill-mint">2026-sp</span>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
