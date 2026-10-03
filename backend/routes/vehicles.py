from flask import Blueprint, request
from db import query
from routes import ok, fail, body

bp = Blueprint("vehicles", __name__)


@bp.get("/vehicles")
def list_vehicles():
    uid = request.args.get("user_id")
    if uid:
        rows = query("SELECT * FROM vehicles WHERE user_id=%s ORDER BY vehicle_id", (uid,))
    else:
        rows = query("SELECT * FROM vehicles ORDER BY vehicle_id")
    return ok(rows)


@bp.post("/vehicles")
def create_vehicle():
    d = body(["user_id", "vehicle_number", "vehicle_type"])
    row = query("""INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, model)
                   VALUES (%s,%s,%s,%s) RETURNING *""",
                (d["user_id"], d["vehicle_number"].strip().upper(), d["vehicle_type"], d.get("model")), "one")
    return ok(row, 201)


@bp.put("/vehicles/<int:vid>")
def update_vehicle(vid):
    d = body(["vehicle_number", "vehicle_type"])
    row = query("""UPDATE vehicles SET vehicle_number=%s, vehicle_type=%s, model=%s
                   WHERE vehicle_id=%s RETURNING *""",
                (d["vehicle_number"].strip().upper(), d["vehicle_type"], d.get("model"), vid), "one")
    return ok(row) if row else fail("Vehicle not found", 404)


@bp.delete("/vehicles/<int:vid>")
def delete_vehicle(vid):
    row = query("DELETE FROM vehicles WHERE vehicle_id=%s RETURNING vehicle_id", (vid,), "one")
    return ok({"deleted": vid}) if row else fail("Vehicle not found", 404)
