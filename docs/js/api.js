/* SmartPark - API layer. MOCK mode calls mock-data.js (no network at all);
   REAL mode calls the Flask backend at CONFIG.API_URL. */
async function apiRequest(method, path, body) {
    let res;
    try {
        res = await fetch(CONFIG.API_URL + path, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
    } catch (e) {
        throw new Error('Cannot reach the SmartPark server. Make sure the backend is running at ' + CONFIG.API_URL);
    }
    let json;
    try { json = await res.json(); } catch (e) { throw new Error('Unexpected response from the server'); }
    if (!res.ok || json.success === false) throw new Error(json.error || 'Request failed (' + res.status + ')');
    return json.data;
}
const call = (mockFn, method, path, body) => (CONFIG.MODE === 'MOCK' ? mockFn() : apiRequest(method, path, body));
const qs = (obj) => {
    const p = new URLSearchParams();
    Object.keys(obj || {}).forEach((k) => { if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') p.append(k, obj[k]); });
    const s = p.toString(); return s ? '?' + s : '';
};

/* users */
const getUsers = () => call(() => mockGetUsers(), 'GET', '/users');
const createUser = (d) => call(() => mockCreateUser(d), 'POST', '/users', d);
const updateUser = (id, d) => call(() => mockUpdateUser(id, d), 'PUT', '/users/' + id, d);
const deleteUser = (id) => call(() => mockDeleteUser(id), 'DELETE', '/users/' + id);
/* vehicles */
const getVehicles = (userId) => call(() => mockGetVehicles(userId), 'GET', '/vehicles' + qs({ user_id: userId }));
const createVehicle = (d) => call(() => mockCreateVehicle(d), 'POST', '/vehicles', d);
const updateVehicle = (id, d) => call(() => mockUpdateVehicle(id, d), 'PUT', '/vehicles/' + id, d);
const deleteVehicle = (id) => call(() => mockDeleteVehicle(id), 'DELETE', '/vehicles/' + id);
/* lots */
const getLots = () => call(() => mockGetLots(), 'GET', '/lots');
const searchLots = (p) => call(() => mockSearchLots(p), 'GET', '/lots/search' + qs(p));
const createLot = (d) => call(() => mockCreateLot(d), 'POST', '/lots', d);
const updateLot = (id, d) => call(() => mockUpdateLot(id, d), 'PUT', '/lots/' + id, d);
const deleteLot = (id) => call(() => mockDeleteLot(id), 'DELETE', '/lots/' + id);
/* slots */
const getSlots = (lotId) => call(() => mockGetSlots(lotId), 'GET', '/slots' + qs({ lot_id: lotId }));
const getAvailableSlots = (lotId, type) => call(() => mockGetAvailableSlots(lotId, type), 'GET', '/slots/available' + qs({ lot_id: lotId, type }));
const createSlot = (d) => call(() => mockCreateSlot(d), 'POST', '/slots', d);
const updateSlot = (id, d) => call(() => mockUpdateSlot(id, d), 'PUT', '/slots/' + id, d);
const deleteSlot = (id) => call(() => mockDeleteSlot(id), 'DELETE', '/slots/' + id);
/* bookings */
const createBooking = (d) => call(() => mockCreateBooking(d), 'POST', '/bookings', d);
const getUserBookings = (userId) => call(() => mockGetUserBookings(userId), 'GET', '/bookings' + qs({ user_id: userId }));
const getActiveBookings = (userId) => call(() => mockGetActiveBookings(userId), 'GET', '/bookings/active' + qs({ user_id: userId }));
const getBooking = (id) => call(() => mockGetBooking(id), 'GET', '/bookings/' + id);
const exitBooking = (id) => call(() => mockExitBooking(id), 'PUT', '/bookings/' + id + '/exit');
const cancelBooking = (id) => call(() => mockCancelBooking(id), 'DELETE', '/bookings/' + id);
/* payments */
const createPayment = (d) => call(() => mockCreatePayment(d), 'POST', '/payments', d);
const getPayment = (bookingId) => call(() => mockGetPayment(bookingId), 'GET', '/payments/' + bookingId);
/* reviews */
const createReview = (d) => call(() => mockCreateReview(d), 'POST', '/reviews', d);
const getLotReviews = (lotId) => call(() => mockGetLotReviews(lotId), 'GET', '/reviews' + qs({ lot_id: lotId }));
const getUserReviews = (userId) => call(() => mockGetUserReviews(userId), 'GET', '/reviews' + qs({ user_id: userId }));
/* reports */
const getReportSummary = () => call(() => mockGetReportSummary(), 'GET', '/reports/summary');
const getRevenueReport = () => call(() => mockGetRevenueReport(), 'GET', '/reports/revenue');
const getPeakHours = () => call(() => mockGetPeakHours(), 'GET', '/reports/peak-hours');
const getVehicleSplit = () => call(() => mockGetVehicleSplit(), 'GET', '/reports/vehicle-split');
const getUtilization = () => call(() => mockGetUtilization(), 'GET', '/reports/utilization');
const getTopUsers = () => call(() => mockGetTopUsers(), 'GET', '/reports/top-users');
