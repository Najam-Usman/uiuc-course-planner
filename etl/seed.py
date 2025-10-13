import os 
import re 
import math 
import pandas as pd 
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URL = os.getenv("MONGODB_URI", "mongodb://localhost:27017/course_planner")
CAT_DIR = os.getenv("DATA_CATALOG_DIR", "../data/catalog")
GPA_DIR = os.getenv("DATA_GPA_DIR", "../data/gpa")

CAT_FILE = os.path.join(CAT_DIR, "catalog.csv")
GPA_FILE = os.path.join(GPA_DIR, "gpa.csv")

client = MongoClient(MONGO_URL)
db = client.get_default_database()

GRADE_WEIGHTS = {
    "A+" : 4.0,
    "A" : 4.0,
    "A-" : 3.67,
    "B+": 3.33,
    "B" : 3.00,
    "B-" : 2.67,
    "C+" : 2.33,
    "C" : 2.00,
    "C-" : 1.67,
    "D+" : 1.33,
    "D" : 1.00,
    "D-": 0.67,
    "F":0.00
}

#Helper Functions

def _is_nan(x) -> bool:
    return x is None or (isinstance(x, float) and math.isnan(x))

def clean_str(x):
    return "" if _is_nan(x) else str(x).strip()

def to_float_hours(s : str):
    """Extract numeric hours from strings like '3 hours', '4.0 Hours', etc."""
    if not isinstance(s, str):
        return None
    m = re.search(r"(\d+(?:\.\d+)?)\s*hour", s.lower())
    return float(m.group(1)) if m else None


def split_list(val):
    """Split by comma OR " and " (gen-eds often formatted with 'and')"""
    if not isinstance(val, str) or not val.strip():
        return []
    s = val.replace(" and ", ",")
    return [x.strip() for x in s.split(",") if x.strip()]


def parse_time_to_24h(s : str) -> str:
    """ "9:00 AM" -> "09:00", "12:50 PM" -> "12:50", empty -> "" """
    if not isinstance(s, str) or not s.strip():
        return ""

    s = s.strip().upper()
    m = re.match(r"^(\d{1,2}):(\d{2})\s*(AM|PM)$", s)
    if not m:
        return ""

    hh, mm, ap = int(m.group(1)), m.group(2), m.group(3)
    if ap == "AM":
        hh = 0 if hh == 12 else hh
    else:
        hh = 12 if hh == 12 else hh + 12

    return f"{hh:02d}:{mm}"


def parse_days(s : str):
    """ Accepts "MWF", "M W F" or single "F" """
    if not isinstance(s, str) or not s.strip():
        return []
    
    s = s.strip().upper().replace(" ", "")

    out = [ch for ch in s if ch in {"M", "T", "W", "R", "F", "S", "U"}]

    seen = set()
    dedup = []

    for d in out:
        if d not in seen:
            dedup.append(d)
            seen.add(d)
    return dedup

def first_instructor(s : str):
    """ "Siglos,D;Wang, Y" -> "Siglos, D" """
    if not isinstance(s , str) or not s.strip():
        return ""
    return s.split(";")[0].strip()

#Loader Functions

def load_catalog_csv():
    """
    Expected minimal columns:
      - Subject, Number, Name, Credit Hours
    Optional (if present): Description, Degree Attributes / GenEd, Terms Offered, Prerequisites
    """

    if not os.path.exists(CAT_FILE):
        raise FileNotFoundError(f"Catalog file not found: {CAT_FILE}")
    
    df = pd.read_csv(CAT_FILE)

    must_cols = ["Subject", "Number", "Name", "Credit Hours", "YearTerm", "Section", "CRN"]

    for c in must_cols:
        if c not in df.columns:
            raise ValueError(f"Missing required catalog column: '{c}'")
        

    course_seen = set()
    course_upserts = 0
    section_upserts = 0

    for _, r in df.iterrows():
        subject = clean_str(r.get("Subject"))
        number = clean_str(r.get("Number"))
        name = clean_str(r.get("Name"))
        desc = clean_str(r.get("Description"))
        yearterm = clean_str(r.get("YearTerm"))
        geneds = split_list(clean_str(r.get("Degree Attributes")))
        credits = to_float_hours(clean_str(r.get("Credit Hours")))

        course_id = f"{subject} {number}".strip()

        if course_id not in course_seen:

            terms = sorted(set(clean_str(x) for x in df.loc[
                (df["Subject"] == r["Subject"]) & (df["Number"] == r["Number"])
            ]["YearTerm"].tolist()))

            db.courses.update_one(
                {"courseId" : course_id},
                {"$set" : {
                    "courseId" : course_id,
                    "subject" : subject,
                    "number" : number,
                    "title" : name,
                    "description" : desc,
                    "credits" : credits,
                    "genEds" : geneds,
                    "prereqText" : "",
                    "termsOffered" : [t for t in terms if t]
                }},
                upsert=True
            )

            course_seen.add(course_id)
            course_upserts += 1
        
        section   = clean_str(r.get("Section"))
        crn       = clean_str(r.get("CRN"))
        typ       = clean_str(r.get("Type"))           
        start     = parse_time_to_24h(clean_str(r.get("Start Time")))
        end       = parse_time_to_24h(clean_str(r.get("End Time")))
        days      = parse_days(clean_str(r.get("Days of Week")))
        room      = clean_str(r.get("Room"))
        bldg      = clean_str(r.get("Building"))
        location  = " ".join([x for x in [room, bldg] if x])
        instr_raw = clean_str(r.get("Instructors"))
        instructor = first_instructor(instr_raw)

        notes = clean_str(r.get("Section Info"))

        if not notes:
            notes = clean_str(r.get("Schedule Information"))
        
        section_id = f"{course_id}:{yearterm}:{section}"

        db.sections.update_one(
            {"sectionId": section_id},
            {"$set" : {
                "sectionId": section_id,
                "courseId": course_id,
                "term": yearterm,
                "section": section,
                "crn": crn,
                "instructor": instructor,
                "location": location,
                "modality": "", 
                "meetings": [{
                    "days": days,
                    "start": start,
                    "end": end,
                    "raw": f"{''.join(days)} {start}-{end} | {location}".strip()
                }],
                "notes": notes
            }},
            upsert=True
        )
        section_upserts += 1
    
    print(f"[catalog] upserted {course_upserts} courses, {section_upserts} sections")


def load_gpa_csv():

    if not os.path.exists(GPA_FILE):
        raise FileNotFoundError(f"GPA file not found: {GPA_FILE}")

    df = pd.read_csv(GPA_FILE)

    
    subj_col   = "Subject"
    num_col    = "Number"
    term_col   = "YearTerm" if "YearTerm" in df.columns else "Term"
    instr_col  = "Primary Instructor" if "Primary Instructor" in df.columns else "Instructor"

    
    grade_cols = [g for g in GRADE_WEIGHTS.keys() if g in df.columns]
    has_W      = "W" in df.columns
    has_students = "Students" in df.columns

    upserts = 0
    for _, r in df.iterrows():
        subject = clean_str(r.get(subj_col))
        number  = clean_str(r.get(num_col))
        course_id = f"{subject} {number}".strip()
        term    = clean_str(r.get(term_col))
        instr   = clean_str(r.get(instr_col))

        counts = {}
        for g in grade_cols:
            v = r.get(g, 0)
            try:
                counts[g] = float(0 if _is_nan(v) else v)
            except Exception:
                counts[g] = 0.0

        total_pts = sum(counts[g] * GRADE_WEIGHTS[g] for g in counts)
        total_graded = sum(counts[g] for g in counts)
        avg = round(total_pts / total_graded, 3) if total_graded else None

        doc = {
            "courseId": course_id,
            "term": term,
            "instructor": instr,
            "counts": counts,
            "avgGpa": avg
        }

        if has_W:
            wv = r.get("W")
            if not _is_nan(wv):
                try: doc["W"] = int(wv) # type: ignore
                except: pass
        if has_students:
            sv = r.get("Students")
            if not _is_nan(sv):
                try: doc["students"] = int(sv) # type: ignore
                except: pass

        db.gparecords.update_one(
            {"courseId": course_id, "term": term, "instructor": instr},
            {"$set": doc},
            upsert=True
        )
        upserts += 1

    print(f"[gpa] upserted {upserts} GPA docs")

# -------------------- MAIN --------------------
if __name__ == "__main__":
    print(f"Connecting to Mongo: {MONGO_URL}")
    load_catalog_csv()
    load_gpa_csv()
    print("✅ Seed complete.")

