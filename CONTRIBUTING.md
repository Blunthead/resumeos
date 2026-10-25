# Contributing

Thanks for helping out. Bug reports, ideas and pull requests are all welcome.

## Run it locally

```bash
# Backend (http://localhost:5000). No MongoDB needed: it starts an embedded one.
cd server && npm install && cp .env.example .env && npm run dev

# Frontend (http://localhost:5173), in a second terminal
cd frontend && npm install && cp .env.example .env && npm run dev
```

## Before you open a pull request

Run the same checks CI runs:

```bash
cd server   && npm run typecheck && npm test
cd frontend && npm run lint && npm test && npm run build
```

## Ground rules

- **Keep changes small and focused.** One fix or feature per pull request.
- **Match the surrounding code**: naming, comment density, formatting.
- **Add a test** when you fix a bug or change behaviour. API behaviour belongs in
  `server/tests/api.test.mjs`; pure helpers in `frontend/tests/`.
- **Measure before optimising.** Say what you measured and what changed.
- **Templates:** a new template id must be added in both
  `frontend/src/lib/resume.js` and `server/src/lib/resumeSchema.ts`, and styled
  in `resumeDocument.css` using the shared spacing tokens. If it uses the serif
  or monospace family, list it in `server/src/lib/fonts.ts` too. Tests fail if
  any of these drift apart.
- **PDF output:** keep text the user didn't type out of the stylesheet (no
  `content: "> "` style prefixes), and use static font weights, never variable
  fonts. See "Fonts and the PDF" in the README.
- **Never put secrets in the repo.** `.env` files are ignored; use
  `.env.example` for documentation.

## Reporting bugs

Open an issue with what you did, what you expected, and what happened. A
screenshot or the browser console output helps a lot.
