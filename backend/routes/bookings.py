from flask import Blueprint, request
from db import query, transaction
from routes import ok, fail, body

bp = Blueprint("bookings", __name__)

# Booking with user, vehicle, slot, lot, payment status and the pricing rule used.
BOOKING_SQL = """
SELECT b.booking_id, b.user_id, b.vehicle_id, b.slot_id, b.entry_time, b.exit_time,
       b.booking_type, b.booking_status, b.total_amount,
       u.full_name, v.vehicle_number, v.vehicle_type,
       s.slot_number, s.floor, l.lot_id, l.lot_name, l.city,
       p.payment_status, p.payment_mode,
       pr.rate_per_hour, pr.daily_max, pr.grace_minutes, pr.ev_surcharge,
       ROUND(EXTRACT(EPOCH FROM (COALESCE(b.exit_time, NOW()) - b.entry_time)) / 60) AS duration_minutes,
       EXISTS (SELECT 1 FROM reviews r WHERE r.user_id=b.user_id AND r.lot_id=l.lot_id) AS reviewed
FROM bookings b
JOIN users u         ON u.user_id = b.user_id
JOIN vehicles v      ON v.vehicle_id = b.vehicle_id
JOIN parking_slots s ON s.slot_id = b.slot_id
JOIN parking_lots l  ON l.lot_id = s.lot_id
LEFT JOIN payments p ON p.booking_id = b.booking_id
LEFT JOIN LATERAL (SELECT * FROM pricing_rules x WHERE x.vehicle_type = v.vehicle_type
                   AND x.effective_from <= CURRENT_DATE
                   ORDER BY x.effective_from DESC, x.rule_id DESC LIMIT 1) pr ON TRUE
"""


@bp.post("/bookings")
def create_booking():
    d = body(["user_id", "vehicle_id", "slot_id"])
    row = query("SELECT fn_book_slot(%s,%s,%s,%s) AS booking_id",
                (d["user_id"], d["vehicle_id"], d["slot_id"], d.get("booking_type", "walk_in")), "one")
    full = query(BOOKING_SQL + " WHERE b.booking_id=%s", (row["booking_id"],), "one")
    return ok(full, 201)


@bp.get("/bookings")
def list_bookings():
    uid = request.args.get("user_id")
    if uid:
        rows = query(BOOKING_SQL + " WHERE b.user_id=%s ORDER BY b.entry_time DESC", (uid,))
    else:
        rows = query(BOOKING_SQL + " ORDER BY b.entry_time DESC")
    return ok(rows)


@bp.get("/bookings/active")
def active_bookings():
    uid = request.args.get("user_id")
    rows = query(BOOKING_SQL + " WHERE b.booking_status='active' AND (%s IS NULL OR b.user_id=%s) ORDER BY b.entry_time DESC",
                 (uid, uid))
    return ok(rows)


@bp.get("/bookings/<int:bid>")
def get_booking(bid):
    row = query(BOOKING_SQL + " WHERE b.booking_id=%s", (bid,), "one")
    return ok(row) if row else fail("Booking not found", 404)


@bp.put("/bookings/<int:bid>/exit")
def exit_booking(bid):
    query("SELECT fn_exit_and_bill(%s) AS amount", (bid,), "one")
    return ok(query(BOOKING_SQL + " WHERE b.booking_id=%s", (bid,), "one"))


@bp.delete("/bookings/<int:bid>")
def cancel_booking(bid):
    b = query("SELECT slot_id, booking_status FROM bookings WHERE booking_id=%s", (bid,), "one")
    if not b:
        return fail("Booking not found", 404)
    if b["booking_status"] != "active":
        return fail("Only active bookings can be cancelled")
    transaction([
        ("UPDATE bookings SET booking_status='cancelled', exit_time=NOW(), total_amount=0 WHERE booking_id=%s", (bid,), None),
        ("UPDATE parking_slots SET status='available' WHERE slot_id=%s", (b["slot_id"],), None),
    ])
    return ok({"cancelled": bid})
