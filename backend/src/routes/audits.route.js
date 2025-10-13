import { Router } from "express";
import multer from "multer";
import os from "os";
import path from "path";
import fs from "fs/promises";
import { spawn } from "child_process";
import { saveAudit, getLatestAudit } from "../models/Audit.js";

const router = Router();

// ---------- parsing helpers (existing) ----------
function spawnPromise(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore","pipe","pipe"], shell: false, ...options });
    let stdout = "", stderr = "";
    child.stdout?.on?.("data", d => (stdout += d.toString()));
    child.stderr?.on?.("data", d => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", code => (code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr || `Exit ${code}`))));
  });
}

async function resolvePython() {
  const candidates = [
    process.env.PYTHON,
    "/opt/venv/bin/python",
    "/usr/bin/python3",
    "/usr/local/bin/python3",
    "python3",
    "python",
  ].filter(Boolean);
  for (const py of candidates) {
    try { await spawnPromise(py, ["-V"]); return py; } catch {}
  }
  throw new Error("No working Python interpreter found.");
}

// ---------- routes ----------
router.get("/ping", (_req, res) => res.json({ ok: true, where: "audits.router" }));

// 1) Parse uploaded PDF -> JSON (kept as you have it, but robust)
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_req, file, cb) => cb(null, `audit_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => cb(null, /pdf$/i.test(file.mimetype)),
});

router.post("/parse", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded (field name must be 'file')." });
    const pdfPath = req.file.path;
    const python = await resolvePython();

    const pyCode = `
from audit_parser.parser import parse
from dataclasses import asdict
import json, sys
pdf = sys.argv[1]
pa = parse(pdf)
print(json.dumps(asdict(pa), ensure_ascii=False))
    `;

    const env = { ...process.env, PYTHONPATH: "/app/audit-parser" };
    const { stdout } = await spawnPromise(python, ["-c", pyCode, pdfPath], {
      cwd: "/app/audit-parser",
      env,
    });

    const raw = JSON.parse(stdout);
    // Lightweight response (matches your UI)
    const response = {
      meta: {
        program: raw.meta.program,
        program_code: raw.meta.program_code,
        degree: raw.meta.degree,
        catalog_year: raw.meta.catalog_year,
      },
      counters: {
        college_min_advanced_hours: raw.counters?.college_min_advanced_hours ?? 0,
        uiuc_gpa: raw.counters?.uiuc_gpa ?? null,
        major_gpa: raw.counters?.major_gpa ?? null,
        earned_hours: raw.counters?.earned_hours ?? 0,
        advanced_hours_earned: raw.counters?.advanced_hours_earned ?? 0,
        advanced_hours_in_progress: raw.counters?.advanced_hours_in_progress ?? 0,
        advanced_hours_needed: raw.counters?.advanced_hours_needed ?? 0,
      },
      sample: {
        courses_count: raw.courses?.length ?? 0,
        sections_count: raw.sections?.length ?? 0,
      },
      raw,
      stats: {
        courses_completed: raw.courses?.filter(c => c.status === "completed").length ?? 0,
        courses_in_progress: raw.courses?.filter(c => c.status === "in_progress").length ?? 0,
        courses_ignored: raw.courses?.filter(c => c.status === "ignored").length ?? 0,
      },
    };

    res.json(response);
    await fs.unlink(pdfPath).catch(() => {});
  } catch (err) {
    res.status(500).json({ error: err?.message || "Parse failed" });
  }
});


// 2) Persist a parsed audit (now also stores `needs[]`)
router.post("/", async (req, res) => {
  try {
    const { audit, includeRaw, needs } = req.body || {};
    if (!audit?.meta || !audit?.counters) {
      return res.status(400).json({ error: "Missing 'audit' payload with meta/counters." });
    }
    const saved = await saveAudit({
      userId: "demo",
      audit,
      includeRaw: !!includeRaw,
      needs: Array.isArray(needs) ? needs : [],
    });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Save failed" });
  }
});


// 3) Get the latest audit for the current user
router.get("/latest", async (_req, res) => {
  try {
    const doc = await getLatestAudit("demo");
    if (!doc) return res.status(404).json({ error: "No audit found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Fetch failed" });
  }
});



export default router;
