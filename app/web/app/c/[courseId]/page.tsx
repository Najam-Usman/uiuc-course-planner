import { api } from "@/lib/api";
import type { Course } from "@/types";
import AddToPlan from "@/components/site/AddToPlan";

async function getCourse(id: string): Promise<Course> {
  try {
    return await api<Course>(`/courses/${encodeURIComponent(id)}`);
  } catch {
    return {
      courseId: id,
      title: "Sample Course",
      description: "This is a mock course to demonstrate the page.",
      credits: 4,
      gpaSummary: { avg: 3.14, terms: ["2024-fa", "2025-sp"] },
      subject: id.split(" ")[0],
      number: id.split(" ")[1],
      prereqText: "CS 173 or MATH 213",
    };
  }
}

export default async function CoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const id = decodeURIComponent(params.courseId);
  const course = await getCourse(id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">
          {course.courseId}: {course.title}
        </h1>

        {course.description && (
          <p className="text-gray-700">{course.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {typeof course.credits === "number" && (
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <span className="opacity-70">Credits</span>
              <strong>{course.credits}</strong>
            </span>
          )}

          {course.gpaSummary?.avg != null && (
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <span className="opacity-70">Avg GPA</span>
              <strong>{course.gpaSummary.avg.toFixed(2)}</strong>
              <span className="text-xs opacity-60">
                ({course.gpaSummary.terms?.length ?? 0} terms)
              </span>
            </span>
          )}
        </div>

        {course.prereqText && (
          <div className="rounded-lg border p-3 text-sm bg-white">
            <div className="font-medium mb-1">Prerequisites</div>
            <div className="opacity-80">{course.prereqText}</div>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <AddToPlan
          courseId={course.courseId}
          courseCredits={course.credits}
          className="bg-white"
        />

        <div className="rounded-lg border p-3 text-sm bg-white">
          <div className="font-medium mb-1">Sections</div>
          <p className="opacity-80">
            Coming soon: pick a term, load sections, and add a specific section
            to your plan.
          </p>
        </div>
      </aside>
    </div>
  );
}
