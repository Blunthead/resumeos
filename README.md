# ResumeOS

A focused tool for building and improving resumes.

## What's in here

| Path | What it is |
|---|---|
| [`server/`](server) | Node.js + Express API, TypeScript, MongoDB/Mongoose |
| [`frontend/`](frontend) | React + Vite single-page app |

## Getting started

```bash
# Backend
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI
npm run dev             # http://localhost:5000

# Frontend, in a second terminal
cd frontend
npm install
cp .env.example .env    # leave VITE_API_URL on its localhost default
npm run dev              # http://localhost:5173
```
