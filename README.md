# Resume

A data-driven resume site built with Angular and Angular Material, deployed to GitHub Pages. Content lives in JSON, so updating the resume never requires touching code.

Live site: https://brandondondondondondondon.github.io/resume/

## Features

- **JSON-managed content:** profile and jobs in `resume.json`, bullet points in `bullets.json`.
- **Tag filtering:** filter bullets by tag chips. With several tags selected, bullets carrying any of them are shown (and printed).
- **Role-targeted links:** preset roles select a set of tags. Share `?role=frontend` or `?tags=backend,leadership` to send a tailored view. The URL stays in sync as filters change.
- **PDF output:** CI generates `resume.pdf` plus one PDF per role. The PDF button links to the match for the current view, or opens the print dialog (Save as PDF) for custom tag selections.
- **Light/dark theme:** follows the system setting, can be toggled, and the choice is remembered.

## Editing content

All content is in `public/data/`:

| File           | Contents                                                    |
| -------------- | ----------------------------------------------------------- |
| `resume.json`  | name, title, contact, summary, `roles`, `jobs`, `education` |
| `bullets.json` | list of bullets: `{ id, jobId, text, tags }`                |

- `jobId` must match a job `id` in `resume.json`. Jobs with no matching bullets are hidden.
- Bullet `id` values must be unique.
- A role is `{ id, label, tags }`. Its tags are combined with OR: a bullet with any of them appears. Its `id` is used in `?role=<id>` and the PDF file name (`resume-<id>.pdf`), so keep it URL-safe.
- A job's `end` of `null` is shown as "Unspecified", so use a real end date for past roles. Overlapping titles at one employer should be a single job with combined role text.
- Tags are free-form; any tag used on a bullet appears as a filter chip.

Types for this data are in `src/app/resume.model.ts`.

## Project layout

```
public/data/          JSON content (resume.json, bullets.json)
src/app/              App component, template, styles, model, tests
src/styles.scss       Material theme (colors, typography)
scripts/make-pdf.mjs  Renders the built site to PDFs with headless Chrome
.github/workflows/    GitHub Pages deploy (build, PDFs, publish)
```

## Development

```bash
npm install
npm start          # dev server at http://localhost:4200
npm run build      # production build in dist/resume/browser
npm test           # unit tests (Vitest)
npx ng test --watch=false --coverage   # with coverage report in coverage/
```

### Generating PDFs locally

The PDF button gives a 404 under `npm start` because PDFs are only produced for a build:

```bash
npx puppeteer browsers install chrome   # first time only
npx ng build --base-href /resume/
BASE_HREF=/resume/ node scripts/make-pdf.mjs
```

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds with `--base-href /<repo-name>/`, generates the PDFs, and publishes `dist/resume/browser` to GitHub Pages. One-time setup: Settings -> Pages -> Source: **GitHub Actions**.

If the repository is renamed to `<user>.github.io`, change the base href in the workflow and `BASE_HREF` to `/`.

## Standards

- **Formatting:** Prettier (`printWidth` 100, single quotes) and `.editorconfig` (UTF-8, 2-space indent, final newline). Format before committing.
- **Angular:** standalone components, signals for state (`signal`, `computed`, `effect`), built-in control flow (`@if`, `@for` with `track`), and `inject()` for dependencies.
- **Data fetching:** use relative URLs (`data/...`) so they work under the GitHub Pages base href.
- **Styling:** use Material system tokens (`var(--mat-sys-*)`) rather than hard-coded colors so light and dark themes both work. Keep print styles in sync: toolbar and filters are hidden when printing.
- **Accessibility:** interactive controls need accessible labels, and animations must respect `prefers-reduced-motion`.
- **Testing:** every behavior change needs a test in `src/app/app.spec.ts`. Keep line coverage at 100% for `src/app`.
- **Content changes:** edit the JSON only; do not hard-code resume text in templates.
- **Commits:** small, focused commits following [Conventional Commits](https://www.conventionalcommits.org/): `<type>(optional scope): <description>`, with an imperative, lowercase description. Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore`. Content-only edits to the JSON use `docs` or `chore(content)`. Examples: `feat: add dark mode toggle`, `fix(pdf): use base href when serving`, `ci: install chrome before pdf step`. Mark breaking changes with `!` (e.g. `feat!: rename roles to views`). This is enforced locally by commitlint through a Husky `commit-msg` hook, installed automatically by `npm install`.
