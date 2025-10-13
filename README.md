# UIUC Course Planner

A modern, student-friendly planner for building multi-semester course plans at UIUC. Create multiple plans, add semesters, search courses (with GenEd tags + average GPA), track credit caps (18 default, overload option), and personalize via a quick onboarding (College → Major) with dark/light themes.

---

## Table of Contents

- [Highlights](#highlights)
- [App Preview](#app-preview)
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

## 🖼️ App Preview

A quick visual overview of the **UIUC Course Planner** web app — designed for a clean, modern, and intuitive student experience.

| 🏠 Landing Page | 🧭 Onboarding | 📅 Plans Dashboard | 🔍 Course Search |
|-----------------|---------------|--------------------|------------------|
| ![Landing Page](https://private-user-images.githubusercontent.com/179553711/500698112-82a199cf-8341-45c1-b58c-a9b5a328e3f2.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjAzOTk2NjAsIm5iZiI6MTc2MDM5OTM2MCwicGF0aCI6Ii8xNzk1NTM3MTEvNTAwNjk4MTEyLTgyYTE5OWNmLTgzNDEtNDVjMS1iNThjLWE5YjVhMzI4ZTNmMi5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMDEzJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTAxM1QyMzQ5MjBaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1mOWE5NzJjNDY4ODg5ZGJhZTQ0ZjExZTMwNGFlODA4ODgxZWVkODU1NzEwNjc5MWY3NjNjODQ5YWI0ZmZlZGMxJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.gINDhgiMv62C-YpX0ZlG9nlbAySWdA4C6IgGBj0HDUA) | ![Onboarding](https://private-user-images.githubusercontent.com/179553711/500698336-fe9d1b6b-2ab5-49a5-be83-526789c82978.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjAzOTk1MjMsIm5iZiI6MTc2MDM5OTIyMywicGF0aCI6Ii8xNzk1NTM3MTEvNTAwNjk4MzM2LWZlOWQxYjZiLTJhYjUtNDlhNS1iZTgzLTUyNjc4OWM4Mjk3OC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMDEzJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTAxM1QyMzQ3MDNaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1kNjBmOGEwODNlZjdmYmVjZDQ1NGI4MjkxYjI3MTA3MTE5YjIxOTRmMmE2YTdhN2VmMDhlYzNhNjk0YTA5ODk2JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.PPXTjr1TGuBhOgC8gE5igHI8r4RJRl3SJ4dRTtIyf84) | ![Plans Page](https://private-user-images.githubusercontent.com/179553711/500698179-1d936fd6-1894-4c8d-acfd-24d2a07d58d4.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjAzOTk1ODAsIm5iZiI6MTc2MDM5OTI4MCwicGF0aCI6Ii8xNzk1NTM3MTEvNTAwNjk4MTc5LTFkOTM2ZmQ2LTE4OTQtNGM4ZC1hY2ZkLTI0ZDJhMDdkNThkNC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMDEzJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTAxM1QyMzQ4MDBaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1hNTI5ZjZmMWMzOTE0Mzc4OWEyZmUwNTU2ZmVlNmNjZGRkZWFlMGI5ODIxZTcxNTNkNDQyMzliMzhkNDc3ZmRmJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.l2coXF9PvHDaM7zvokAf9O5i_FoXIKASJwoBVi2n-bA) | ![Search Page](https://private-user-images.githubusercontent.com/179553711/500698227-12379c9a-9f76-4313-8afd-2912b8a6243e.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjAzOTk1NTgsIm5iZiI6MTc2MDM5OTI1OCwicGF0aCI6Ii8xNzk1NTM3MTEvNTAwNjk4MjI3LTEyMzc5YzlhLTlmNzYtNDMxMy04YWZkLTI5MTJiOGE2MjQzZS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMDEzJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTAxM1QyMzQ3MzhaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04ODMxNzdkMDEyYjhjY2YzODg5YjczZWUzMWQ5NDcxZjRmNzA0MDQwYzQzZDJiY2U1NTNhMDczZTUxMjk2N2NmJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.rSVac5hoTcZj9GlqwsEHFlsk3KH8T_5XZ-4eWArAjF8) |

| 📊 Example Plan | 🎓 Degree Progress |
|-----------------|--------------------|
| ![Example Plan](https://private-user-images.githubusercontent.com/179553711/500698287-ca034699-3674-45c5-95de-aff0996d2fd3.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjAzOTk1NDAsIm5iZiI6MTc2MDM5OTI0MCwicGF0aCI6Ii8xNzk1NTM3MTEvNTAwNjk4Mjg3LWNhMDM0Njk5LTM2NzQtNDVjNS05NWRlLWFmZjA5OTZkMmZkMy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMDEzJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTAxM1QyMzQ3MjBaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT02NzAzZjVjMGZkMGViM2Q1OTEyNWZjNDExYmE4ZTFhYjY0N2UzYWRiMTNkZDczYjlkNjk0OGUxYzBmMDVmZGYzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.ltFJXNBs2Wlaw-yP0BIyi5V82Glu9nrJTKxzSRh-u_Y) | ![Degree Progress](https://private-user-images.githubusercontent.com/179553711/500698357-1d3e501f-6338-43aa-a8c1-e9d78f5f828c.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjAzOTk0MjEsIm5iZiI6MTc2MDM5OTEyMSwicGF0aCI6Ii8xNzk1NTM3MTEvNTAwNjk4MzU3LTFkM2U1MDFmLTYzMzgtNDNhYS1hOGMxLWU5ZDc4ZjVmODI4Yy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMDEzJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTAxM1QyMzQ1MjFaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03ODg2NDU0MWU2YTY4MzU1MTc4ZGI2NTA3YWEwYzlhNzQ5OTQ3ZTY3ZDgxOTkwZmQ0ZmVjODM5ZmVjNWYyMjVlJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.Xwoz2ZK_Ot2jiPOMAiPWzCGAaOuAjHEvYu9hUfQgHIg) |

---

### ✨ Page Highlights

#### 🏠 **Landing Page**
The entry point — sleek hero section with theme toggle and quick-start navigation.

#### 🧭 **Onboarding**
Guides new users through selecting their **college**, **major**, and **start term**, pulling real data from the UIUC catalog.

#### 📅 **Plans Dashboard**
Manage multiple plans, rename them inline, and toggle overload mode with a clean, card-based layout.

#### 🔍 **Course Search**
Search courses by subject and title, preview **GPA averages** and **GenEd tags**, and add instantly to a semester.

#### 📊 **Example Plan Page**
Interactive semester view with real-time credit tracking and inline editing.

#### 🎓 **Degree Progress Page**
A summarized dashboard visualizing **GenEd**, **major**, and **elective** completion progress.


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

