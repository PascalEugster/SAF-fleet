# Contributing to SAF-fleet

First off — thank you for taking the time to contribute! 🙏 This is a small,
self-hosted vehicle fleet manager, and contributions of all sizes are welcome:
bug reports, feature ideas, documentation, translations, and code.

> 🇩🇪 Beiträge sind willkommen — Fehlermeldungen, Ideen, Übersetzungen und Code.
> Die Projektsprache (Issues, Code-Kommentare) ist Englisch, die Anwendung selbst
> ist auf Deutsch.

---

## A few things to know first

- **License of your contributions.** This project is licensed under the
  [MIT License](LICENSE.md). By submitting a contribution, you agree that it is
  provided under that same license. Don't submit code you don't have the right to
  license this way.
- **Not affiliated with the Swiss Armed Forces.** The default “Schweizer Armee”
  branding is placeholder demo content. Please **don't** add real coats of arms,
  official logos, or anything implying official endorsement. The app is meant to be
  white-labelled (see the README).
- **Local / intranet tool.** Keep the scope in mind: this is built to run on a single
  PC or a trusted internal network, not as a hardened public internet service. New
  features should fit that model.
- **Be respectful.** Assume good intent, keep discussions friendly and constructive.

---

## Ways to contribute

- 🐛 **Report a bug** — open a [Bug report](../../issues/new?template=bug_report.yml).
- 💡 **Suggest a feature** — open a [Feature request](../../issues/new?template=feature_request.yml).
- 🌍 **Improve translations** — UI labels live in the Payload collections/globals as
  `{ de: '…', en: '…' }` pairs (see `src/collections/`, `src/globals/`) and in
  `src/lib/labels.ts`.
- 📖 **Improve the docs** — the README is written for non-technical users; clarity fixes
  are very welcome.
- 🧑‍💻 **Write code** — see below.

If you're planning a larger change, please **open an issue first** to discuss it before
spending time on a pull request.

---

## Development setup

Full instructions are in the [README](README.md#-installation-step-by-step). The short
version:

```bash
pnpm install
cp .env.example .env      # then set a random PAYLOAD_SECRET
pnpm seed                 # optional: sample data + an admin login
pnpm dev                  # http://localhost:3000
```

### Project structure

```
src/
├── app/(frontend)/        Dashboard, vehicle/person pages + server actions
├── app/(payload)/         Payload admin panel (mostly generated — avoid hand-editing)
├── collections/           Vehicles, Users, Media
├── globals/               Branding (white-label settings)
├── components/            Header, VehicleCard, AssignPanel, UserCombobox, forms …
├── lib/                   Labels, formatting, branding helper
└── payload.config.ts      Payload configuration (SQLite, German/English admin)
```

### If you change Payload collections, fields, or globals

Regenerate the derived files so types and the admin import map stay in sync:

```bash
pnpm generate:types
pnpm generate:importmap
```

Commit the regenerated `src/payload-types.ts` (and `importMap.js` if it changed).

---

## Before you open a pull request

Please make sure these all pass locally:

```bash
pnpm lint            # ESLint — should report 0 problems
npx tsc --noEmit     # TypeScript type check — should pass
pnpm build           # production build — should succeed
```

### Coding conventions

- **TypeScript + React Server Components** by default; add `'use client'` only when a
  component needs interactivity. Match the patterns already in `src/`.
- **Styling** is [Tailwind CSS](https://tailwindcss.com); reuse the existing design
  tokens (`army-red`, `ink`, `line`, `muted`, …) defined in
  `src/app/(frontend)/globals.css`.
- **User-facing text** is German. In Payload, prefer localized labels
  (`label: { de: '…', en: '…' }`) so the admin stays bilingual.
- **Formatting** is handled by Prettier (config in `.prettierrc.json`). Keep diffs
  focused — don't reformat unrelated files.
- Keep it simple and readable; match the surrounding code rather than introducing new
  patterns or dependencies without discussion.

---

## Pull request process

1. **Fork** the repository and create a branch from `main`
   (e.g. `fix/usage-history-order` or `feat/export-csv`).
2. Make your change, keeping commits small and descriptive.
3. Run the checks above (`lint`, `tsc`, `build`).
4. Open a pull request and fill in the PR template. Link any related issue
   (e.g. “Closes #12”). Screenshots or short clips are very helpful for UI changes.
5. A maintainer will review. Please be patient and responsive to feedback — this is a
   volunteer-run project.

---

## Publishing (maintainers)

Before pushing to the public repository, run the safety gate so nothing sensitive leaks:

```bash
git add -A
pnpm check:publish      # scans the git index for secrets, keys, .env, database, etc.
```

It exits non-zero if anything sensitive (a real `.env`, the SQLite database, uploaded
media, keys, tokens or secret-like strings) is about to be committed. Only push once it
reports **✅ SAFE TO PUBLISH**.

## Reporting security issues

Because this is intended for trusted local/intranet use, please **don't** open a public
issue for anything that could put real deployments at risk. Instead, report it privately
by email to **info@inoo.ch**. We'll work with you to address it.

---

Thanks again for helping make SAF-fleet better! 🚗
