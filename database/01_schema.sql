-- ============================================================
-- SmartPark - Schema (PostgreSQL 14+)
-- Database: urban_parking_db
-- Run order: 01 -> 07
-- ============================================================

DROP TABLE IF EXISTS slots_log      CASCADE;
DROP TABLE IF EXISTS reviews        CASCADE;
DROP TABLE IF EXISTS payments       CASCADE;
DROP TABLE IF EXISTS bookings       CASCADE;
DROP TABLE IF EXISTS pricing_rules  CASCADE;
DROP TABLE IF EXISTS staff          CASCADE;
DROP TABLE IF EXISTS parking_slots  CASCADE;
DROP TABLE IF EXISTS parking_lots   CASCADE;
DROP TABLE IF EXISTS vehicles       CASCADE;
DROP TABLE IF EXISTS users          CASCADE;

CREATE TABLE users (
    user_id     SERIAL PRIMARY KEY,
    full_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(120) NOT NULL UNIQUE,
    phone       VARCHAR(15)  NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    vehicle_id     SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type   VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('2W','4W','EV')),
    model          VARCHAR(60),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parking_lots (
    lot_id      SERIAL PRIMARY KEY,
    lot_name    VARCHAR(100) NOT NULL,
    address     VARCHAR(200),
    city        VARCHAR(60)  NOT NULL,
    total_slots INT  NOT NULL CHECK (total_slots > 0),
    open_time   TIME NOT NULL,
    close_time  TIME NOT NULL
);

CREATE TABLE parking_slots (
    slot_id     SERIAL PRIMARY KEY,
    lot_id      INT NOT NULL REFERENCES parking_lots(lot_id) ON DELETE CASCADE,
    slot_number VARCHAR(10) NOT NULL,
    floor       VARCHAR(10),
    slot_type   VARCHAR(10) NOT NULL CHECK (slot_type IN ('2W','4W','EV')),
    status      VARCHAR(15) NOT NULL DEFAULT 'available'
                CHECK (status IN ('available','occupied','maintenance')),
    UNIQUE (lot_id, slot_number)
);

CREATE TABLE staff (
    staff_id   SERIAL PRIMARY KEY,
    lot_id     INT REFERENCES parking_lots(lot_id) ON DELETE SET NULL,
    full_name  VARCHAR(100) NOT NULL,
    role       VARCHAR(40),
    phone      VARCHAR(15),
    shift      VARCHAR(15) CHECK (shift IN ('morning','evening','night'))
);

CREATE TABLE pricing_rules (
    rule_id                   SERIAL PRIMARY KEY,
    vehicle_type              VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('2W','4W','EV')),
    rate_per_hour             NUMERIC(8,2) NOT NULL CHECK (rate_per_hour > 0),
    daily_max                 NUMERIC(8,2) NOT NULL,
    grace_minutes             INT DEFAULT 10,
    ev_surcharge              NUMERIC(8,2) DEFAULT 0,
    overtime_penalty_per_hour NUMERIC(8,2) DEFAULT 0,
    effective_from            DATE DEFAULT CURRENT_DATE
);

CREATE TABLE bookings (
    booking_id     SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(user_id),
    vehicle_id     INT NOT NULL REFERENCES vehicles(vehicle_id),
    slot_id        INT NOT NULL REFERENCES parking_slots(slot_id),
    entry_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_time      TIMESTAMP NULL,
    booking_type   VARCHAR(15) NOT NULL DEFAULT 'walk_in' CHECK (booking_type IN ('walk_in','pre_book')),
    booking_status VARCHAR(15) NOT NULL DEFAULT 'active' CHECK (booking_status IN ('active','completed','cancelled')),
    total_amount   NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE payments (
    payment_id     SERIAL PRIMARY KEY,
    booking_id     INT NOT NULL UNIQUE REFERENCES bookings(booking_id) ON DELETE CASCADE,
    amount         NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    payment_mode   VARCHAR(10) NOT NULL CHECK (payment_mode IN ('cash','upi','card','wallet')),
    payment_status VARCHAR(15) NOT NULL DEFAULT 'success' CHECK (payment_status IN ('pending','success','failed')),
    paid_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    review_id  SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lot_id     INT NOT NULL REFERENCES parking_lots(lot_id) ON DELETE CASCADE,
    rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slots_log (
    log_id     SERIAL PRIMARY KEY,
    slot_id    INT NOT NULL REFERENCES parking_slots(slot_id) ON DELETE CASCADE,
    old_status VARCHAR(15),
    new_status VARCHAR(15),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(40) DEFAULT 'SYSTEM'
);
