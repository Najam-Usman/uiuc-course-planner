import mongoose from "mongoose";

const CourseEntrySchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    sectionId: { type: String, default: null },
    credits: { type: Number, default: 0 },
  },
  { _id: false }
);

const SemesterSchema = new mongoose.Schema(
  {
    term: { type: String, required: true },
    courses: { type: [CourseEntrySchema], default: [] },
  },
  { _id: false }
);

const PlanSchema = new mongoose.Schema(
  {
    // ❗ Allow multiple plans per user — remove unique:true
    userId: { type: String, index: true, required: true },
    title: { type: String, default: "My Plan" },
    overload: { type: Boolean, default: false }, // allow > 18 when true
    semesters: { type: [SemesterSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Plan || mongoose.model("Plan", PlanSchema);
