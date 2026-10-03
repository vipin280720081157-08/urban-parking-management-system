-- SmartPark - Views

-- 1. Free slot count per lot and vehicle type (drives the Search page)
CREATE OR REPLACE VIEW v_available_slots AS
SELECT l.lot_id, l.lot_name, l.city, s.slot_type,
       COUNT(*) FILTER (WHERE s.status = 'available') AS available_slots
FROM parking_lots l
JOIN parking_slots s ON s.lot_id = l.lot_id
GROUP BY l.lot_id, l.lot_name, l.city, s.slot_type;

-- 2. Every active booking with user, vehicle, slot, lot and elapsed time
CREATE OR REPLACE VIEW v_active_bookings AS
SELECT b.booking_id, u.full_name, v.vehicle_number, s.slot_number,
       l.lot_name, b.entry_time,
       ROUND(EXTRACT(EPOCH FROM (NOW() - b.entry_time)) / 60) AS elapsed_minutes
FROM bookings b
JOIN users u         ON u.user_id = b.user_id
JOIN vehicles v      ON v.vehicle_id = b.vehicle_id
JOIN parking_slots s ON s.slot_id = b.slot_id
JOIN parking_lots l  ON l.lot_id = s.lot_id
WHERE b.booking_status = 'active';

-- 3. Daily revenue per lot from completed bookings
CREATE OR REPLACE VIEW v_revenue_summary AS
SELECT l.lot_id, l.lot_name, DATE(b.exit_time) AS revenue_date,
       COUNT(*) AS bookings_count, SUM(b.total_amount) AS revenue
FROM bookings b
JOIN parking_slots s ON s.slot_id = b.slot_id
JOIN parking_lots l  ON l.lot_id = s.lot_id
WHERE b.booking_status = 'completed'
GROUP BY l.lot_id, l.lot_name, DATE(b.exit_time);

-- 4. Utilization percentage per lot (occupied slots / total slots)
CREATE OR REPLACE VIEW v_slot_utilization AS
SELECT l.lot_id, l.lot_name,
       COUNT(s.slot_id) AS total_slots,
       COUNT(*) FILTER (WHERE s.status = 'occupied') AS occupied_slots,
       ROUND(100.0 * COUNT(*) FILTER (WHERE s.status = 'occupied') / NULLIF(COUNT(s.slot_id),0), 1) AS utilization_pct
FROM parking_lots l
LEFT JOIN parking_slots s ON s.lot_id = l.lot_id
GROUP BY l.lot_id, l.lot_name;
