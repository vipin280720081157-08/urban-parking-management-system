# SmartPark — Setup Guide

Follow these steps in order. Total time: about 20 minutes.

1. **Install Python 3.10 or newer** from https://www.python.org/downloads/ (on Windows tick "Add Python to PATH"). Check with `python --version`.
2. **Install PostgreSQL 14 or newer and pgAdmin 4** from https://www.postgresql.org/download/. Remember the password you set for the `postgres` user.
3. **Create the database.** Open pgAdmin, right-click *Databases* → *Create* → *Database*, name it `urban_parking_db`, and save.
4. **Run the SQL files in order.** In pgAdmin right-click `urban_parking_db` → *Query Tool*, open each file from the `database` folder and press **Execute (F5)**:
   `01_schema.sql` → `02_sample_data.sql` → `03_indexes.sql` → `04_views.sql` → `05_triggers.sql` → `06_procedures.sql` → `07_report_queries.sql`
5. **Open a terminal** and go to the backend folder: `cd backend`
6. **Create a virtual environment:** `python -m venv venv`
7. **Activate it.**
   - Windows: `venv\Scripts\activate`
   - Mac / Linux: `source venv/bin/activate`
8. **Install dependencies:** `pip install -r requirements.txt`
9. **Create your settings file.** Copy `.env.example` to `.env` (Windows: `copy .env.example .env`; Mac/Linux: `cp .env.example .env`) and set `DB_PASSWORD` to your PostgreSQL password.
10. **Start the server:** `python app.py` — you should see it running on port 5000. Visiting http://localhost:5000 shows `{"status": "SmartPark API running"}`.
11. **Open the app.** Open `docs/index.html` in your browser (double-click it). Keep the terminal running.
12. **Everything should work now.** Pick a user on the home page and follow the flow: Vehicles → Search → Slot Map → Booking → Live Session → Bill → History → Reports.

## Troubleshooting
- *"Cannot reach the SmartPark server"* — the backend is not running, or the port differs. Check step 10.
- *password authentication failed* — fix `DB_PASSWORD` in `backend/.env`.
- *Pages show demo data* — the address contains `?mode=mock`. Open the page once with `?mode=real`.
- Re-running `01_schema.sql` deletes all data; run `02` to `06` again afterwards.
