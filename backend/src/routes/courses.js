// backend/src/routes/courses.js
import { Router } from "express";
import Course from "../models/Course.js";
import GpaRecord from "../models/GpaRecord.js";

const router = Router();

/**
 * GET /courses/subjects
 * Optional: ?q=STAT  -> server-side filter; returns prefix-first ordering when q provided
 */
router.get("/subjects", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    let subjects = await Course.distinct("subject");
    subjects = subjects
      .filter(Boolean)
      .map((s) => String(s).trim().toUpperCase());

    if (!q) {
      subjects.sort((a, b) => a.localeCompare(b));
      return res.json(subjects);
    }

    const Q = q.toUpperCase();
    const starts = subjects.filter((s) => s.startsWith(Q)).sort((a, b) => a.localeCompare(b));
    const contains = subjects
      .filter((s) => !s.startsWith(Q) && s.includes(Q))
      .sort((a, b) => a.localeCompare(b));

    res.json([...starts, ...contains]);
  } catch (e) {
    console.error("GET /courses/subjects error", e);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * GET /courses/by-subject/:subject
 * Lists courses in a subject; supports within-subject search (q) and level.
 * Adds avgGpa from gparecords and normalizes Gen Eds to `genEds` array.
 */
router.get("/by-subject/:subject", async (req, res) => {
  try {
    const subject = String(req.params.subject || "").trim().toUpperCase();
    if (!subject) return res.status(400).json({ error: "subject required" });

    const q = String(req.query.q || "").trim();
    const level = String(req.query.level || "").trim();
    const limit = Math.min(parseInt(String(req.query.limit || "200"), 10) || 200, 500);

    const match = { subject };
    const or = [];

    if (/^[1-9]00$/.test(level)) {
      or.push({ number: new RegExp("^" + level[0], "i") });
    }

    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      or.push({ number: new RegExp("^" + safe, "i") });
      const rx = new RegExp(safe, "i");
      or.push({ title: rx }, { description: rx }, { courseId: new RegExp("^" + safe, "i") });
    }

    const finalMatch = or.length ? { $and: [match, { $or: or }] } : match;

    const pipeline = [
      { $match: finalMatch },
      {
        $lookup: {
          from: "gparecords",
          localField: "courseId",
          foreignField: "courseId",
          as: "gpaDocs",
        },
      },
      {
        $addFields: {
          avgGpa: {
            $cond: [{ $gt: [{ $size: "$gpaDocs" }, 0] }, { $avg: "$gpaDocs.avgGpa" }, null],
          },
          // normalize possible places Gen Eds might live into a single array field `genEds`
          genEds: {
            $ifNull: [
              "$genEds",
              {
                $ifNull: [
                  "$genEdCategories",
                  { $ifNull: ["$attributes.genEd", []] }
                ],
              },
            ],
          },
        },
      },
      { $project: { gpaDocs: 0 } },
      { $sort: { number: 1, title: 1 } },
      { $limit: limit },
    ];

    const items = await Course.aggregate(pipeline);
    res.json(items);
  } catch (e) {
    console.error("GET /courses/by-subject/:subject error", e);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * Simple prefix search (compat) — also emits avgGpa + genEds
 * GET /courses?q=<query>
 */
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = q
      ? { $or: [{ courseId: new RegExp("^" + safe, "i") }, { title: new RegExp(safe, "i") }] }
      : {};

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "gparecords",
          localField: "courseId",
          foreignField: "courseId",
          as: "gpaDocs",
        },
      },
      {
        $addFields: {
          avgGpa: {
            $cond: [{ $gt: [{ $size: "$gpaDocs" }, 0] }, { $avg: "$gpaDocs.avgGpa" }, null],
          },
          genEds: {
            $ifNull: [
              "$genEds",
              {
                $ifNull: [
                  "$genEdCategories",
                  { $ifNull: ["$attributes.genEd", []] }
                ],
              },
            ],
          },
        },
      },
      { $project: { gpaDocs: 0 } },
      { $limit: 25 },
    ];

    const courses = await Course.aggregate(pipeline);
    res.json(courses);
  } catch (e) {
    console.error("GET /courses error", e);
    res.status(500).json({ error: "internal" });
  }
});

/**
 * KEEP LAST so it doesn't swallow /subjects or /by-subject/*
 * GET /courses/:courseId
 */
router.get("/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findOne({ courseId }).lean();
    if (!course) return res.status(404).json({ error: "Not found" });

    const gpaAgg = await GpaRecord.aggregate([
      { $match: { courseId } },
      { $group: { _id: "$courseId", avg: { $avg: "$avgGpa" }, terms: { $addToSet: "$term" } } },
    ]);

    // normalize genEds in the detail response too
    const genEds =
      course.genEds ??
      course.genEdCategories ??
      (course.attributes?.genEd ?? []);

    res.json({ ...course, genEds, gpaSummary: gpaAgg[0] || null });
  } catch (e) {
    console.error("GET /courses/:courseId error", e);
    res.status(500).json({ error: "internal" });
  }
});

export default router;
