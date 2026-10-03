from flask import Blueprint, request
from db import query
from routes import ok, fail, body

bp = Blueprint("lots", __name__)

# Lot list with free slots, average rating and review count.
LOT_SQL = """
SELECT l.*,
       COUNT(s.slot_id) FILTER (WHERE s.status='available') AS free_slots,
       COALESCE((SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.lot_id=l.lot_id),0) AS avg_rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.lot_id=l.lot_id) AS review_count
FROM parking_lots l LEFT JOIN parking_slots s ON s.lot_id=l.lot_id
{where}
GROUP BY l.lot_id ORDER BY l.lot_id
"""


@bp.get("/lots")
def list_lots():
    return ok(query(LOT_SQL.format(where="")))


@bp.get("/lots/search")
def search_lots():
    """Filter by city, vehicle type and duration (hours)."""
    city = request.args.get("city") or ""
    vtype = request.args.get("type") or ""
    hours = float(request.args.get("duration") or 1)
    rows = query("""
        SELECT l.*,
               COUNT(s.slot_id) FILTER (WHERE s.status='available'
                     AND (%(t)s='' OR s.slot_type=%(t)s)) AS free_slots,
               COALESCE((SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.lot_id=l.lot_id),0) AS avg_rating,
               (SELECT COUNT(*) FROM reviews r WHERE r.lot_id=l.lot_id) AS review_count
        FROM parking_lots l LEFT JOIN parking_slots s ON s.lot_id=l.lot_id
        WHERE (%(c)s='' OR LOWER(l.city)=LOWER(%(c)s))
        GROUP BY l.lot_id ORDER BY free_slots DESC, l.lot_name
    """, {"c": city, "t": vtype})
    rules = {r["vehicle_type"]: r for r in query(
        """SELECT DISTINCT ON (vehicle_type) * FROM pricing_rules
           WHERE effective_from <= CURRENT_DATE ORDER BY vehicle_type, effective_from DESC""")}
    for r in rows:
        rule = rules.get(vtype or "4W")
        if rule:
            est = min(float(rule["rate_per_hour"]) * hours, float(rule["daily_max"]))
            if (vtype or "4W") == "EV":
                est += float(rule["ev_surcharge"])
            r["rate_per_hour"] = float(rule["rate_per_hour"])
            r["estimated_cost"] = round(est, 2)
    return ok(rows)


@bp.post("/lots")
def create_lot():
    d = body(["lot_name", "city", "total_slots", "open_time", "close_time"])
    row = query("""INSERT INTO parking_lots (lot_name,address,city,total_slots,open_time,close_time)
                   VALUES (%s,%s,%s,%s,%s,%s) RETURNING *""",
                (d["lot_name"], d.get("address"), d["city"], d["total_slots"], d["open_time"], d["close_time"]), "one")
    return ok(row, 201)


@bp.put("/lots/<int:lid>")
def update_lot(lid):
    d = body(["lot_name", "city", "total_slots", "open_time", "close_time"])
    row = query("""UPDATE parking_lots SET lot_name=%s,address=%s,city=%s,total_slots=%s,open_time=%s,close_time=%s
                   WHERE lot_id=%s RETURNING *""",
                (d["lot_name"], d.get("address"), d["city"], d["total_slots"], d["open_time"], d["close_time"], lid), "one")
    return ok(row) if row else fail("Lot not found", 404)


@bp.delete("/lots/<int:lid>")
def delete_lot(lid):
    row = query("DELETE FROM parking_lots WHERE lot_id=%s RETURNING lot_id", (lid,), "one")
    return ok({"deleted": lid}) if row else fail("Lot not found", 404)
