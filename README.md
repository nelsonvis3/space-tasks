# SPACE Tasks

[![Quality](https://github.com/nelsonvis3/space-tasks/actions/workflows/quality.yml/badge.svg)](https://github.com/nelsonvis3/space-tasks/actions/workflows/quality.yml)

A free, open-source productivity app: tasks, calendar, a PDF reader and music. Its AI, OCR and translation run on your own device, so there are no paid APIs and nothing to track you.

![SPACE Tasks overview](docs/screenshots/overview.png)

- **Tasks and planning**: workspaces, priorities, calendar and progress stats.
- **PDF reader**: local OCR and translation in seven languages.
- **On-device AI assistant**: WebLLM on WebGPU; no AI provider sees your questions.
- **Private accounts**: password-protected, with version history, recovery and automatic backups, all on your computer.

**Engineering highlights:** strict CSP with no CDN scripts (runtimes pinned by sha512), rate-limited auth with scrypt and CSRF protection, verified SQLite backups, and 88 unit plus Playwright tests on Chromium and Firefox, including accessibility checks.

**Stack:** React 19 · TypeScript · Vite · Node 24 (built-in SQLite) · Electron · Playwright

**Status:** early release. Try the [live demo](https://nelsonvis3.github.io/space-tasks/) in your browser (data stays on your device); the complete desktop app is coming to Flathub.

## Run it

```bash
npm run runtime:install          # pinned Node 24 for this project
npm run runtime -- run dev       # app and API at http://localhost:5173
npm run runtime -- run verify    # types, tests and build
npm run runtime -- run desktop   # desktop window (after a build)
```

## License

Code under [GPL-3.0-only](LICENSE). The logo is © Nelson Sivisstum, all rights reserved; see [LICENSING.md](LICENSING.md).

Built by [Nelson Sivisstum](https://nelsonsivisstum.vercel.app/).
