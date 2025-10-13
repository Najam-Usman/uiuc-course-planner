export type Plan = {
  _id: string;
  userId: string;
  title: string;
  overload?: boolean;
  semesters: { term: string; courses: { courseId: string; sectionId?: string; credits?: number }[] }[];
};

export type Course = {
  courseId: string;
  subject?: string;
  number?: string;
  title?: string;
  description?: string;
  credits?: number;
  prereqText?: string;
  gpaSummary?: { avg?: number; terms?: string[] };
};
