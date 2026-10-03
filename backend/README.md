# SmartPark API

Flask + psycopg2 REST API for SmartPark. Base URL: `http://localhost:5000/api`

## Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate      Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # then edit DB_PASSWORD
python app.py
```
The database scripts in `../database` (01 to 07) must be run first.

## Response format
Success: `{"success": true, "data": ...}`  Failure: `{"success": false, "error": "..."}`

## Try it
```bash
curl http://localhost:5000/
curl http://localhost:5000/api/users
curl "http://localhost:5000/api/lots/search?city=Coimbatore&type=4W&duration=2"
curl "http://localhost:5000/api/slots/available?lot_id=1&type=4W"
curl -X POST http://localhost:5000/api/bookings -H "Content-Type: application/json" \
  -d '{"user_id":1,"vehicle_id":1,"slot_id":5,"booking_type":"walk_in"}'
curl -X PUT http://localhost:5000/api/bookings/7/exit
curl -X POST http://localhost:5000/api/payments -H "Content-Type: application/json" \
  -d '{"booking_id":7,"payment_mode":"upi"}'
curl http://localhost:5000/api/reports/summary
```

## Endpoints
Users, vehicles, lots, slots: full CRUD. Bookings: `POST /bookings`, `GET /bookings?user_id=`,
`GET /bookings/active`, `GET /bookings/<id>`, `PUT /bookings/<id>/exit`, `DELETE /bookings/<id>`.
Payments: `POST /payments`, `GET /payments/<booking_id>`. Reviews: `POST /reviews`, `GET /reviews?lot_id=|user_id=`.
Reports: `/reports/summary|revenue|peak-hours|vehicle-split|utilization|top-users`.
