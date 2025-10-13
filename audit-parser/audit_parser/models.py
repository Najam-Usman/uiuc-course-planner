from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Literal, Any


Status = Literal["completed", "in_progress", "transfer", "ignored", "planned"]
Unit = Literal["HOURS", "COURSES", "SUB-GROUPS"]

@dataclass
class ParsedCourse:
    term: Optional[str]
    subject: Optional[str]
    number: Optional[str]
    section: Optional[str]
    credits: Optional[float]
    grade: Optional[str]
    flags: List[str] = field(default_factory=list)
    status: Status = "completed"
    raw: str = ""

@dataclass
class RequirementItem:
    id: str
    header_raw: str
    kind: Literal["hours","courses","combo","gened","gpa","residency","other"] = "other"
    earned: Optional[float] = None
    needed: Optional[float] = None
    unit: Optional[Unit] = None
    select_from: List[str] = field(default_factory=list)     # e.g., ["CS 222","CS 357"]
    combos: List[List[str]] = field(default_factory=list)    # e.g., [["CS 233","CS 341"]]
    satisfied_by: List[str] = field(default_factory=list)    # e.g., ["CS 124","CS 128"]
    needed_courses: List[str] = field(default_factory=list)  # computed
    status: Literal["complete","in_progress","incomplete"] = "incomplete"
    raw_lines: List[str] = field(default_factory=list)

@dataclass
class RequirementSection:
    section_id: str
    section_title: str
    classification: str = "other"
    items: List[RequirementItem] = field(default_factory=list)
    raw_lines: List[str] = field(default_factory=list)

@dataclass
class ParsedAudit:
    meta: Dict[str, Any] = field(default_factory=dict)
    legend: Dict[str, str] = field(default_factory=dict)
    courses: List[ParsedCourse] = field(default_factory=list)
    sections: List[RequirementSection] = field(default_factory=list)
    counters: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        def _dc(o):
            if hasattr(o, "__dataclass_fields__"):
                return asdict(o)
            if isinstance(o, list):
                return [_dc(x) for x in o]
            if isinstance(o, dict):
                return {k: _dc(v) for k, v in o.items()}
            return o
        return _dc(self) # type: ignore
