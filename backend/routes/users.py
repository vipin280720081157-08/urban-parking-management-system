from flask import Blueprint
from db import query
from routes import ok, fail, body

bp = Blueprint("users", __name__)


@bp.get("/users")
def list_users():
    return ok(query("SELECT * FROM users ORDER BY user_id"))


@bp.post("/users")
def create_user():
    d = body(["full_name", "email", "phone"])
    row = query("INSERT INTO users (full_name, email, phone) VALUES (%s,%s,%s) RETURNING *",
                (d["full_name"].strip(), d["email"].strip(), d["phone"].strip()), "one")
    return ok(row, 201)


@bp.get("/users/<int:uid>")
def get_user(uid):
    row = query("SELECT * FROM users WHERE user_id=%s", (uid,), "one")
    return ok(row) if row else fail("User not found", 404)


@bp.put("/users/<int:uid>")
def update_user(uid):
    d = body(["full_name", "email", "phone"])
    row = query("UPDATE users SET full_name=%s, email=%s, phone=%s WHERE user_id=%s RETURNING *",
                (d["full_name"], d["email"], d["phone"], uid), "one")
    return ok(row) if row else fail("User not found", 404)


@bp.delete("/users/<int:uid>")
def delete_user(uid):
    row = query("DELETE FROM users WHERE user_id=%s RETURNING user_id", (uid,), "one")
    return ok({"deleted": uid}) if row else fail("User not found", 404)
