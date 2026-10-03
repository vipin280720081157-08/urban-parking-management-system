-- SmartPark - Indexes on frequently queried columns
CREATE INDEX idx_vehicles_user        ON vehicles(user_id);
CREATE INDEX idx_slots_lot_status     ON parking_slots(lot_id, status);
CREATE INDEX idx_bookings_user        ON bookings(user_id);
CREATE INDEX idx_bookings_slot_status ON bookings(slot_id, booking_status);
CREATE INDEX idx_bookings_entry       ON bookings(entry_time);
CREATE INDEX idx_payments_booking     ON payments(booking_id);
CREATE INDEX idx_logs_slot            ON slots_log(slot_id);
