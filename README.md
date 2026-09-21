# Trailhead — Student Career Roadmap & Placement Readiness Tracking System

A web-based application that helps students plan, track, and monitor their placement
preparation across aptitude, DSA, programming languages, projects, communication,
resume building, and interview/company prep — with progress tracking, a placement
readiness score, analytics, achievements, and history.

## Tech stack

- **HTML5, CSS3, vanilla JavaScript (ES6)** — no frameworks or build tools required.
- **Browser LocalStorage** for all persistence (profile, roadmap, tasks, activity log,
  readiness history, achievements) — exactly as specified in the problem statement:
  data is read, updated, and analyzed by JavaScript entirely client-side, with no backend.

## How to run

No installation needed.

1. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox), **or**
2. Serve the folder locally for a cleaner experience, e.g.:
   ```
   npx serve .
   ```
   or
   ```
   python3 -m http.server 8000
   ```
   then visit `http://localhost:8000`.

On first launch you'll be asked to set up a profile and career goal — this seeds a
starter roadmap across all seven preparation categories.

## Project structure

```
placement-tracker/
├── index.html     Markup for onboarding, app shell, and all seven views
├── styles.css     Design system (design tokens, layout, components)
├── app.js         State management, LocalStorage persistence, and all view logic
└── README.md      This file
```

## Functional requirements → implementation

| Requirement (from problem statement)        | Where it lives |
|---------------------------------------------|----------------|
| User profile management                      | Onboarding form + profile modal (`open-profile`) |
| Career goal management                       | Target role, target company tier, target date in profile |
| Roadmap creation                              | Seeded 7-category roadmap in `CATEGORIES`, **Roadmap** view |
| Task management (create/edit/complete/delete/categorize) | **Tasks** view + task modal |
| Skill tracking (completed/ongoing/pending)   | **Skill Progress** view (`renderSkills`) |
| Progress monitoring (overall & category %)   | Dashboard stat cards, category progress bars |
| Placement readiness assessment & score        | `readinessScore()` — weighted average across categories, mapped to Beginner / Intermediate / Advanced / Interview-Ready |
| Dashboard                                     | **Dashboard** view: readiness ring, stats, recent tasks, upcoming tasks, recommendations |
| Analytics & insights                          | **Analytics** view: 14-day activity chart, consistency stats, category completion chart |
| Skill gap identification                      | **Skill Progress** view — categories under 40% flagged |
| Recommendations                               | `buildRecommendations()` — rule-based, reacts to weakest category, streak, pending high-priority tasks, deadline proximity |
| History management                            | **History** view: readiness-over-time chart + completed activity log |
| Consistency tracking (daily/weekly/streaks)   | `computeStreaks()` — current streak, longest streak, active days |
| Achievement system                            | **Achievements** view — 12 rule-based badges (`ACHIEVEMENT_DEFS`) |
| Search & filtering                            | **Tasks** view — search box + category/status/priority filters |
| Data export                                   | "Export progress" button — downloads a JSON summary and a CSV of all tasks |
| Data storage in LocalStorage                  | `STORAGE_KEY` — single JSON blob read/written via `load()` / `save()` |

## Notes for viva / demo

- The roadmap comes pre-seeded with realistic tasks per category so the app is useful
  immediately; you can still add, edit, or delete any task.
- The readiness score is an average of each category's completion percentage (not just
  overall tasks), so no single large category can dominate the score.
- Achievements, streaks, and readiness history are recalculated automatically whenever
  a task's completion status changes — see `toggleTaskCompletion()` in `app.js`.
- All charts (activity bars, category bars, readiness history) are hand-built with
  plain HTML/CSS — no charting library dependency.
