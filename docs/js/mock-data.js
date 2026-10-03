/* SmartPark - browser-only demo data used in MOCK mode (GitHub Pages).
   The data lives in localStorage so changes survive page navigation.
   Every mock function returns a Promise that resolves after 200 ms. */
const MOCK_KEY = 'sp_mock_db_v1';
let _db = null;

function _ago(minutes) { return new Date(Date.now() - minutes * 60000).toISOString(); }
const _H = 60, _D = 1440;

function _seed() {
    const users = [
        { user_id: 1, full_name: 'Arjun Krishnan', email: 'arjun.krishnan@example.com', phone: '9842012345', created_at: _ago(30 * _D) },
        { user_id: 2, full_name: 'Priya Natarajan', email: 'priya.natarajan@example.com', phone: '9655123456', created_at: _ago(28 * _D) },
        { user_id: 3, full_name: 'Karthik Subramanian', email: 'karthik.s@example.com', phone: '9791023456', created_at: _ago(20 * _D) },
        { user_id: 4, full_name: 'Divya Ramesh', email: 'divya.ramesh@example.com', phone: '9944034567', created_at: _ago(12 * _D) },
        { user_id: 5, full_name: 'Suresh Kumar', email: 'suresh.kumar@example.com', phone: '9655045678', created_at: _ago(5 * _D) }
    ];
    const vehicles = [
        [1, 1, 'TN-37-AB-1234', '4W', 'Hyundai Creta'], [2, 1, 'TN-37-CD-5678', '2W', 'Honda Activa'],
        [3, 2, 'TN-37-EF-2345', '4W', 'Maruti Swift'], [4, 2, 'TN-37-GH-6789', 'EV', 'Tata Nexon EV'],
        [5, 3, 'TN-37-JK-3456', '2W', 'Royal Enfield Classic 350'], [6, 3, 'TN-37-LM-7890', '4W', 'Toyota Innova'],
        [7, 4, 'TN-37-NP-4567', 'EV', 'Ather 450X'], [8, 5, 'TN-37-QR-8901', '4W', 'Honda City']
    ].map(([vehicle_id, user_id, vehicle_number, vehicle_type, model]) => ({ vehicle_id, user_id, vehicle_number, vehicle_type, model, created_at: _ago(10 * _D) }));
    const lots = [
        [1, 'RS Puram Central Parking', 'DB Road, RS Puram', '06:00', '23:00'],
        [2, 'Gandhipuram Multi-Level', 'Cross Cut Road, Gandhipuram', '05:30', '23:30'],
        [3, 'Peelamedu Tech Park Lot', 'Avinashi Road, Peelamedu', '06:00', '22:00'],
        [4, 'Saibaba Colony Parking', 'NSR Road, Saibaba Colony', '07:00', '22:00']
    ].map(([lot_id, lot_name, address, open_time, close_time]) => ({ lot_id, lot_name, address, city: 'Coimbatore', total_slots: 20, open_time, close_time }));
    const occupied = [6, 49, 34, 7, 27, 47, 67, 14, 54], maint = [8, 28, 48, 68];
    const slots = [];
    lots.forEach((l) => {
        for (let n = 1; n <= 20; n++) {
            const id = (l.lot_id - 1) * 20 + n;
            const type = [1, 2, 3, 11, 12, 13].includes(n) ? '2W' : [9, 10, 19, 20].includes(n) ? 'EV' : '4W';
            slots.push({ slot_id: id, lot_id: l.lot_id, slot_number: (n <= 10 ? 'A-' : 'B-') + pad2(n), floor: n <= 10 ? 'A' : 'B', slot_type: type, status: occupied.includes(id) ? 'occupied' : maint.includes(id) ? 'maintenance' : 'available' });
        }
    });
    const staff = [[1, 1, 'Murugan Selvam', 'Supervisor', 'morning'], [2, 2, 'Lakshmi Devi', 'Attendant', 'evening'], [3, 3, 'Ravi Chandran', 'Security', 'night'], [4, 4, 'Anitha Raj', 'Attendant', 'morning']]
        .map(([staff_id, lot_id, full_name, role, shift]) => ({ staff_id, lot_id, full_name, role, shift }));
    const pricing_rules = [
        { rule_id: 1, vehicle_type: '2W', rate_per_hour: 10, daily_max: 60, grace_minutes: 10, ev_surcharge: 0, overtime_penalty_per_hour: 5 },
        { rule_id: 2, vehicle_type: '4W', rate_per_hour: 30, daily_max: 200, grace_minutes: 10, ev_surcharge: 0, overtime_penalty_per_hour: 10 },
        { rule_id: 3, vehicle_type: 'EV', rate_per_hour: 30, daily_max: 200, grace_minutes: 10, ev_surcharge: 20, overtime_penalty_per_hour: 10 }
    ];
    // [id, user, vehicle, slot, entry minutes ago, parked minutes (null = active), type]
    const spec = [
        [1, 1, 1, 4, 4 * _D + 5 * _H, 180, 'walk_in'], [2, 2, 3, 5, 3 * _D + 4 * _H, 60, 'pre_book'],
        [3, 3, 5, 1, 2 * _D + 6 * _H, 120, 'walk_in'], [4, 4, 7, 29, 5 * _H, 180, 'walk_in'],
        [5, 1, 2, 2, 1 * _D + 3 * _H, 95, 'walk_in'], [6, 5, 8, 15, 8 * _H, 240, 'pre_book'],
        [7, 5, 8, 6, 45, null, 'walk_in'], [8, 2, 4, 49, 20, null, 'pre_book'], [9, 3, 6, 34, 70, null, 'walk_in']
    ];
    const bookings = spec.map(([booking_id, user_id, vehicle_id, slot_id, ago, parked, booking_type]) => {
        const v = vehicles.find((x) => x.vehicle_id === vehicle_id);
        const rule = pricing_rules.find((r) => r.vehicle_type === v.vehicle_type);
        const b = { booking_id, user_id, vehicle_id, slot_id, entry_time: _ago(ago), exit_time: null, booking_type, booking_status: 'active', total_amount: 0 };
        if (parked !== null) { b.exit_time = _ago(ago - parked); b.booking_status = 'completed'; b.total_amount = calcBill(parked, rule, v.vehicle_type).total; }
        return b;
    });
    const payments = [
        [1, 'upi', 'success'], [2, 'card', 'success'], [3, 'cash', 'success'], [4, 'wallet', 'pending'], [5, 'upi', 'success'], [6, 'cash', 'success']
    ].map(([booking_id, payment_mode, payment_status], i) => {
        const b = bookings[booking_id - 1];
        return { payment_id: i + 1, booking_id, amount: b.total_amount, payment_mode, payment_status, paid_at: b.exit_time };
    });
    const reviews = [
        [1, 1, 5, 'Clean, well lit and easy to find a slot.'], [2, 1, 4, 'Good location. Billing was accurate.'], [3, 1, 4, 'Quick entry and exit.'],
        [4, 3, 5, 'EV charging slots are a big plus.'], [5, 2, 3, 'Busy during evenings but staff were helpful.']
    ].map(([user_id, lot_id, rating, comment], i) => ({ review_id: i + 1, user_id, lot_id, rating, comment, created_at: _ago((5 - i) * _D) }));
    return { users, vehicles, lots, slots, staff, pricing_rules, bookings, payments, reviews, seq: { user: 6, vehicle: 9, lot: 5, slot: 81, booking: 10, payment: 7, review: 6 } };
}

function _load() {
    if (_db) return _db;
    try { const raw = localStorage.getItem(MOCK_KEY); if (raw) { _db = JSON.parse(raw); return _db; } } catch (e) { /* fall through */ }
    _db = _seed(); _save();
    return _db;
}
function _save() { try { localStorage.setItem(MOCK_KEY, JSON.stringify(_db)); } catch (e) { /* ignore */ } }
function resetMockData() { _db = null; try { localStorage.removeItem(MOCK_KEY); } catch (e) { /* ignore */ } return _load(); }

/* Wrap synchronous work in a delayed Promise (simulated network). */
function _resolve(fn) {
    return new Promise((resolve, reject) => setTimeout(() => {
        try { const out = fn(_load()); _save(); resolve(out === undefined ? null : JSON.parse(JSON.stringify(out))); }
        catch (e) { reject(e instanceof Error ? e : new Error(String(e))); }
    }, 200));
}
const _ruleFor = (db, type) => db.pricing_rules.find((r) => r.vehicle_type === type);
const _need = (d, fields) => { const miss = fields.filter((f) => d[f] === undefined || d[f] === null || d[f] === ''); if (miss.length) throw new Error('Missing required field(s): ' + miss.join(', ')); };

function _enrich(db, b) {
    const u = db.users.find((x) => x.user_id === b.user_id) || {};
    const v = db.vehicles.find((x) => x.vehicle_id === b.vehicle_id) || {};
    const s = db.slots.find((x) => x.slot_id === b.slot_id) || {};
    const l = db.lots.find((x) => x.lot_id === s.lot_id) || {};
    const p = db.payments.find((x) => x.booking_id === b.booking_id);
    const r = _ruleFor(db, v.vehicle_type) || {};
    const end = b.exit_time ? new Date(b.exit_time) : new Date();
    return Object.assign({}, b, {
        full_name: u.full_name, vehicle_number: v.vehicle_number, vehicle_type: v.vehicle_type,
        slot_number: s.slot_number, floor: s.floor, lot_id: l.lot_id, lot_name: l.lot_name, city: l.city,
        payment_status: p ? p.payment_status : null, payment_mode: p ? p.payment_mode : null,
        rate_per_hour: r.rate_per_hour, daily_max: r.daily_max, grace_minutes: r.grace_minutes, ev_surcharge: r.ev_surcharge,
        duration_minutes: Math.round((end - new Date(b.entry_time)) / 60000),
        reviewed: db.reviews.some((x) => x.user_id === b.user_id && x.lot_id === l.lot_id)
    });
}
function _lotStats(db, lot, type) {
    const reviews = db.reviews.filter((r) => r.lot_id === lot.lot_id);
    const free = db.slots.filter((s) => s.lot_id === lot.lot_id && s.status === 'available' && (!type || s.slot_type === type)).length;
    return Object.assign({}, lot, { free_slots: free, review_count: reviews.length, avg_rating: reviews.length ? Math.round(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length * 10) / 10 : 0 });
}

/* ---------- users ---------- */
const mockGetUsers = () => _resolve((db) => db.users);
const mockCreateUser = (d) => _resolve((db) => {
    _need(d, ['full_name', 'email', 'phone']);
    if (db.users.some((u) => u.email.toLowerCase() === d.email.toLowerCase())) throw new Error('That email already exists (duplicate).');
    if (db.users.some((u) => u.phone === d.phone)) throw new Error('That phone number already exists (duplicate).');
    const u = { user_id: db.seq.user++, full_name: d.full_name.trim(), email: d.email.trim(), phone: d.phone.trim(), created_at: new Date().toISOString() };
    db.users.push(u); return u;
});
const mockUpdateUser = (id, d) => _resolve((db) => {
    const u = db.users.find((x) => x.user_id === Number(id)); if (!u) throw new Error('User not found');
    if (db.users.some((x) => x.user_id !== u.user_id && (x.email.toLowerCase() === d.email.toLowerCase() || x.phone === d.phone))) throw new Error('Email or phone already exists (duplicate).');
    Object.assign(u, { full_name: d.full_name, email: d.email, phone: d.phone }); return u;
});
const mockDeleteUser = (id) => _resolve((db) => {
    id = Number(id);
    if (db.bookings.some((b) => b.user_id === id)) throw new Error('This record is linked to other data and cannot be changed or deleted.');
    db.users = db.users.filter((u) => u.user_id !== id);
    db.vehicles = db.vehicles.filter((v) => v.user_id !== id);
    db.reviews = db.reviews.filter((r) => r.user_id !== id);
    return { deleted: id };
});

/* ---------- vehicles ---------- */
const mockGetVehicles = (userId) => _resolve((db) => db.vehicles.filter((v) => !userId || v.user_id === Number(userId)));
const mockCreateVehicle = (d) => _resolve((db) => {
    _need(d, ['user_id', 'vehicle_number', 'vehicle_type']);
    const num = d.vehicle_number.trim().toUpperCase();
    if (db.vehicles.some((v) => v.vehicle_number === num)) throw new Error('That vehicle number already exists (duplicate).');
    const v = { vehicle_id: db.seq.vehicle++, user_id: Number(d.user_id), vehicle_number: num, vehicle_type: d.vehicle_type, model: d.model || '', created_at: new Date().toISOString() };
    db.vehicles.push(v); return v;
});
const mockUpdateVehicle = (id, d) => _resolve((db) => {
    const v = db.vehicles.find((x) => x.vehicle_id === Number(id)); if (!v) throw new Error('Vehicle not found');
    const num = d.vehicle_number.trim().toUpperCase();
    if (db.vehicles.some((x) => x.vehicle_id !== v.vehicle_id && x.vehicle_number === num)) throw new Error('That vehicle number already exists (duplicate).');
    Object.assign(v, { vehicle_number: num, vehicle_type: d.vehicle_type, model: d.model || '' }); return v;
});
const mockDeleteVehicle = (id) => _resolve((db) => {
    id = Number(id);
    if (db.bookings.some((b) => b.vehicle_id === id)) throw new Error('This record is linked to other data and cannot be changed or deleted.');
    db.vehicles = db.vehicles.filter((v) => v.vehicle_id !== id); return { deleted: id };
});

/* ---------- lots ---------- */
const mockGetLots = () => _resolve((db) => db.lots.map((l) => _lotStats(db, l)));
const mockSearchLots = (p = {}) => _resolve((db) => {
    const hours = Number(p.duration) || 1, type = p.type || '';
    const rule = _ruleFor(db, type || '4W');
    return db.lots.filter((l) => !p.city || l.city.toLowerCase() === p.city.toLowerCase())
        .map((l) => {
            const o = _lotStats(db, l, type);
            o.rate_per_hour = rule.rate_per_hour;
            o.estimated_cost = Math.min(rule.rate_per_hour * hours, rule.daily_max) + ((type || '4W') === 'EV' ? rule.ev_surcharge : 0);
            return o;
        }).sort((a, b) => b.free_slots - a.free_slots || a.lot_name.localeCompare(b.lot_name));
});
const mockCreateLot = (d) => _resolve((db) => { _need(d, ['lot_name', 'city', 'total_slots', 'open_time', 'close_time']); const l = Object.assign({ lot_id: db.seq.lot++ }, d); db.lots.push(l); return l; });
const mockUpdateLot = (id, d) => _resolve((db) => { const l = db.lots.find((x) => x.lot_id === Number(id)); if (!l) throw new Error('Lot not found'); return Object.assign(l, d); });
const mockDeleteLot = (id) => _resolve((db) => {
    id = Number(id); const ids = db.slots.filter((s) => s.lot_id === id).map((s) => s.slot_id);
    if (db.bookings.some((b) => ids.includes(b.slot_id))) throw new Error('This record is linked to other data and cannot be changed or deleted.');
    db.lots = db.lots.filter((l) => l.lot_id !== id); db.slots = db.slots.filter((s) => s.lot_id !== id); return { deleted: id };
});

/* ---------- slots ---------- */
const mockGetSlots = (lotId) => _resolve((db) => db.slots.filter((s) => !lotId || s.lot_id === Number(lotId)));
const mockGetAvailableSlots = (lotId, type) => _resolve((db) => db.slots.filter((s) => s.status === 'available' && (!lotId || s.lot_id === Number(lotId)) && (!type || s.slot_type === type)));
const mockCreateSlot = (d) => _resolve((db) => {
    _need(d, ['lot_id', 'slot_number', 'slot_type']);
    if (db.slots.some((s) => s.lot_id === Number(d.lot_id) && s.slot_number === d.slot_number)) throw new Error('That slot number already exists in this lot (duplicate).');
    const s = { slot_id: db.seq.slot++, lot_id: Number(d.lot_id), slot_number: d.slot_number, floor: d.floor || '', slot_type: d.slot_type, status: 'available' };
    db.slots.push(s); return s;
});
const mockUpdateSlot = (id, d) => _resolve((db) => {
    const s = db.slots.find((x) => x.slot_id === Number(id)); if (!s) throw new Error('Slot not found');
    if (!['available', 'occupied', 'maintenance'].includes(d.status)) throw new Error('A value is outside the allowed range.');
    s.status = d.status; return s;
});
const mockDeleteSlot = (id) => _resolve((db) => {
    id = Number(id);
    if (db.bookings.some((b) => b.slot_id === id)) throw new Error('This record is linked to other data and cannot be changed or deleted.');
    db.slots = db.slots.filter((s) => s.slot_id !== id); return { deleted: id };
});

/* ---------- bookings ---------- */
const mockCreateBooking = (d) => _resolve((db) => {
    _need(d, ['user_id', 'vehicle_id', 'slot_id']);
    const slot = db.slots.find((s) => s.slot_id === Number(d.slot_id)); if (!slot) throw new Error('Slot ' + d.slot_id + ' does not exist');
    if (slot.status !== 'available') throw new Error('Slot is not available (' + slot.status + ').');
    const v = db.vehicles.find((x) => x.vehicle_id === Number(d.vehicle_id) && x.user_id === Number(d.user_id));
    if (!v) throw new Error('Vehicle does not belong to this user');
    if (v.vehicle_type !== slot.slot_type) throw new Error('Vehicle type ' + v.vehicle_type + ' does not match slot type ' + slot.slot_type);
    if (db.bookings.some((b) => b.slot_id === slot.slot_id && b.booking_status === 'active')) throw new Error('Slot ' + slot.slot_id + ' already has an active booking');
    const b = { booking_id: db.seq.booking++, user_id: v.user_id, vehicle_id: v.vehicle_id, slot_id: slot.slot_id, entry_time: new Date().toISOString(), exit_time: null, booking_type: d.booking_type || 'walk_in', booking_status: 'active', total_amount: 0 };
    db.bookings.push(b); slot.status = 'occupied';
    return _enrich(db, b);
});
const mockGetUserBookings = (userId) => _resolve((db) => db.bookings.filter((b) => !userId || b.user_id === Number(userId)).sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time)).map((b) => _enrich(db, b)));
const mockGetActiveBookings = (userId) => _resolve((db) => db.bookings.filter((b) => b.booking_status === 'active' && (!userId || b.user_id === Number(userId))).sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time)).map((b) => _enrich(db, b)));
const mockGetBooking = (id) => _resolve((db) => { const b = db.bookings.find((x) => x.booking_id === Number(id)); if (!b) throw new Error('Booking not found'); return _enrich(db, b); });
const mockExitBooking = (id) => _resolve((db) => {
    const b = db.bookings.find((x) => x.booking_id === Number(id));
    if (!b || b.booking_status !== 'active') throw new Error('Booking ' + id + ' is not active');
    const v = db.vehicles.find((x) => x.vehicle_id === b.vehicle_id);
    b.exit_time = new Date().toISOString(); b.booking_status = 'completed';
    b.total_amount = calcBill((new Date(b.exit_time) - new Date(b.entry_time)) / 60000, _ruleFor(db, v.vehicle_type), v.vehicle_type).total;
    const s = db.slots.find((x) => x.slot_id === b.slot_id); if (s) s.status = 'available';
    return _enrich(db, b);
});
const mockCancelBooking = (id) => _resolve((db) => {
    const b = db.bookings.find((x) => x.booking_id === Number(id)); if (!b) throw new Error('Booking not found');
    if (b.booking_status !== 'active') throw new Error('Only active bookings can be cancelled');
    b.booking_status = 'cancelled'; b.exit_time = new Date().toISOString(); b.total_amount = 0;
    const s = db.slots.find((x) => x.slot_id === b.slot_id); if (s) s.status = 'available';
    return { cancelled: b.booking_id };
});

/* ---------- payments & reviews ---------- */
const mockCreatePayment = (d) => _resolve((db) => {
    _need(d, ['booking_id', 'payment_mode']);
    const b = db.bookings.find((x) => x.booking_id === Number(d.booking_id)); if (!b) throw new Error('Booking not found');
    if (b.booking_status !== 'completed') throw new Error('Booking must be completed before payment');
    const old = db.payments.find((p) => p.booking_id === b.booking_id);
    if (old && old.payment_status === 'success') throw new Error('This booking has already been paid');
    if (old) { Object.assign(old, { payment_mode: d.payment_mode, payment_status: 'success', amount: b.total_amount, paid_at: new Date().toISOString() }); return old; }
    const p = { payment_id: db.seq.payment++, booking_id: b.booking_id, amount: b.total_amount, payment_mode: d.payment_mode, payment_status: 'success', paid_at: new Date().toISOString() };
    db.payments.push(p); return p;
});
const mockGetPayment = (bookingId) => _resolve((db) => db.payments.find((p) => p.booking_id === Number(bookingId)) || null);
const _reviewRows = (db, list) => list.map((r) => Object.assign({}, r, { full_name: (db.users.find((u) => u.user_id === r.user_id) || {}).full_name, lot_name: (db.lots.find((l) => l.lot_id === r.lot_id) || {}).lot_name })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
const mockCreateReview = (d) => _resolve((db) => {
    _need(d, ['user_id', 'lot_id', 'rating']);
    const rating = Number(d.rating); if (rating < 1 || rating > 5) throw new Error('A value is outside the allowed range.');
    const r = { review_id: db.seq.review++, user_id: Number(d.user_id), lot_id: Number(d.lot_id), rating, comment: d.comment || '', created_at: new Date().toISOString() };
    db.reviews.push(r); return r;
});
const mockGetLotReviews = (lotId) => _resolve((db) => _reviewRows(db, db.reviews.filter((r) => r.lot_id === Number(lotId))));
const mockGetUserReviews = (userId) => _resolve((db) => _reviewRows(db, db.reviews.filter((r) => r.user_id === Number(userId))));

/* ---------- reports ---------- */
const _completed = (db) => db.bookings.filter((b) => b.booking_status === 'completed');
const _lotOf = (db, b) => { const s = db.slots.find((x) => x.slot_id === b.slot_id); return db.lots.find((l) => l.lot_id === s.lot_id); };
const mockGetReportSummary = () => _resolve((db) => {
    const done = _completed(db), today = new Date().toDateString();
    const avg = done.length ? done.reduce((a, b) => a + (new Date(b.exit_time) - new Date(b.entry_time)) / 60000, 0) / done.length : 0;
    return {
        total_lots: db.lots.length, free_slots: db.slots.filter((s) => s.status === 'available').length,
        active_bookings: db.bookings.filter((b) => b.booking_status === 'active').length,
        today_revenue: done.filter((b) => new Date(b.exit_time).toDateString() === today).reduce((a, b) => a + Number(b.total_amount), 0),
        total_users: db.users.length, avg_rating: db.reviews.length ? Math.round(db.reviews.reduce((a, r) => a + r.rating, 0) / db.reviews.length * 10) / 10 : 0,
        total_bookings: db.bookings.length, avg_duration: Math.round(avg), pending_payments: db.payments.filter((p) => p.payment_status === 'pending').length
    };
});
const mockGetRevenueReport = () => _resolve((db) => {
    const map = {};
    _completed(db).forEach((b) => { const key = _lotOf(db, b).lot_name + '|' + b.exit_time.slice(0, 10); map[key] = (map[key] || 0) + Number(b.total_amount); });
    return Object.keys(map).map((k) => ({ lot_name: k.split('|')[0], day: k.split('|')[1], revenue: map[k] })).sort((a, b) => b.day.localeCompare(a.day));
});
const mockGetPeakHours = () => _resolve((db) => {
    const counts = {}; db.bookings.forEach((b) => { const h = new Date(b.entry_time).getHours(); counts[h] = (counts[h] || 0) + 1; });
    return Object.keys(counts).map((h) => ({ hour_of_day: Number(h), bookings: counts[h] })).sort((a, b) => a.hour_of_day - b.hour_of_day);
});
const mockGetVehicleSplit = () => _resolve((db) => {
    const counts = {}; db.bookings.forEach((b) => { const t = db.vehicles.find((v) => v.vehicle_id === b.vehicle_id).vehicle_type; counts[t] = (counts[t] || 0) + 1; });
    return Object.keys(counts).map((t) => ({ vehicle_type: t, bookings: counts[t] })).sort((a, b) => b.bookings - a.bookings);
});
const mockGetUtilization = () => _resolve((db) => db.lots.map((l) => {
    const all = db.slots.filter((s) => s.lot_id === l.lot_id), occ = all.filter((s) => s.status === 'occupied').length;
    return { lot_name: l.lot_name, total_slots: all.length, occupied_slots: occ, utilization_pct: all.length ? Math.round(occ / all.length * 1000) / 10 : 0 };
}));
const mockGetTopUsers = () => _resolve((db) => {
    const map = {};
    _completed(db).forEach((b) => { const m = map[b.user_id] || (map[b.user_id] = { bookings: 0, total_spent: 0 }); m.bookings++; m.total_spent += Number(b.total_amount); });
    return Object.keys(map).map((id) => ({ full_name: db.users.find((u) => u.user_id === Number(id)).full_name, bookings: map[id].bookings, total_spent: map[id].total_spent }))
        .sort((a, b) => b.total_spent - a.total_spent).slice(0, 5);
});
