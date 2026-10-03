"""Shared response helpers for all route modules."""
from flask import jsonify, request


def ok(data=None, status=200):
    return jsonify({"success": True, "data": data}), status


def fail(message, status=400):
    return jsonify({"success": False, "error": message}), status


def body(required=()):
    """Return the JSON body; abort with a clear message when fields are missing."""
    data = request.get_json(silent=True) or {}
    missing = [f for f in required if data.get(f) in (None, "")]
    if missing:
        raise ValueError("Missing required field(s): " + ", ".join(missing))
    return data
