"""SmartPark API - Flask application entry point."""
import os
import datetime
import decimal

import psycopg2
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS

load_dotenv()


class SmartJSONProvider(DefaultJSONProvider):
    """Send Decimal as numbers and dates/times as ISO text."""

    @staticmethod
    def default(o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        if isinstance(o, (datetime.datetime, datetime.date, datetime.time)):
            return o.isoformat()
        return DefaultJSONProvider.default(o)


app = Flask(__name__)
app.json = SmartJSONProvider(app)
CORS(app)  # allow all origins (local development)

from routes.users import bp as users_bp
from routes.vehicles import bp as vehicles_bp
from routes.lots import bp as lots_bp
from routes.slots import bp as slots_bp
from routes.bookings import bp as bookings_bp
from routes.payments import bp as payments_bp
from routes.reviews import bp as reviews_bp
from routes.reports import bp as reports_bp

for blueprint in (users_bp, vehicles_bp, lots_bp, slots_bp,
                  bookings_bp, payments_bp, reviews_bp, reports_bp):
    app.register_blueprint(blueprint, url_prefix="/api")


@app.route("/")
def index():
    return jsonify({"status": "SmartPark API running"})


@app.errorhandler(Exception)
def handle_error(err):
    """Return every error as JSON in the standard envelope."""
    from werkzeug.exceptions import HTTPException
    if isinstance(err, HTTPException):
        return jsonify({"success": False, "error": err.description}), err.code
    if isinstance(err, ValueError):
        return jsonify({"success": False, "error": str(err)}), 400
    if isinstance(err, psycopg2.errors.UniqueViolation):
        return jsonify({"success": False, "error": "That value already exists (duplicate)."}), 409
    if isinstance(err, psycopg2.errors.ForeignKeyViolation):
        return jsonify({"success": False, "error": "This record is linked to other data and cannot be changed or deleted."}), 409
    if isinstance(err, psycopg2.errors.CheckViolation):
        return jsonify({"success": False, "error": "A value is outside the allowed range."}), 400
    if isinstance(err, psycopg2.Error):
        msg = getattr(err.diag, "message_primary", None) or str(err)
        return jsonify({"success": False, "error": msg}), 400
    return jsonify({"success": False, "error": str(err)}), 500


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", os.getenv("PORT", "5000")))
    app.run(host="0.0.0.0", port=port, debug=True)
