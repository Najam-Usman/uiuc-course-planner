from __future__ import annotations
import pdfplumber
import regex as re
from typing import List, Dict, Optional, Tuple
from .models import ParsedAudit, ParsedCourse, RequirementSection, RequirementItem
from .utils import (
    is_section_header, slugify, sha256, normalize_catalog_year,
    parse_float, trim_flags, normalize_unit, course_level
)

# --------------------
# Patterns
# --------------------

# Accept numeric/odd section tokens and prioritize multi-letter grade tokens
COURSE_RE = re.compile(
    r"""
    ^(?P<term>(?:FA|SP|SU|WI)\d{2})\s+
    (?P<subject>[A-Z]{2,5})\s+
    (?P<number>\d{2,3}[A-Z]?)                # 107, 241, 199A
    (?:\s+(?P<section>[A-Z0-9!]{1,4}))?      # allow 1, BD!, 81, AL2, etc.
    \s+(?P<credits>\d+(?:\.\d+)?)\s+
    (?P<grade>CR|PS|IP|[A-Z][\+\-]?)         # IP before single-letter grades
    \s*(?P<flags>.*)?$
    """,
    re.VERBOSE,
)

NEEDS_EARNED_RE = re.compile(
    r"""(?:
        ^NEEDS:\s*(?P<needs>[\d\.]+)\s*(?P<nunit>COURSES?|HOURS|SUB-?GROUPS?)$
        |
        ^EARNED:\s*(?P<earned>[\d\.]+)\s*(?P<eunit>COURSES?|HOURS|SUB-?GROUPS?)$
    )""",
    re.VERBOSE,
)

SELECT_FROM_RE = re.compile(r"""^SELECT\s+FROM:\s*(?P<list>.+)$""")
COMBO_RE = re.compile(r"""^ONE\s+OF\s+THE\s+FOLLOWING\s+COMBINATIONS:\s*(?P<combo>.+)$""")

META_PROGRAM_RE = re.compile(
    r"""Program\s+Code\s+(?P<code>\d+)\s+(?P<degree>[A-Z]+)\s+Catalog\s+Year\s+(?P<cat>\d{6})"""
)
META_STUDENT_ID_RE = re.compile(r"""^Student\s+ID\s+(?P<id>\d+)""")

# Program inference candidate (Title Case), not all-caps
META_PROGRAM_NAME_RE = re.compile(r"""^(?:[A-Z][a-z]+(?:[ /&\-][A-Z][a-z]+)+)$""")

GPA_LINE_RE = re.compile(
    r"""(?P<hours>\d+\.\d+)\s+GPA\s+HOURS\s+EARNED\s+(?P<points>\d+\.\d+)\s+POINTS\s+(?P<gpa>\d+\.\d+)\s+GPA"""
)

MIN_TOTAL_HOURS_RE = re.compile(r"""^MINIMUM\s+OF\s+(?P<min>\d+)\s+HOURS\s+REQUIRED$""")
COLLEGE_ADV_HOURS_RE = re.compile(
    r"""^(?P<college>[A-Z &]+)\s+ADVANCED\s+HOUR\s+REQUIREMENT\s*\((?P<min>\d+)\s+HOURS"""
)

LEGEND_START_RE = re.compile(r"^\*{5,}\s+LEGEND\s+\*{5,}", re.I)
LEGEND_ITEM_RE = re.compile(r"""^([>A-Z\-]{1,3})\s*=\s*(.+)$""")

URL_RE = re.compile(r"https?://", re.I)
DATE_STAMP_RE = re.compile(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b")
PAGE_STAMP_RE = re.compile(r"\b\d+/\d+\b")

# Header fusion helpers
HEADER_FUSE_RE = re.compile(r"^[A-Z0-9 &'()\-,:]+\.?$")
SHORT_CAPS_RE  = re.compile(r"^[A-Z0-9 &'()\-,:]{3,45}$")

# Banners to demote into context (now catches HOURS TAKEN/ADDED with optional parens)
BANNER_RE = re.compile(
    r"""(?ix)
        ^\(?\s*\d+(\.\d+)?\s+HOURS\s+(TAKEN|ADDED)\s*\)?$
        | ^\d+\s+COURSE(S)?\s+TAKEN$
    """
)

# Detect a line that *starts like* a course but doesn't fully match COURSE_RE
TERM_HEAD_RE = re.compile(r"^(?:FA|SP|SU|WI)\d{2}\s+[A-Z]{2,}\b")

# GPA summary should NOT become a section title
GPA_TITLE_RE = GPA_LINE_RE  # full-match check when deciding section creation

# --------------------
# Helpers
# --------------------

def extract_text_lines(pdf_path: str) -> List[str]:
    lines: List[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text(x_tolerance=2, y_tolerance=2) or ""
            lines.extend([l.rstrip() for l in text.splitlines()])
    # Normalize whitespace
    norm = []
    for l in lines:
        nl = l.replace("\t", " ").strip()
        nl = re.sub(r"\s{2,}", "  ", nl)
        norm.append(nl)
    return norm

def status_from_grade_and_flags(grade: Optional[str], flags: List[str]) -> str:
    if ">W" in flags:
        return "planned"
    if ">I" in flags or (grade and grade.upper() == "IP"):
        return "in_progress"
    if ">C" in flags:
        return "ignored"  # indirect duplication
    passing = {"A","A-","A+","B","B-","B+","C","C-","C+","D","D-","D+","CR","PS","S","P"}
    if grade and grade.upper() in passing:
        return "completed"
    return "completed"

def clean_noise(line: str) -> bool:
    s = line.strip()
    if not s:
        return True
    if URL_RE.search(s) or PAGE_STAMP_RE.search(s):
        return True
    return False

def classify_section(title: str) -> str:
    t = title.upper()
    if "GENERAL EDUCATION" in t or "CULTURAL STUDIES" in t:
        return "gened"
    if "MAJOR GPA" in t:
        return "major_gpa"
    if "GPA" in t and "UIUC" in t:
        return "uiuc_gpa"
    if "MAJOR" in t and "GPA" not in t:
        return "major_core"
    if "RESIDENCY" in t:
        return "residency"
    if "ADVANCED HOUR REQUIREMENT" in t:
        return "advanced_hours"
    if "MINIMUM OF" in t and "HOURS REQUIRED" in t:
        return "total_hours"
    return "other"

def looks_like_term_header_but_not_course(s: str) -> bool:
    return bool(TERM_HEAD_RE.match(s)) and not COURSE_RE.match(s)

def should_fuse_caps(a: str, b: str) -> bool:
    """Fuse if both look like caps headers and (a) ends mid-phrase or (b) b is a short continuation."""
    a_u, b_u = a.strip().upper(), b.strip().upper()
    if not (HEADER_FUSE_RE.match(a_u) and HEADER_FUSE_RE.match(b_u)):
        return False
    if a_u.endswith((" IN YOUR", " REQUIREMENT", " REQUIREMENTS", "COURSES", "HOURS", " MAJOR", " GPA", ":", "(")):
        return True
    return bool(SHORT_CAPS_RE.match(b_u))

def fuse_header_fragments(lines: List[str]) -> List[str]:
    fused = []
    i = 0
    while i < len(lines):
        cur = lines[i].strip()
        if i + 1 < len(lines):
            nxt = lines[i+1].strip()
            if should_fuse_caps(cur, nxt):
                fused.append(f"{cur} {nxt}".strip())
                i += 2
                continue
        fused.append(cur)
        i += 1
    return fused

# --------------------
# Main parse
# --------------------

def parse(pdf_path: str, debug: bool=False, keep_pii: bool=False) -> ParsedAudit:
    lines = extract_text_lines(pdf_path)
    # Fuse split headers before parsing
    lines = fuse_header_fragments(lines)

    pa = ParsedAudit()

    # ---- meta scanning (first ~200 lines) ----
    for i, line in enumerate(lines[:200]):
        s = line.strip()
        if not s:
            continue
        if META_PROGRAM_RE.search(s):
            m = META_PROGRAM_RE.search(s)
            pa.meta["program_code"] = m.group("code")
            pa.meta["degree"] = m.group("degree")
            pa.meta["catalog_year_raw"] = m.group("cat")
            pa.meta["catalog_year"] = normalize_catalog_year(m.group("cat"))
            pa.meta["prepared_on"] = s
            continue
        if keep_pii and (m := META_STUDENT_ID_RE.match(s)):
            pa.meta["student_id_hash"] = sha256(m.group("id"))
            continue
        # Optional: accept a Title-Case program line (avoid obvious UI strings)
        if META_PROGRAM_NAME_RE.match(s) and s not in {
            "Open All Sections Close All Sections",
            "IMPORTANT NOTE TO STUDENTS",
            "SUMMARY OF COURSES USED IN THIS REPORT WITH",
        }:
            pa.meta.setdefault("program", s)

    # ---- main parse ----
    sections: List[RequirementSection] = []
    cur: Optional[RequirementSection] = None
    last_item: Optional[RequirementItem] = None
    in_legend = False

    # expanded noisy headers (fused policy banner included)
    NOISY_HEADERS = {
        "OPEN ALL SECTIONS  CLOSE ALL SECTIONS",
        "FEDERAL LAW PROHIBITS TRANSMITTAL TO A THIRD PARTY",
        "FEDERAL LAW PROHIBITS TRANSMITTAL TO A THIRD PARTY IMPORTANT NOTE TO STUDENTS",
        "SUMMARY OF COURSES USED IN THIS REPORT WITH",
        "IN PROGRESS - 'IP', INCOMPLETE - 'I' OR DEFERRED - 'DF'",
        "GRADES. THESE DO NOT COUNT TOWARD YOUR DEGREE UNTIL",
    }

    for raw in lines:
        s = raw.strip()
        if not s or clean_noise(s):
            continue

        # Legend
        if LEGEND_START_RE.match(s):
            in_legend = True
            continue
        if in_legend:
            if s.startswith("If you have any questions") or "END OF ANALYSIS" in s:
                in_legend = False
                continue
            if m := LEGEND_ITEM_RE.match(s):
                pa.legend[m.group(1).strip()] = m.group(2).strip()
            continue

        # Counters & GPA
        if m := GPA_LINE_RE.search(s):
            hours = parse_float(m.group("hours"))
            points = parse_float(m.group("points"))
            gpa = parse_float(m.group("gpa"))
            pa.counters.setdefault("_gpa_lines", []).append(
                {"hours":hours,"points":points,"gpa":gpa,"raw":s}
            )

        if m := MIN_TOTAL_HOURS_RE.match(s):
            pa.counters["min_total_hours"] = int(m.group("min"))
        if m := COLLEGE_ADV_HOURS_RE.match(s):
            try:
                pa.counters["college_min_advanced_hours"] = int(m.group("min"))
            except:
                pass

        # Courses (can appear anywhere)
        if COURSE_RE.match(s):
            crs = parse_courses_block_line(s)
            if crs:
                pa.courses.append(crs)
                if cur:
                    cur.raw_lines.append(s)
            continue

        # Needs/Earned
        if m := NEEDS_EARNED_RE.match(s):
            needs, nunit, earned, eunit = m.group("needs"), m.group("nunit"), m.group("earned"), m.group("eunit")
            if not last_item:
                last_item = RequirementItem(
                    id="auto_item_" + str(len(sections)) + "_" + str(len(cur.items) if cur else 0),
                    header_raw="(auto)",
                    kind="other",
                )
                if cur:
                    cur.items.append(last_item)
            if needs:
                last_item.needed = parse_float(needs)
                last_item.unit = normalize_unit(nunit)
            if earned:
                last_item.earned = parse_float(earned)
                last_item.unit = normalize_unit(eunit)
            if cur:
                cur.raw_lines.append(s)
            continue

        if m := SELECT_FROM_RE.match(s):
            lst = m.group("list")
            opts = []
            for tok in re.split(r"[,\u2013\u2014;]", lst):
                t = tok.strip()
                if t:
                    opts.append(t)
            if last_item:
                last_item.select_from.extend(opts)
            if cur:
                cur.raw_lines.append(s)
            continue

        if m := COMBO_RE.match(s):
            parts = [p.strip() for p in re.split(r"\bAND\b", m.group("combo"), flags=re.IGNORECASE) if p.strip()]
            if last_item:
                last_item.kind = "combo"
                last_item.combos.append(parts)
            if cur:
                cur.raw_lines.append(s)
            continue

        # New Section?
        if is_section_header(s):
            U = s.upper()

            # Drop clearly non-requirement headers (policy banner etc.)
            if U in NOISY_HEADERS or "FEDERAL LAW PROHIBITS TRANSMITTAL" in U:
                continue

            # Don't promote helper banners like "(53.0 HOURS TAKEN)", "8.0 HOURS ADDED", "1 COURSE TAKEN"
            if BANNER_RE.match(s):
                if cur:
                    cur.raw_lines.append(s)  # keep as context under current section
                continue

            # GPA summary lines should not become section titles
            if GPA_TITLE_RE.fullmatch(s):
                if cur:
                    cur.raw_lines.append(s)
                continue

            # If it *starts* like a term header but isn't a valid course row, keep as context
            if looks_like_term_header_but_not_course(s):
                if cur:
                    cur.raw_lines.append(s)
                continue

            # Safety: if it's actually a course row, don't create a section
            if COURSE_RE.match(s):
                if cur:
                    cur.raw_lines.append(s)
                continue

            cur = RequirementSection(
                section_id=slugify(s),
                section_title=s,
                classification=classify_section(s),
            )
            sections.append(cur)
            last_item = None
            continue

        # Sub-items (heuristic)
        if s.endswith(":") or s.upper() in {
            "ONE RHETORIC COURSE",
            "CALCULUS SEQUENCE",
            "LINEAR ALGEBRA",
            "REQUIRED COMPUTER SCIENCE FOUNDATION",
            "REQUIRED STATISTICS COURSES",
            "STATISTICAL APPLICATION ELECTIVE",
            "COMPUTATIONAL APPLICATION ELECTIVE",
            "ONE COURSE DESIGNATED AS QR2 OR A SECOND QR1 COURSE",
            "1 COURSE TAKEN", "2 COURSES TAKEN", "3 COURSES TAKEN", "4 COURSES TAKEN",
            "3 GROUPS COMPLETED"
        }:
            if cur:
                item = RequirementItem(
                    id=f"{cur.section_id}_item_{len(cur.items)}",
                    header_raw=s,
                    kind="other",
                )
                cur.items.append(item)
                last_item = item
            continue

        # Default: stash raw (context)
        if cur:
            cur.raw_lines.append(s)
            if last_item:
                last_item.raw_lines.append(s)

    pa.sections = sections

    # --------------------
    # Post-processing
    # --------------------

    # Dedupe courses
    uniq: Dict[Tuple, ParsedCourse] = {}
    for c in pa.courses:
        key = (c.term, c.subject, c.number, c.section, c.credits, c.grade)
        if key in uniq:
            old = uniq[key]
            rank = {"ignored":0, "planned":1, "in_progress":2, "completed":3}
            if rank[c.status] > rank[old.status]:
                uniq[key] = c
        else:
            uniq[key] = c
    pa.courses = list(uniq.values())

    # Hours counters from raw lines
    HOURS_LINE = re.compile(r"""^(EARNED|HOURS IN PROGRESS|TOTAL HOURS).*?(\d+\.\d+)\s+HOURS""")
    for sec in sections:
        for rl in sec.raw_lines:
            m = HOURS_LINE.match(rl)
            if not m:
                continue
            kind = m.group(1).upper()
            val = parse_float(m.group(2))
            if val is None:
                continue
            if kind == "EARNED":
                pa.counters["earned_hours"] = max(val, pa.counters.get("earned_hours", 0.0))
            elif kind == "HOURS IN PROGRESS":
                pa.counters["in_progress_hours"] = max(val, pa.counters.get("in_progress_hours", 0.0))
            elif kind == "TOTAL HOURS":
                pa.counters["total_hours"] = max(val, pa.counters.get("total_hours", 0.0))

    # GPA lines
    gpa_lines = pa.counters.pop("_gpa_lines", [])
    if gpa_lines:
        uiuc = gpa_lines[-1]
        pa.counters["uiuc_gpa"] = uiuc.get("gpa")
        pa.counters["uiuc_gpa_hours"] = uiuc.get("hours")
        pa.counters["uiuc_gpa_points"] = uiuc.get("points")
        first = gpa_lines[0]
        pa.counters["major_gpa"] = first.get("gpa")
        pa.counters["major_gpa_hours"] = first.get("hours")
        pa.counters["major_gpa_points"] = first.get("points")

    # Advanced hours counters (computed from courses)
    adv_earned = 0.0
    adv_inprog = 0.0
    for c in pa.courses:
        lvl = course_level(c.number)
        if lvl is None or c.credits is None:
            continue
        if lvl >= 300:
            if c.status == "completed":
                adv_earned += c.credits
            elif c.status == "in_progress":
                adv_inprog += c.credits
    if adv_earned:
        pa.counters["advanced_hours_earned"] = round(adv_earned, 2)
    if adv_inprog:
        pa.counters["advanced_hours_in_progress"] = round(adv_inprog, 2)

    # ---- NEW: Advanced hours needed (based on college minimum) ----
    min_adv = pa.counters.get("college_min_advanced_hours")
    adv_earned_now = pa.counters.get("advanced_hours_earned", 0.0)
    if isinstance(min_adv, (int, float)):
        needed = max(0.0, float(min_adv) - float(adv_earned_now or 0.0))
        pa.counters["advanced_hours_needed"] = round(needed, 2)

    # Compute per-item fields
    completed_codes = []
    inprog_codes = []
    for c in pa.courses:
        if c.subject and c.number:
            code = f"{c.subject} {c.number}"
            if c.status == "completed":
                completed_codes.append(code)
            elif c.status == "in_progress":
                inprog_codes.append(code)

    for sec in pa.sections:
        for it in sec.items:
            sat: List[str] = []
            scan = " ".join(it.raw_lines)
            for code in set(completed_codes + inprog_codes):
                if code in scan:
                    sat.append(code)
            it.satisfied_by = sorted(set(sat))

            if it.unit:
                if it.unit == "HOURS":
                    it.kind = "hours"
                elif it.unit.startswith("COURSE"):
                    it.kind = "courses"

            if it.select_from:
                norm_opts: List[str] = []
                last_subj = None
                for token in it.select_from:
                    token = token.strip()
                    if not token:
                        continue
                    m = re.match(r"^([A-Z]{2,5})\s*(\d{2,3}[A-Z]?)$", token)
                    if m:
                        last_subj = m.group(1)
                        norm_opts.append(f"{m.group(1)} {m.group(2)}")
                    else:
                        m2 = re.match(r"^(\d{2,3}[A-Z]?)$", token)
                        if m2 and last_subj:
                            norm_opts.append(f"{last_subj} {m2.group(1)}")
                        else:
                            norm_opts.append(token)
                chosen = set(it.satisfied_by)
                remaining = [o for o in norm_opts if o not in chosen]
                if it.needed is not None and it.unit and it.unit.startswith("COURSE"):
                    rem_ct = int(round(it.needed))
                    it.needed_courses = remaining[:rem_ct] if rem_ct > 0 else []
                else:
                    it.needed_courses = remaining

            if it.combos and not any(all(c in it.satisfied_by for c in combo) for combo in it.combos):
                combo_strs = [" + ".join(combo) for combo in it.combos]
                for cs in combo_strs:
                    if cs not in it.needed_courses:
                        it.needed_courses.append(cs)

            if it.needed in (0, 0.0):
                it.status = "complete"
            elif it.needed and it.needed > 0:
                it.status = "in_progress" if any(code in inprog_codes for code in it.satisfied_by) else "incomplete"
            else:
                it.status = "in_progress" if any(code in inprog_codes for code in it.satisfied_by) else "incomplete"

    pa.sections = [s for s in pa.sections if s.section_title]

    # Fallback program: from first "... MAJOR" section
    if "program" not in pa.meta:
        for sec in pa.sections:
            if sec.section_title.upper().endswith("MAJOR"):
                pa.meta["program"] = sec.section_title.replace("MAJOR", "").strip().title()
                break

    return pa


def parse_courses_block_line(line: str) -> Optional[ParsedCourse]:
    m = COURSE_RE.match(line)
    if not m:
        return None
    term = m.group("term")
    subject = m.group("subject")
    number = m.group("number")
    section = (m.group("section") or "").strip() or None
    credits = parse_float(m.group("credits"))
    grade = (m.group("grade") or "").strip()
    flags_raw = (m.group("flags") or "").strip()
    flags: List[str] = []
    if flags_raw:
        for tok in flags_raw.split():
            if tok.startswith(">"):
                flags.append(trim_flags(tok))
    status = status_from_grade_and_flags(grade, flags)
    return ParsedCourse(
        term=term,
        subject=subject,
        number=number,
        section=section,
        credits=credits,
        grade=grade,
        flags=flags,
        status=status,
        raw=line,
    )
