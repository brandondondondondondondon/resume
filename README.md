# Resume

A data-driven resume site built with Angular and Angular Material, deployed to GitHub Pages. Content lives in JSON, so updating the resume never requires touching code.

Live site: https://brandondondondondondondon.github.io/resume/

## Features

- **JSON-managed content:** profile, skills, experience, education, certifications, and awards in `resume.json`; experience bullets in `bullets.json`.
- **Skill highlighting:** select skill chips to highlight associated bullets without filtering or hiding other experience.
- **Tag filtering:** filter bullets by tag chips. With several tags selected, bullets carrying any of them are shown (and printed).
- **Tag-based links:** share `?tags=backend,leadership` to open a tailored view. The URL stays in sync as filters change.
- **PDF output:** CI generates `resume.pdf`. The PDF button links to it when no tags are selected, or opens the print dialog (Save as PDF) for filtered views.
- **Light/dark theme:** follows the system setting, can be toggled, and the choice is remembered.

## Editing content

All content is in `public/data/`:

| File           | Contents                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `resume.json`  | profile, contact, grouped `skills`, `experience`, `additionalExperience`, `education` (optional GPA), `certifications`, and `awards` |
| `bullets.json` | list of bullets: `{ jobId, text, tags, skills? }`                                                                                    |

- `jobId` must match an `id` in either `experience` or `additionalExperience`. Entries with no bullets configured remain visible; when tag filters are selected, entries with bullets but no matching bullets are hidden.
- Bullets do not need IDs; the page tracks each bullet by its position in the job's displayed list.
- Dates use `YYYY` or `YYYY-MM`. An `end` of `null` is shown as "Present". Overlapping titles at one employer should be a single entry with combined role text.
- Tags are free-form; any tag used on a bullet appears as a filter chip.
- Skills are grouped by `category`, with each group's `items` rendered as skill chips.
- A bullet's optional `skills` list must use skill names from `resume.json`; selecting one or more skill chips highlights bullets matching any selected skill without filtering them.
- Education entries may include a `gpa`; certifications and awards are displayed in their own section.

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
- **Commits:** small, focused commits following [Conventional Commits](https://www.conventionalcommits.org/): `<type>(optional scope): <description>`, with an imperative, lowercase description. Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore`. Content-only edits to the JSON use `docs` or `chore(content)`. Examples: `feat: add dark mode toggle`, `fix(pdf): use base href when serving`, `ci: install chrome before pdf step`. Mark breaking changes with `!` (e.g. `feat!: change tag filter URL format`). This is enforced locally by commitlint through a Husky `commit-msg` hook, installed automatically by `npm install`.
