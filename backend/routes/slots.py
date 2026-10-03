from flask import Blueprint, request
from db import query, transaction
from routes import ok, fail, body

bp = Blueprint("slots", __name__)

SYNC_TOTAL = "UPDATE parking_lots SET total_slots=GREATEST((SELECT COUNT(*) FROM parking_slots WHERE lot_id=%s),1) WHERE lot_id=%s"


@bp.get("/slots")
def list_slots():
    lot_id = request.args.get("lot_id")
    if lot_id:
        rows = query("SELECT * FROM parking_slots WHERE lot_id=%s ORDER BY floor, slot_number", (lot_id,))
    else:
        rows = query("SELECT * FROM parking_slots ORDER BY lot_id, floor, slot_number")
    return ok(rows)


@bp.get("/slots/available")
def available_slots():
    lot_id = request.args.get("lot_id")
    vtype = request.args.get("type") or ""
    rows = query("""SELECT * FROM parking_slots WHERE status='available'
                    AND (%s IS NULL OR lot_id=%s) AND (%s='' OR slot_type=%s)
                    ORDER BY floor, slot_number""", (lot_id, lot_id, vtype, vtype))
    return ok(rows)


@bp.post("/slots")
def create_slot():
    d = body(["lot_id", "slot_number", "slot_type"])
    res = transaction([
        ("""INSERT INTO parking_slots (lot_id,slot_number,floor,slot_type)
            VALUES (%s,%s,%s,%s) RETURNING *""",
         (d["lot_id"], d["slot_number"], d.get("floor"), d["slot_type"]), "one"),
        (SYNC_TOTAL, (d["lot_id"], d["lot_id"]), None),
    ])
    return ok(res[0], 201)


@bp.put("/slots/<int:sid>")
def update_slot(sid):
    d = body(["status"])
    row = query("UPDATE parking_slots SET status=%s WHERE slot_id=%s RETURNING *", (d["status"], sid), "one")
    return ok(row) if row else fail("Slot not found", 404)


@bp.delete("/slots/<int:sid>")
def delete_slot(sid):
    slot = query("SELECT lot_id FROM parking_slots WHERE slot_id=%s", (sid,), "one")
    if not slot:
        return fail("Slot not found", 404)
    transaction([
        ("DELETE FROM parking_slots WHERE slot_id=%s", (sid,), None),
        (SYNC_TOTAL, (slot["lot_id"], slot["lot_id"]), None),
    ])
    return ok({"deleted": sid})
