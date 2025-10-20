import { Router } from "express";
import { getMajors, getColleges, refreshCatalog } from "../services/catalogCache.js";

const router = Router();

router.get("/colleges", async (_req, res) => {
  try {
    res.json(await getColleges());
  } catch {
    res.status(500).json({ error: "failed to load colleges" });
  }
});

router.get("/majors", async (req, res) => {
  try {
    const majors = await getMajors();
    const q = String(req.query.q || "").trim().toLowerCase();
    const collegeQ = String(req.query.college || "").trim().toLowerCase();

    let rows = majors;
    if (q) rows = rows.filter((m) => m.name.toLowerCase().includes(q));
    if (collegeQ) rows = rows.filter((m) => String(m.collegeName || "").toLowerCase().includes(collegeQ));
    res.json(rows);
  } catch {
    res.status(500).json({ error: "failed to load majors" });
  }
});

router.post("/refresh", async (_req, res) => {
  try {
    res.json(await refreshCatalog());
  } catch {
    res.status(500).json({ error: "refresh failed" });
  }
});

export default router;
