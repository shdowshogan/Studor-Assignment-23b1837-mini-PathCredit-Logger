# Studor PathCredit Logger

A small full-stack PathCredit Logger built with React and Express. Students can create an account, sign in, log activities, and filter their own activity feed by category without a page reload.

## How to run locally

```bash
npm install
npm run dev
```

The client runs on `http://localhost:5173` and the API runs on `http://localhost:4000`.

## What I built

- A React frontend with two side-by-side views: activity logging form and activity feed.
- Category filtering for `Academic`, `Technical`, `Cultural`, and `Sports`.
- JWT-based authentication so each student sees only their own activities.
- Server-side validation for empty fields, invalid categories, and future dates.
- Lightweight JSON-file persistence so data survives a restart without adding database setup.