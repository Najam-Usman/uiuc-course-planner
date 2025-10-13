# UIUC Course Planner

A modern, student-friendly planner for building multi-semester course plans at UIUC. Create multiple plans, add semesters, search courses (with GenEd tags + average GPA), track credit caps (18 default, overload option), and personalize via a quick onboarding (College → Major) with dark/light themes.

---

## Table of Contents

- [Highlights](#highlights)
- [Live UX Features](#live-ux-features)
- [Tech Stack Overview](#tech-stack-overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data & Seeding](#data--seeding)
- [API Overview](#api-overview)
- [Theming](#theming)
- [Quality & DX](#quality--dx)
- [Roadmap](#roadmap)


---

## Highlights

- **Subject-first search** like UIUC Course Explorer: pick a subject, then drill into courses.
- **Smart results**: course-ID prefix matches rank first (e.g., `STAT` → STAT 400, STAT 410).
- **Rich cards**: credit hours, **Avg GPA**, and **GenEd tags** at a glance.
- **Multi-plan** workspace: create, rename, delete plans; add semesters per plan.
- **Credit tracking**: warns at **18+ credits** unless “Overload” is toggled.
- **Onboarding**: choose **College → Major**, select start term, and a default theme.
- **Beautiful UI**: sleek, accessible components, keyboard-friendly, dark/light themes.

---

## Tech Stack Overview

### Frontend
- **Next.js (App Router)** — hybrid Server Components + Client Components for fast UX.
- **TypeScript** — type safety and better editor tooling.
- **Tailwind CSS** — utility-first styling.
- **shadcn/ui** — headless, accessible UI primitives with Tailwind.
- **Sonner** — minimal toast notifications.
- **Fetch** wrappers — small `lib/*` helpers for API calls (no heavy state lib needed).

Why this combo?
- **Speed**: App Router + RSC keeps data-fetching fast and predictable.
- **DX**: TypeScript + Tailwind + shadcn = consistent, maintainable UI.
- **Simplicity**: No client-side global state unless required; server does the heavy lifting.

### Backend
- **Node.js / Express** — minimal REST API.
- **MongoDB + Mongoose** — schema models for Course, Section, Plan, GPA records.
- **axios + cheerio** — robust scraper for Catalog (majors/colleges) with a **local JSON fallback** to avoid downtime.
- **Docker Compose** — local dev for Mongo + backend.

Why this combo?
- **Familiar** stack, easy to extend.
- **Document-shaped** data fits course/section records.
- **Resilient metadata** (majors/colleges) via fallback JSON in case scraping is blocked.

---

## Architecture

```
Frontend (Next.js App Router)  <--->  Backend (Express)
         |                                    |
         └──────────────────→  MongoDB  ←─────┘
                      (courses, sections, plans, gpa)

Meta (colleges/majors) = live scrape + fallback JSON
```

- The **frontend** consumes the backend via REST.
- The **backend** reads MongoDB for main entities and serves **/meta** endpoints for colleges/majors (live scrape if possible; otherwise fallback JSON).
- An **ETL/seed** script populates courses, sections, and GPA from CSVs.

---

## Project Structure

```
course-planner/
├─ backend/
│  ├─ src/
│  │  ├─ server.js              # Express bootstrap + route mounting
│  │  ├─ routes/
│  │  │  ├─ courses.js          # /courses search & details (+ GPA summary)
│  │  │  ├─ sections.js         # /sections by courseId, etc.
│  │  │  ├─ plans.js            # list/create/patch/add/remove/delete plan
│  │  │  └─ meta.js             # /meta/colleges, /meta/majors, /meta/refresh
│  │  ├─ models/                # Course, Section, Plans, GpaRecord
│  │  ├─ services/              # catalogCache (scraper+fallback), services
│  │  └─ data/                  # majors.fallback.json, colleges.fallback.json
│  ├─ package.json
│  └─ Dockerfile
│
├─ app/
│  └─ web/
│     ├─ app/                   # App Router routes
│     │  ├─ page.tsx            # Landing
│     │  ├─ onboarding/
│     │  ├─ plans/
│     │  ├─ plan/[planId]/
│     │  ├─ search/
│     │  └─ c/[courseId]/
│     ├─ components/            # UI components (cards, chips, modals, etc.)
│     ├─ lib/                   # API helpers (plan.ts, courses.ts)
│     ├─ styles/                # globals.css, tokens
│     └─ package.json
│
├─ data/                        # CSVs used by seed
├─ etl/                         # seed.py + requirements
├─ docker-compose.yml           # dev orchestration
├─ docs/api.md                  # REST endpoint reference
└─ README.md
```

## Data & Seeding

- CSVs live under `data/` (e.g., `data/catalog/catalog.csv`, `data/gpa/gpa.csv`).
- Seed script loads **courses**, **sections**, and **GPA**.

Run:
```bash
# (optional) python venv
# python -m venv .venv && source .venv/bin/activate
pip install -r etl/requirements.txt
python etl/seed.py
```

---

## API Overview

Full details: `docs/api.md`. Quick summary:

### Health
```
GET /health
→ { ok: true, mongo: 2 }
```

### Courses
```
GET /courses?q=STAT
→ [{ courseId, title, subject, credits, geneds? }, ...]

GET /courses/:courseId
→ { ...course, gpaSummary: { avg, terms[] } }
```

### Sections
```
GET /sections?courseId=STAT 400
→ [{ sectionId, crn, meetingTimes, instructors, ... }]
```

### Plans
```
GET /plans?userId=<uid>
POST /plans { userId, title }
GET /plans/:id
PATCH /plans/:id { op: "rename" | "overload" | "addTerm", ... }
PATCH /plans/:id/add { term, courseId, sectionId?, credits? }
PATCH /plans/:id/remove { term, courseId, sectionId? }
DELETE /plans/:id
```

### Meta (Colleges & Majors)
```
GET /meta/colleges
GET /meta/majors[?q=...&college=...]
POST /meta/refresh
```

> The **majors/colleges** endpoints use a scraper with **browser-like headers** plus **fallback JSON** so onboarding is always available.

---

## Theming

- **Sunset (light)** and **Midnight (dark)** palettes.  
- Theme key saved to `localStorage` and applied on first paint to avoid flashes.  
- Components use semantic utility classes for consistent spacing/contrast.

---

## Quality & DX

- **TypeScript** throughout the web app (safer refactors, better autocomplete).
- **Small client islands** only where interactivity is needed (add course, rename, etc.).
- **Optimistic UI** on plan mutations (immediate feedback).
- **Accessible components** via shadcn/ui primitives (focus states, keyboard nav).
- **No heavy global state**: local component state + fetch calls keep surface area small.
- **API doc** (`docs/api.md`) + clean server routes make backend easy to extend.

---

## Roadmap

- Degree audit MVP (parse audit PDF → requirement satisfaction)
- Time conflict detection (section meeting times)
- Section picker + calendar visualization
- Share plan (read-only URL) + export PDF
- Auth + server-side user profiles
- Collaboration (multi-user editing)
- Better GenEd taxonomy/filtering
- OpenAPI/Swagger for the backend
- CI/CD pipelines & cloud deploy
- Unit + integration tests

