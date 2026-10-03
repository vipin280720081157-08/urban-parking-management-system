-- SmartPark - Analytical queries

-- Q1. Revenue per lot per day
SELECT l.lot_name, DATE(b.exit_time) AS day, SUM(b.total_amount) AS revenue
FROM bookings b JOIN parking_slots s ON s.slot_id = b.slot_id JOIN parking_lots l ON l.lot_id = s.lot_id
WHERE b.booking_status = 'completed'
GROUP BY l.lot_name, DATE(b.exit_time) ORDER BY day DESC, revenue DESC;

-- Q2. Peak parking hours (histogram by hour of entry)
SELECT EXTRACT(HOUR FROM entry_time)::int AS hour_of_day, COUNT(*) AS bookings
FROM bookings GROUP BY 1 ORDER BY 1;

-- Q3. Vehicle type distribution
SELECT v.vehicle_type, COUNT(*) AS bookings
FROM bookings b JOIN vehicles v ON v.vehicle_id = b.vehicle_id
GROUP BY v.vehicle_type ORDER BY bookings DESC;

-- Q4. Slot utilization per lot
SELECT lot_name, total_slots, occupied_slots, utilization_pct FROM v_slot_utilization ORDER BY utilization_pct DESC;

-- Q5. Top 5 users by total spend
SELECT u.full_name, COUNT(b.booking_id) AS bookings, SUM(b.total_amount) AS total_spent
FROM users u JOIN bookings b ON b.user_id = u.user_id
WHERE b.booking_status = 'completed'
GROUP BY u.user_id, u.full_name ORDER BY total_spent DESC LIMIT 5;

-- Q6. Average parking duration per vehicle type (minutes)
SELECT v.vehicle_type,
       ROUND(AVG(EXTRACT(EPOCH FROM (b.exit_time - b.entry_time)) / 60)::numeric, 1) AS avg_minutes
FROM bookings b JOIN vehicles v ON v.vehicle_id = b.vehicle_id
WHERE b.booking_status = 'completed' GROUP BY v.vehicle_type;

-- Q7. Pending vs completed payments
SELECT payment_status, COUNT(*) AS payments, SUM(amount) AS total_amount
FROM payments GROUP BY payment_status;

-- Q8. Monthly revenue growth using LAG
WITH monthly AS (
    SELECT DATE_TRUNC('month', exit_time) AS month, SUM(total_amount) AS revenue
    FROM bookings WHERE booking_status = 'completed' GROUP BY 1
)
SELECT month::date, revenue,
       LAG(revenue) OVER (ORDER BY month) AS previous_revenue,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 1) AS growth_pct
FROM monthly ORDER BY month;
