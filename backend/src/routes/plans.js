import { Router } from "express";
import Plan from "../models/Plans.js";

const router = Router();

router.get("/", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });
  const plans = await Plan.find({ userId }).lean();
  if (!plans.length) return res.status(404).json([]);
  res.json(plans);
});

router.get("/:id", async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id).lean();
    if (!plan) return res.status(404).json({ error: "not found" });
    res.json(plan);
  } catch {
    return res.status(404).json({ error: "not found" });
  }
});

router.post("/", async (req, res) => {
  const { userId, title = "My Plan" } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });
  const plan = await Plan.create({ userId, title, semesters: [], overload: false });
  res.json(plan);
});


router.patch("/:id", async (req, res) => {
  const { op } = req.body;
  const plan = await Plan.findById(req.params.id);
  if (!plan) return res.status(404).json({ error: "not found" });

  if (op === "rename") {
    plan.title = req.body.title ?? plan.title;
  } else if (op === "overload") {
    plan.overload = !!req.body.overload;
  } else if (op === "addTerm") {
    const term = req.body.term;
    if (!term) return res.status(400).json({ error: "term required" });
    if (!plan.semesters.find((s) => s.term === term)) {
      plan.semesters.push({ term, courses: [] });
    }
  } else if (op === "renameTerm") {
    const { oldTerm, newTerm } = req.body;
    if (!oldTerm || !newTerm) return res.status(400).json({ error: "oldTerm and newTerm required" });
    const s = plan.semesters.find((x) => x.term === oldTerm);
    if (!s) return res.status(404).json({ error: "semester not found" });
    if (plan.semesters.some((x) => x.term === newTerm)) {
      return res.status(409).json({ error: "target term already exists" });
    }
    s.term = newTerm;
  } else {
    return res.status(400).json({ error: "Unknown op" });
  }

  await plan.save();
  res.json(plan);
});

router.patch("/:id/add", async (req, res) => {
  const { term, courseId, sectionId = null, credits = 0 } = req.body;
  if (!term || !courseId) return res.status(400).json({ error: "term and courseId required" });

  const plan = await Plan.findById(req.params.id);
  if (!plan) return res.status(404).json({ error: "not found" });

  let sem = plan.semesters.find((s) => s.term === term);
  if (!sem) { sem = { term, courses: [] }; plan.semesters.push(sem); }
  if (!sem.courses.find((c) => c.courseId === courseId)) {
    sem.courses.push({ courseId, sectionId, credits });
  }
  await plan.save();
  res.json(plan);
});

router.patch("/:id/remove", async (req, res) => {
  const { term, courseId } = req.body;
  if (!term || !courseId) return res.status(400).json({ error: "term and courseId required" });

  const plan = await Plan.findById(req.params.id);
  if (!plan) return res.status(404).json({ error: "not found" });

  const sem = plan.semesters.find((s) => s.term === term);
  if (sem) {
    sem.courses = sem.courses.filter((c) => c.courseId !== courseId);
    await plan.save();
  }
  res.json(plan);
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await Plan.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "not found" });
    res.json({ ok: true, id: req.params.id });
  } catch {
    return res.status(404).json({ error: "not found" });
  }
});

export default router;
