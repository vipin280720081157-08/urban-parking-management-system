-- ============================================================
-- SmartPark - Sample data (run after 01_schema.sql)
-- Triggers are not yet installed, so slot status is set directly.
-- ============================================================

INSERT INTO users (full_name, email, phone) VALUES
 ('Arjun Krishnan',  'arjun.krishnan@example.com',  '9842012345'),
 ('Priya Natarajan', 'priya.natarajan@example.com', '9655123456'),
 ('Karthik Subramanian','karthik.s@example.com',    '9791023456'),
 ('Divya Ramesh',    'divya.ramesh@example.com',    '9944034567'),
 ('Suresh Kumar',    'suresh.kumar@example.com',    '9655045678');

INSERT INTO vehicles (user_id, vehicle_number, vehicle_type, model) VALUES
 (1,'TN-37-AB-1234','4W','Hyundai Creta'),
 (1,'TN-37-CD-5678','2W','Honda Activa'),
 (2,'TN-37-EF-2345','4W','Maruti Swift'),
 (2,'TN-37-GH-6789','EV','Tata Nexon EV'),
 (3,'TN-37-JK-3456','2W','Royal Enfield Classic 350'),
 (3,'TN-37-LM-7890','4W','Toyota Innova'),
 (4,'TN-37-NP-4567','EV','Ather 450X'),
 (5,'TN-37-QR-8901','4W','Honda City');

INSERT INTO parking_lots (lot_name, address, city, total_slots, open_time, close_time) VALUES
 ('RS Puram Central Parking',  'DB Road, RS Puram',            'Coimbatore', 20, '06:00', '23:00'),
 ('Gandhipuram Multi-Level',   'Cross Cut Road, Gandhipuram',  'Coimbatore', 20, '05:30', '23:30'),
 ('Peelamedu Tech Park Lot',   'Avinashi Road, Peelamedu',     'Coimbatore', 20, '06:00', '22:00'),
 ('Saibaba Colony Parking',    'NSR Road, Saibaba Colony',     'Coimbatore', 20, '07:00', '22:00');

-- 20 slots per lot: floor A = 1-10, floor B = 11-20
-- types: 1-3 2W, 4-8 4W, 9-10 EV (floor A); 11-13 2W, 14-18 4W, 19-20 EV (floor B)
INSERT INTO parking_slots (lot_id, slot_number, floor, slot_type)
SELECT l.lot_id,
       CASE WHEN n <= 10 THEN 'A-' ELSE 'B-' END || LPAD(n::text, 2, '0'),
       CASE WHEN n <= 10 THEN 'A' ELSE 'B' END,
       CASE WHEN n IN (1,2,3,11,12,13) THEN '2W'
            WHEN n IN (9,10,19,20)     THEN 'EV'
            ELSE '4W' END
FROM parking_lots l, generate_series(1,20) AS n
ORDER BY l.lot_id, n;

UPDATE parking_lots l SET total_slots = (SELECT COUNT(*) FROM parking_slots s WHERE s.lot_id = l.lot_id);

INSERT INTO staff (lot_id, full_name, role, phone, shift) VALUES
 (1,'Murugan Selvam','Supervisor','9876500001','morning'),
 (2,'Lakshmi Devi','Attendant','9876500002','evening'),
 (3,'Ravi Chandran','Security','9876500003','night'),
 (4,'Anitha Raj','Attendant','9876500004','morning');

INSERT INTO pricing_rules (vehicle_type, rate_per_hour, daily_max, grace_minutes, ev_surcharge, overtime_penalty_per_hour) VALUES
 ('2W', 10.00, 60.00,  10, 0.00,  5.00),
 ('4W', 30.00, 200.00, 10, 0.00, 10.00),
 ('EV', 30.00, 200.00, 10, 20.00,10.00);

-- Completed bookings (slots of the first lots, back in time)
INSERT INTO bookings (user_id, vehicle_id, slot_id, entry_time, exit_time, booking_type, booking_status, total_amount) VALUES
 (1,1, 4, NOW() - INTERVAL '3 days 5 hours', NOW() - INTERVAL '3 days 2 hours', 'walk_in','completed', 90.00),
 (2,3, 5, NOW() - INTERVAL '2 days 4 hours', NOW() - INTERVAL '2 days 3 hours', 'pre_book','completed',30.00),
 (3,5, 1, NOW() - INTERVAL '1 day 6 hours',  NOW() - INTERVAL '1 day 4 hours',  'walk_in','completed', 20.00),
 (4,7, 29, NOW() - INTERVAL '5 hours',       NOW() - INTERVAL '2 hours',        'walk_in','completed', 110.00);

-- Active bookings
INSERT INTO bookings (user_id, vehicle_id, slot_id, entry_time, booking_type, booking_status) VALUES
 (5,8, 6,  NOW() - INTERVAL '45 minutes', 'walk_in','active'),
 (2,4, 49, NOW() - INTERVAL '20 minutes', 'pre_book','active');

UPDATE parking_slots SET status='occupied' WHERE slot_id IN (6,49);
UPDATE parking_slots SET status='maintenance' WHERE slot_id IN (8, 28, 48, 68);
UPDATE parking_slots SET status='occupied' WHERE slot_id IN (7, 27, 47, 67, 14, 34, 54);

INSERT INTO payments (booking_id, amount, payment_mode, payment_status, paid_at) VALUES
 (1, 90.00,'upi','success',  NOW() - INTERVAL '3 days 2 hours'),
 (2, 30.00,'card','success', NOW() - INTERVAL '2 days 3 hours'),
 (3, 20.00,'cash','success', NOW() - INTERVAL '1 day 4 hours'),
 (4, 110.00,'wallet','pending', NOW() - INTERVAL '2 hours');

INSERT INTO reviews (user_id, lot_id, rating, comment) VALUES
 (1,1,5,'Clean, well lit and easy to find a slot.'),
 (2,1,4,'Good location. Billing was accurate.'),
 (3,1,4,'Quick entry and exit.'),
 (4,3,5,'EV charging slots are a big plus.'),
 (5,2,3,'Busy during evenings but staff were helpful.');
