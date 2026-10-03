# SmartPark — Urban Parking Management System

A modern parking management platform for cities. Manage lots, slots,
bookings, live sessions, billing, payments, and analytics.

## Features
- 9 interactive pages
- Real-time slot availability grid
- Live parking session timer with running bill
- Automatic bill calculation via database triggers
- Analytics dashboard with 4 charts
- Light + dark mode
- Works offline (mock data) and online (real PostgreSQL)

## Tech Stack
- Frontend: HTML, CSS, JavaScript (vanilla)
- Backend: Python Flask + psycopg2
- Database: PostgreSQL
- Icons: Lucide
- Charts: Chart.js

## Quick Start
See [SETUP_GUIDE.md](SETUP_GUIDE.md)

For a no-install preview, open `docs/index.html?mode=mock` in a browser. Demo data is kept in the browser only.

## Live Demo
Hosted on GitHub Pages: https://vipin280720081157-08.github.io/urban-parking-management-system/

## How the two modes work
| Where it runs | Mode | Data source |
|---------------|------|-------------|
| GitHub Pages (`*.github.io`) | MOCK | Sample data stored in the browser |
| Local machine | REAL | Flask API at `http://localhost:5000/api` and PostgreSQL |

Add `?mode=mock` or `?mode=real` to any page address to switch (remembered in that browser).

## Folder Structure
```
urban-parking-management-system/
├── docs/                 Frontend (GitHub Pages root)
│   ├── *.html            9 pages
│   ├── css/style.css
│   ├── js/               config, theme, api, mock-data, ui + one file per page
│   └── assets/           logo, favicon, diagrams
├── backend/              Flask API (app.py, db.py, routes/)
├── database/             7 SQL scripts (schema to report queries)
├── report/               Report + screenshots folder
├── README.md  SETUP_GUIDE.md  SCREENSHOT_GUIDE.md  GITHUB_PUSH_GUIDE.md
└── .gitignore
```

