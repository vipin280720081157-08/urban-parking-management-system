-- SmartPark - Triggers

-- 1. Log every slot status change
CREATE OR REPLACE FUNCTION fn_log_slot_status() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO slots_log (slot_id, old_status, new_status, changed_by)
        VALUES (NEW.slot_id, OLD.status, NEW.status,
                COALESCE(NULLIF(current_setting('smartpark.changed_by', true), ''), 'SYSTEM'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_slot_status ON parking_slots;
CREATE TRIGGER trg_log_slot_status
AFTER UPDATE ON parking_slots
FOR EACH ROW EXECUTE FUNCTION fn_log_slot_status();

-- 2. Auto-bill when a booking is completed, and free the slot
CREATE OR REPLACE FUNCTION fn_auto_bill_on_exit() RETURNS TRIGGER AS $$
DECLARE
    v_type     VARCHAR(10);
    r          pricing_rules%ROWTYPE;
    v_minutes  NUMERIC;
    v_hours    INT;
    v_base     NUMERIC(10,2);
BEGIN
    IF NEW.exit_time IS NOT NULL AND NEW.booking_status = 'completed'
       AND OLD.booking_status = 'active' THEN

        SELECT vehicle_type INTO v_type FROM vehicles WHERE vehicle_id = NEW.vehicle_id;

        SELECT * INTO r FROM pricing_rules
        WHERE vehicle_type = v_type AND effective_from <= CURRENT_DATE
        ORDER BY effective_from DESC, rule_id DESC LIMIT 1;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'No pricing rule found for vehicle type %', v_type;
        END IF;

        v_minutes := EXTRACT(EPOCH FROM (NEW.exit_time - NEW.entry_time)) / 60;

        IF v_minutes <= r.grace_minutes THEN
            NEW.total_amount := 0;
        ELSE
            v_hours := CEIL(v_minutes / 60.0);
            v_base  := v_hours * r.rate_per_hour;
            IF v_base > r.daily_max THEN v_base := r.daily_max; END IF;
            IF v_type = 'EV' THEN v_base := v_base + r.ev_surcharge; END IF;
            NEW.total_amount := v_base;
        END IF;

        UPDATE parking_slots SET status = 'available' WHERE slot_id = NEW.slot_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_bill_on_exit ON bookings;
CREATE TRIGGER trg_auto_bill_on_exit
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_auto_bill_on_exit();

-- 3. Reject a booking when the slot already has an active booking
CREATE OR REPLACE FUNCTION fn_prevent_double_booking() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_status = 'active' AND EXISTS (
        SELECT 1 FROM bookings
        WHERE slot_id = NEW.slot_id AND booking_status = 'active'
    ) THEN
        RAISE EXCEPTION 'Slot % already has an active booking', NEW.slot_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON bookings;
CREATE TRIGGER trg_prevent_double_booking
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_prevent_double_booking();
