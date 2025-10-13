import { Router } from "express";
import Section from "../models/Section.js";

const router = Router();

/**
 * GET /sections/:courseId
 * Optional query:
 *   - term=2025-fa
 *   - instructor=substring (case-insensitive)
 *
 * Example:
 *   /sections/CS%20225?term=2025-fa
 */
router.get("/:courseId", async(req, res) => {
    const {courseId} = req.params;
    const {term, instructor} = req.query;

    const filter = {courseId};
    if (term) {
        filter.term = String(term).trim();
    }
    if (instructor) {
        filter.instructor = new RegExp(String(instructor).trim(), "i");
    }

    const sections = await Section.find(filter).lean();
    res.json(sections);

});


/**
 * GET /sections/:courseId/terms
 * Returns distinct term codes for which this course has sections.
 */
router.get("/:courseId/terms", async (req, res) => {
    const {courseId} = req.params;
    const terms = await Section.distinct("term", {courseId});
    res.json({courseId, terms:terms.sort()});
})



/**
 * GET /sections/:courseId/summary?term=2025-fa
 * Groups sections by section code for a quick overview in the UI.
 */
router.get("/:courseId/summary", async (req, res) => {
  const { courseId } = req.params;
  const term = String(req.query.term || "").trim();

  const match = { courseId };
  if (term) match.term = term;

  const summary = await Section.aggregate([
    { $match: match },
    {
      $group: {
        _id: { section: "$section", term: "$term" },
        crns: { $addToSet: "$crn" },
        instructors: { $addToSet: "$instructor" },
        meetings: { $push: "$meetings" } // array of arrays; flatten client-side if you want
      }
    },
    {
      $project: {
        _id: 0,
        section: "$_id.section",
        term: "$_id.term",
        crns: 1,
        instructors: 1,
        meetings: 1
      }
    },
    { $sort: { term: 1, section: 1 } }
  ]);

  res.json({ courseId, term: term || null, sections: summary });
});

export default router;