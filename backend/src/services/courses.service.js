export function summarizeCourses(courses = []) {
  let completed = 0, inProgress = 0, ignored = 0;
  for (const c of courses) {
    if (!c || !c.status) continue;
    if (c.status === "completed") completed++;
    else if (c.status === "in_progress") inProgress++;
    else if (c.status === "ignored") ignored++;
  }
  return { courses_completed: completed, courses_in_progress: inProgress, courses_ignored: ignored };
}
