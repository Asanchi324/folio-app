## Folio – Admissions Portfolio & Roadmap

Folio is a minimalist web app for high school students applying to international universities. It focuses on **extracurricular clarity**, an **adaptive admissions roadmap**, and an optional **AI‑assisted profile view**.

### Features

- **Extracurricular portfolio**
  - Add activities with title, role, organization, duration, hours, category, and description.
  - View activities as **cards**, a **ranked list**, or a **timeline**.
  - Optional **AI description improvement** button that rewrites in concise, application‑style language without fabricating achievements.

- **Admissions roadmap**
  - Visual stages from tests to submission, each with a checklist and progress percentage.
  - Context‑aware defaults that adapt to **grade level** and **target region** (e.g. English tests, interviews).
  - Clear “**What to do next**” suggestion on every stage.

- **AI admissions evaluation**
  - Input GPA, test scores, intended major, and target universities.
  - Uses your extracurricular list to estimate a rough **Reach / Match / Safety** profile.
  - Surfaces **strengths**, **gaps**, and **specific improvement suggestions**.

### Tech stack

- **React + TypeScript** (Vite)
- **Tailwind CSS** for a clean, responsive UI
- No backend by default – AI features use **local heuristic stubs** in `src/ai/mockAi.ts`.

### Running locally

```bash
pnpm install   # or npm / yarn
pnpm dev       # starts Vite dev server
```

Then open the printed `localhost` URL in your browser.


