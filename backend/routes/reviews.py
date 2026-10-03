from flask import Blueprint, request
from db import query
from routes import ok, body

bp = Blueprint("reviews", __name__)


@bp.post("/reviews")
def create_review():
    d = body(["user_id", "lot_id", "rating"])
    row = query("""INSERT INTO reviews (user_id, lot_id, rating, comment)
                   VALUES (%s,%s,%s,%s) RETURNING *""",
                (d["user_id"], d["lot_id"], d["rating"], d.get("comment")), "one")
    return ok(row, 201)


@bp.get("/reviews")
def list_reviews():
    lot_id, uid = request.args.get("lot_id"), request.args.get("user_id")
    rows = query("""SELECT r.*, u.full_name, l.lot_name FROM reviews r
                    JOIN users u ON u.user_id=r.user_id JOIN parking_lots l ON l.lot_id=r.lot_id
                    WHERE (%s IS NULL OR r.lot_id=%s) AND (%s IS NULL OR r.user_id=%s)
                    ORDER BY r.created_at DESC""", (lot_id, lot_id, uid, uid))
    return ok(rows)
