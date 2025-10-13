import { parseAuditPdf } from "../services/audits.service.js";
import { summarizeCourses } from "../services/courses.service.js";

export async function parseAuditController(req, res) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Missing file (expected field 'file')." });

    const parsed = await parseAuditPdf(file.path);
    const stats = summarizeCourses(parsed?.courses || []);

    const payload = {
      auditId: parsed?.meta?.student_id_hash || undefined,
      meta: {
        program: parsed?.meta?.program,
        program_code: parsed?.meta?.program_code,
        degree: parsed?.meta?.degree,
        catalog_year: parsed?.meta?.catalog_year,
      },
      counters: {
        min_total_hours: parsed?.counters?.min_total_hours,
        college_min_advanced_hours: parsed?.counters?.college_min_advanced_hours,
        uiuc_gpa: parsed?.counters?.uiuc_gpa,
        major_gpa: parsed?.counters?.major_gpa,
        earned_hours: parsed?.counters?.earned_hours,
        in_progress_hours: parsed?.counters?.in_progress_hours,
        total_hours: parsed?.counters?.total_hours,
        advanced_hours_earned: parsed?.counters?.advanced_hours_earned ?? 0.0,
        advanced_hours_in_progress: parsed?.counters?.advanced_hours_in_progress,
        advanced_hours_needed: parsed?.counters?.advanced_hours_needed,
      },
      sample: {
        courses_count: parsed?.courses?.length || 0,
        sections_count: parsed?.sections?.length || 0,
      },
      raw: parsed,
      stats,
    };

    res.status(200).json(payload);
  } catch (err) {
    console.error("parseAuditController error:", err);
    res.status(500).json({ error: err?.message || "Failed to parse audit." });
  }
}
