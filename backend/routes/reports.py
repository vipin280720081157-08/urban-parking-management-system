from flask import Blueprint
from db import query
from routes import ok

bp = Blueprint("reports", __name__)


@bp.get("/reports/summary")
def summary():
    row = query("""
        SELECT (SELECT COUNT(*) FROM parking_lots) AS total_lots,
               (SELECT COUNT(*) FROM parking_slots WHERE status='available') AS free_slots,
               (SELECT COUNT(*) FROM bookings WHERE booking_status='active') AS active_bookings,
               (SELECT COALESCE(SUM(total_amount),0) FROM bookings
                  WHERE booking_status='completed' AND DATE(exit_time)=CURRENT_DATE) AS today_revenue,
               (SELECT COUNT(*) FROM users) AS total_users,
               (SELECT COALESCE(ROUND(AVG(rating),1),0) FROM reviews) AS avg_rating,
               (SELECT COUNT(*) FROM bookings) AS total_bookings,
               (SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (exit_time-entry_time))/60)),0)
                  FROM bookings WHERE booking_status='completed') AS avg_duration,
               (SELECT COUNT(*) FROM payments WHERE payment_status='pending') AS pending_payments
    """, fetch="one")
    return ok(row)


@bp.get("/reports/revenue")
def revenue():
    return ok(query("""SELECT l.lot_name, DATE(b.exit_time) AS day, SUM(b.total_amount) AS revenue
        FROM bookings b JOIN parking_slots s ON s.slot_id=b.slot_id JOIN parking_lots l ON l.lot_id=s.lot_id
        WHERE b.booking_status='completed'
        GROUP BY l.lot_name, DATE(b.exit_time) ORDER BY day DESC, revenue DESC"""))


@bp.get("/reports/peak-hours")
def peak_hours():
    return ok(query("""SELECT EXTRACT(HOUR FROM entry_time)::int AS hour_of_day, COUNT(*) AS bookings
                       FROM bookings GROUP BY 1 ORDER BY 1"""))


@bp.get("/reports/vehicle-split")
def vehicle_split():
    return ok(query("""SELECT v.vehicle_type, COUNT(*) AS bookings FROM bookings b
                       JOIN vehicles v ON v.vehicle_id=b.vehicle_id
                       GROUP BY v.vehicle_type ORDER BY bookings DESC"""))


@bp.get("/reports/utilization")
def utilization():
    return ok(query("SELECT lot_name, total_slots, occupied_slots, utilization_pct FROM v_slot_utilization ORDER BY lot_name"))


@bp.get("/reports/top-users")
def top_users():
    return ok(query("""SELECT u.full_name, COUNT(b.booking_id) AS bookings, SUM(b.total_amount) AS total_spent
        FROM users u JOIN bookings b ON b.user_id=u.user_id WHERE b.booking_status='completed'
        GROUP BY u.user_id, u.full_name ORDER BY total_spent DESC LIMIT 5"""))
