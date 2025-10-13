from __future__ import annotations
import hashlib
import regex as re
from typing import Optional

# Heuristic: UPPERCASE headers (but we'll filter noisy ones)
UPPER_LINE = re.compile(r"^[A-Z0-9 &()'/\-\.,:!]+$")

URL_RE = re.compile(r"https?://", re.I)
DATE_STAMP_RE = re.compile(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b")
PAGE_STAMP_RE = re.compile(r"\b\d+/\d+\b")  # "2/6"

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def is_section_header(line: str) -> bool:
    """
    Heuristic for section headers:
    - all caps lines allowed
    - exclude URLs, obvious page/time stamps, and boilerplate
    """
    l = line.strip()
    if not l or len(l) < 3:
        return False
    if URL_RE.search(l) or DATE_STAMP_RE.search(l) or PAGE_STAMP_RE.search(l):
        return False
    noisy_exact = {
        "MY AUDIT - AUDIT RESULTS TAB",
        "OPEN ALL SECTIONS  CLOSE ALL SECTIONS",
        "IMPORTANT NOTE TO STUDENTS",
        "THIS REPORT INCLUDES COMPLETED AND IN-PROGRESS (IP) COURSEWORK.",
        "SUMMARY OF COURSES TAKEN- NO MORE THAN 18 HOURS OF CREDIT/NO CREDIT COURSES",
        "*********** LEGEND ***********",
        "************************ END OF ANALYSIS ************************",
        "PRIVACY POLICY",
    }
    if l.upper() in noisy_exact:
        return False
    return bool(UPPER_LINE.match(l))

def slugify(title: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "_", title.strip().lower())
    return re.sub(r"_+", "_", s).strip("_")

def normalize_catalog_year(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    if re.fullmatch(r"\d{6}", raw):
        start = raw[:4]
        try:
            s = int(start)
            return f"{s}-{s+1}"
        except:
            return None
    if re.fullmatch(r"\d{4}[-–]\d{4}", raw):
        return raw.replace("–","-")
    return None

def parse_float(s: str) -> Optional[float]:
    try:
        return float(s)
    except:
        return None

def trim_flags(s: str) -> str:
    return s.strip().strip(":").strip()

def normalize_unit(u: Optional[str]) -> Optional[str]:
    if not u:
        return None
    U = u.upper().replace("  ", " ").strip()
    if "HOUR" in U:
        return "HOURS"
    if "COURSE" in U:
        return "COURSES"
    if "SUB" in U:
        return "SUB-GROUPS"
    return U

def course_level(number: Optional[str]) -> Optional[int]:
    """
    Extract the numeric level from a course number like '241', '410', '199A'.
    Returns an int (e.g., 241, 410, 199) or None if not parseable.
    """
    if not number:
        return None
    # take the first numeric token
    m = re.search(r"\d+", number)
    if not m:
        return None
    try:
        return int(m.group(0))
    except:
        return None
