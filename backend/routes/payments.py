from flask import Blueprint
from db import query
from routes import ok, fail, body

bp = Blueprint("payments", __name__)


@bp.post("/payments")
def create_payment():
    d = body(["booking_id", "payment_mode"])
    b = query("SELECT booking_status, total_amount FROM bookings WHERE booking_id=%s", (d["booking_id"],), "one")
    if not b:
        return fail("Booking not found", 404)
    if b["booking_status"] != "completed":
        return fail("Booking must be completed before payment")
    # A pending record (if any) is completed; an already successful one is rejected.
    row = query("""INSERT INTO payments (booking_id, amount, payment_mode, payment_status)
                   VALUES (%s,%s,%s,'success')
                   ON CONFLICT (booking_id) DO UPDATE
                     SET payment_mode=EXCLUDED.payment_mode, payment_status='success',
                         amount=EXCLUDED.amount, paid_at=CURRENT_TIMESTAMP
                     WHERE payments.payment_status <> 'success'
                   RETURNING *""",
                (d["booking_id"], b["total_amount"], d["payment_mode"]), "one")
    if not row:
        return fail("This booking has already been paid", 409)
    return ok(row, 201)


@bp.get("/payments/<int:booking_id>")
def get_payment(booking_id):
    return ok(query("SELECT * FROM payments WHERE booking_id=%s", (booking_id,), "one"))
