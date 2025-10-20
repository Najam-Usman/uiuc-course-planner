# Course Planner API (v0)
A lightweight REST API powering course search, sections, GPA summary-on-course, and personal plans.

## Base URL
- Local: `http://localhost:4000`

## Auth
- **MVP:** No auth (all endpoints public).

## Conventions
- JSON everywhere; timestamps are ISO-8601.
- IDs are strings (e.g., `"CS 225"` or `"CS-225"` depending on your seed).
- Errors return `{ "error": "message" }` with an appropriate HTTP status.

---

## Health

### GET /health
Basic service + Mongo connectivity check.

**200**
```json
{ "ok": true, "mongo": 2 }
```
- `mongo`: Mongoose connection state (0=disconnected, 1=connecting, 2=connected, 3=disconnecting).

---

## Courses

### GET /courses
Search courses by **courseId prefix** (e.g., `"CS 2"`) or **title substring**.

**Query**
- `q` (string) — search term; if omitted, returns recent/any up to limit (25)

**200**
```json
[
  {
    "_id": "66f…",
    "courseId": "CS 225",
    "subject": "CS",
    "number": "225",
    "title": "Data Structures",
    "description": "…",
    "credits": 4,
    "genEds": [],
    "prereqText": "CS 173 or MATH 213",
    "termsOffered": ["2025-fa", "2026-sp"],
    "createdAt": "…",
    "updatedAt": "…",
    "__v": 0
  }
]
```

**Notes**
- Limited to 25 records per request.

---

### GET /courses/:courseId
Fetch a single course **plus an aggregated GPA summary** (average across all GPA records for that course, with a set of terms seen).

**200**
```json
{
  "_id": "66f…",
  "courseId": "CS 225",
  "subject": "CS",
  "number": "225",
  "title": "Data Structures",
  "description": "…",
  "credits": 4,
  "genEds": [],
  "prereqText": "CS 173 or MATH 213",
  "termsOffered": ["2025-fa", "2026-sp"],
  "createdAt": "…",
  "updatedAt": "…",
  "gpaSummary": {
    "_id": "CS 225",
    "avg": 3.14,
    "terms": ["2024-fa", "2025-sp", "2025-fa"]
  }
}
```

**404**
```json
{ "error": "Not found" }
```

---

## Sections

### GET /sections/:courseId
List sections for a course, optionally filtered.

**Query (optional)**
- `term` (e.g., `2025-fa`)
- `instructor` (substring, case-insensitive)

**200**
```json
[
  {
    "_id": "66f…",
    "sectionId": "CS225-AL1",
    "courseId": "CS 225",
    "term": "2025-fa",
    "section": "AL1",
    "crn": "12345",
    "instructor": "J. Abbott",
    "location": "SIEBEL 1404",
    "modality": "in-person",
    "meetings": [
      { "days": ["M","W","F"], "start":"11:00", "end":"11:50", "raw":"MWF 11:00–11:50" }
    ],
    "notes": null,
    "createdAt": "…",
    "updatedAt": "…",
    "__v": 0
  }
]
```

---

### GET /sections/:courseId/terms
Distinct term codes for which the course has sections.

**200**
```json
{ "courseId": "CS 225", "terms": ["2024-fa", "2025-sp", "2025-fa"] }
```

---

### GET /sections/:courseId/summary
Group sections by `section` for a quick UI overview.

**Query (optional)**
- `term` (e.g., `2025-fa`)

**200**
```json
{
  "courseId": "CS 225",
  "term": "2025-fa",
  "sections": [
    {
      "section": "AL1",
      "term": "2025-fa",
      "crns": ["12345","67890"],
      "instructors": ["J. Abbott","S. Lee"],
      "meetings": [
        [ { "days":["M","W","F"], "start":"11:00", "end":"11:50", "raw":"…" } ],
        [ { "days":["M","W","F"], "start":"12:00", "end":"12:50", "raw":"…" } ]
      ]
    }
  ]
}
```

---

## Plans

> Plans are keyed by `userId`. For MVP, treat `userId` as a simple string (no auth).

### GET /plans/:userId
Fetch a user’s saved plan.

**200**
```json
{
  "_id": "66f…",
  "userId": "najam",
  "semesters": [
    {
      "term": "2025-fa",
      "courses": [
        { "courseId": "CS 225", "sectionId": "CS225-AL1" }
      ]
    }
  ],
  "createdAt": "…",
  "updatedAt": "…",
  "__v": 0
}
```

**404**
```json
{ "error": "not found" }
```

---

### POST /plans
Create **or replace** a user’s plan.

**Body**
```json
{
  "userId": "najam",
  "semesters": [
    {
      "term": "2025-fa",
      "courses": [{ "courseId": "CS 225", "sectionId": "CS225-AL1" }]
    }
  ]
}
```

**200**
```json
```

**400**
```json
{ "error": "userId required" }
```

---

### PATCH /plans/:userId/add
Add a course to a term (creates the plan and/or term if missing).

**Body**
```json
{ "term": "2025-fa", "courseId": "CS 225", "sectionId": "CS225-AL1" }
```

**200**
```json
```

**400**
```json
{ "error": "term and courseId required" }
```

---

### PATCH /plans/:userId/remove
Remove a course from a term. If `sectionId` supplied, removes that pairing; otherwise removes by `courseId`.

**Body**
```json
{ "term": "2025-fa", "courseId": "CS 225" }
```

**200**
```json
```

**404**
```json
{ "error": "not found" }
```

---

### DELETE /plans/:userId
Remove a user’s entire plan.

**200**
```json
{ "ok": true }
```

**404**
```json
{ "error": "not found" }
```

---

## Examples (curl)

```bash
curl http://localhost:4000/health

curl "http://localhost:4000/courses?q=cs%20225"

curl http://localhost:4000/courses/CS%20225

curl "http://localhost:4000/sections/CS%20225?term=2025-fa"

curl http://localhost:4000/sections/CS%20225/terms

curl "http://localhost:4000/sections/CS%20225/summary?term=2025-fa"

curl http://localhost:4000/plans/najam

curl -X POST http://localhost:4000/plans   -H "Content-Type: application/json"   -d '{ "userId":"najam", "semesters":[{ "term":"2025-fa", "courses":[{ "courseId":"CS 225" }] }]}'
```

---

## Models (reference)

### Course
```ts
{
  courseId: string,
  subject: string,
  number: string,
  title: string,
  description: string,
  credits: number,
  genEds: string[],
  prereqText: string,
  termsOffered: string[],
  createdAt: string,
  updatedAt: string
}
```

### Section
```ts
{
  sectionId: string,
  courseId: string,
  term: string,
  section: string,
  crn: string,
  instructor: string,
  location: string,
  modality: string,
  meetings: [{ days: string[], start: string, end: string, raw: string }],
  notes: string | null,
  createdAt: string,
  updatedAt: string
}
```

### GpaRecord
```ts
{
  courseId: string,
  term: string,
  instructor: string,
  counts: object,
  avgGpa: number,
  createdAt: string,
  updatedAt: string
}
```

### Plan
```ts
{
  userId: string,
  semesters: [
    { term: string, courses: [{ courseId: string, sectionId?: string }] }
  ],
  createdAt: string,
  updatedAt: string
}
```
