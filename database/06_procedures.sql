-- SmartPark - Stored functions

-- 1. Book a slot (availability check + insert + mark occupied, one transaction)
CREATE OR REPLACE FUNCTION fn_book_slot(p_user_id INT, p_vehicle_id INT, p_slot_id INT,
                                        p_booking_type VARCHAR DEFAULT 'walk_in')
RETURNS INT AS $$
DECLARE
    v_status VARCHAR(15);
    v_slot_type VARCHAR(10);
    v_veh_type VARCHAR(10);
    v_id INT;
BEGIN
    SELECT status, slot_type INTO v_status, v_slot_type
    FROM parking_slots WHERE slot_id = p_slot_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Slot % does not exist', p_slot_id; END IF;
    IF v_status <> 'available' THEN RAISE EXCEPTION 'Slot is not available (%).', v_status; END IF;

    SELECT vehicle_type INTO v_veh_type FROM vehicles
    WHERE vehicle_id = p_vehicle_id AND user_id = p_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Vehicle does not belong to this user'; END IF;
    IF v_veh_type <> v_slot_type THEN
        RAISE EXCEPTION 'Vehicle type % does not match slot type %', v_veh_type, v_slot_type;
    END IF;

    INSERT INTO bookings (user_id, vehicle_id, slot_id, booking_type)
    VALUES (p_user_id, p_vehicle_id, p_slot_id, p_booking_type)
    RETURNING booking_id INTO v_id;

    UPDATE parking_slots SET status = 'occupied' WHERE slot_id = p_slot_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Exit and bill (the auto-bill trigger computes the amount and frees the slot)
CREATE OR REPLACE FUNCTION fn_exit_and_bill(p_booking_id INT)
RETURNS NUMERIC AS $$
DECLARE v_amount NUMERIC(10,2);
BEGIN
    UPDATE bookings SET exit_time = NOW(), booking_status = 'completed'
    WHERE booking_id = p_booking_id AND booking_status = 'active'
    RETURNING total_amount INTO v_amount;
    IF NOT FOUND THEN RAISE EXCEPTION 'Booking % is not active', p_booking_id; END IF;
    RETURN v_amount;
END;
$$ LANGUAGE plpgsql;

-- 3. Daily report for one date
CREATE OR REPLACE FUNCTION fn_generate_daily_report(p_date DATE)
RETURNS TABLE (lot_name VARCHAR, total_bookings BIGINT, total_revenue NUMERIC, avg_duration_minutes NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT l.lot_name, COUNT(*), COALESCE(SUM(b.total_amount),0),
           ROUND(AVG(EXTRACT(EPOCH FROM (b.exit_time - b.entry_time)) / 60)::numeric, 1)
    FROM bookings b
    JOIN parking_slots s ON s.slot_id = b.slot_id
    JOIN parking_lots l  ON l.lot_id = s.lot_id
    WHERE b.booking_status = 'completed' AND DATE(b.exit_time) = p_date
    GROUP BY l.lot_name;
END;
$$ LANGUAGE plpgsql;
