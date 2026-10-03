# SmartPark — Screenshot Guide

Capture these screenshots with the app running locally (see SETUP_GUIDE.md). Use a **1440 × 900** browser window at 100% zoom and save every image into `report/screenshots/`.

| # | Filename | Page | What must be visible | Mode |
|---|----------|------|----------------------|------|
| 1 | `01-home.png` | Home | Hero card, selected user in the picker, all 6 stat cards, module cards | Light |
| 2 | `02-vehicles.png` | My Vehicles | Add-vehicle form on the left, vehicle table with badges and action icons | Light |
| 3 | `03-search.png` | Search Parking | Filter bar and at least 3 lot cards with free slots, rate and rating | Light |
| 4 | `04-slots.png` | Slot Map | Legend, slot grid with all colours, one slot selected, bottom confirm bar | Dark |
| 5 | `05-booking.png` | Booking Confirmation | Full receipt card with Start Session and Cancel buttons | Light |
| 6 | `06-session.png` | Live Session | Running timer, running bill, lot and slot details, both buttons | Dark |
| 7 | `07-bill.png` | Bill & Payment | Itemised invoice, total, four payment modes, Pay button | Light |
| 8 | `08-history.png` | My History | Four summary cards and the bookings table with status badges | Light |
| 9 | `09-reports.png` | Admin Reports | KPI cards, all 4 charts, top-5 users table (scroll or zoom out to 80%) | Dark |

## Extra screenshots
- **ER diagram from pgAdmin:** right-click `urban_parking_db` → *ERD For Database*, then save as `10-pgadmin-erd.png`.
- **GitHub repository:** open the repo page with the repository name visible and save as `11-github-repo.png`.

## Tips
- Make a booking first so the Live Session and Bill pages have data.
- Press F12 and check the console is clean before capturing.
- Use *Ctrl + Shift + P → "Capture full size screenshot"* in Chrome DevTools for long pages.
