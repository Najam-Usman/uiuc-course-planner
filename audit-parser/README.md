# UIUC Degree Audit → JSON Parser

Parses a UIUC uAchieve “My Audit – Audit Results” PDF into structured JSON suitable
for your Course Planner’s `StudentRecord` and requirement engine.

## Features
- Extracts student metadata (program, catalog year, student ID, prepared-on time)
- Parses sections (Gen Ed, Major, GPA/residency/advanced-hour blocks, etc.)
- Parses course rows (term, subject, number, section, credits, grade, flags)
- Captures `EARNED:` / `NEEDS:` counts (HOURS, COURSES, SUB-GROUPS)
- Reads `SELECT FROM:` and “ONE OF THE FOLLOWING COMBINATIONS” options
- Computes **needed_courses** (when the audit lists choosable options)
- Maps legend flags like `>I` (in-progress), `>C` (duplication), etc.

> Designed against your sample: `CS + STAT Audit PDF.pdf`.  
> Tolerant to minor line-break differences and spacing.

## Quick start

```bash
# 1) Create a venv and install deps
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate
pip install -r audit-parser/requirements.txt

# 2) Parse a PDF
python -m audit_parser.cli parse "/path/to/CS + STAT Audit PDF.pdf" -o out.json --debug

# 3) Pretty print
jq . out.json
