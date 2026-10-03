/* Slot Map - pick a free slot and confirm the booking. */
document.addEventListener('DOMContentLoaded', async () => {
    const user = requireUser(); if (!user) return;
    const lot = store.get('sp_lot');
    if (!lot) { window.location.href = 'search.html'; return; }
    $('#lot-name').textContent = lot.lot_name;

    let slots = [], vehicles = [], floor = null, selected = null;
    const vSel = $('#vehicle-select');

    vehicles = (await safe(() => getVehicles(user.user_id))) || [];
    if (!vehicles.length) {
        $('#slot-area').innerHTML = '<div class="card empty"><i data-lucide="car"></i><div>You need a vehicle before booking.</div><a class="btn btn-primary mt-16" href="vehicles.html">Add a vehicle</a></div>';
        $('#vehicle-field').classList.add('hidden'); refreshIcons(); return;
    }
    vSel.innerHTML = vehicles.map((v) => `<option value="${v.vehicle_id}">${esc(v.vehicle_number)} · ${esc(v.vehicle_type)}</option>`).join('');
    const pre = store.get('sp_vehicle');
    if (vehicles.some((v) => v.vehicle_id === pre)) vSel.value = pre;
    const currentVehicle = () => vehicles.find((v) => v.vehicle_id === Number(vSel.value));

    async function loadSlots() {
        const list = await safe(() => getSlots(lot.lot_id));
        if (!list) { $('#slot-grid').innerHTML = '<div class="empty">Could not load slots.</div>'; return; }
        slots = list;
        const floors = Array.from(new Set(slots.map((s) => s.floor || '-'))).sort();
        if (!floors.includes(floor)) floor = floors[0];
        $('#floor-tabs').innerHTML = floors.length > 1 ? floors.map((f) => `<button type="button" class="btn btn-secondary floor-btn ${f === floor ? 'active' : ''}" data-floor="${esc(f)}">Floor ${esc(f)}</button>`).join('') : '';
        render();
    }

    function render() {
        const type = currentVehicle().vehicle_type;
        const shown = slots.filter((s) => (s.floor || '-') === floor);
        $('#slot-grid').innerHTML = shown.map((s) => {
            const mismatch = s.status === 'available' && s.slot_type !== type;
            const cls = ['slot', 'slot-' + s.status, mismatch ? 'slot-dim' : '', selected === s.slot_id ? 'slot-selected' : ''].join(' ');
            const tip = mismatch ? `${s.slot_number} - for ${s.slot_type} vehicles only` : `${s.slot_number} (${s.slot_type}) - ${s.status}`;
            return `<button type="button" class="${cls}" data-slot="${s.slot_id}" title="${esc(tip)}" aria-label="${esc(tip)}" ${s.status !== 'available' || mismatch ? 'aria-disabled="true"' : ''}>${esc(s.slot_number)}<small>${esc(s.slot_type)}</small></button>`;
        }).join('');
        const free = slots.filter((s) => s.status === 'available' && s.slot_type === type).length;
        $('#free-note').textContent = `${free} free ${type} slots in this lot`;
        const sel = slots.find((s) => s.slot_id === selected);
        $('#selection-bar').classList.toggle('show', !!sel);
        if (sel) $('#selected-label').textContent = sel.slot_number;
        $('#lot-sub').textContent = `Showing slots for ${currentVehicle().vehicle_number} (${type})`;
    }

    $('#floor-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-floor]'); if (!b) return; floor = b.dataset.floor; $$('.floor-btn').forEach((x) => x.classList.toggle('active', x === b)); render(); });
    vSel.addEventListener('change', () => { selected = null; store.set('sp_vehicle', currentVehicle().vehicle_id); render(); });
    $('#slot-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-slot]'); if (!btn) return;
        const s = slots.find((x) => x.slot_id === Number(btn.dataset.slot));
        if (s.status !== 'available') return showToast(`Slot ${s.slot_number} is ${s.status}.`, 'warning');
        if (s.slot_type !== currentVehicle().vehicle_type) return showToast(`Slot ${s.slot_number} is for ${s.slot_type} vehicles.`, 'warning');
        selected = s.slot_id; render();
    });
    $('#btn-clear').addEventListener('click', () => { selected = null; render(); });

    $('#btn-confirm').addEventListener('click', async () => {
        if (!selected) return showToast('Select a green slot first.', 'warning');
        const btn = $('#btn-confirm'); setBusy(btn, true, 'Booking…');
        const when = (store.get('sp_search', {}).when === 'later') ? 'pre_book' : 'walk_in';
        const b = await safe(() => createBooking({ user_id: user.user_id, vehicle_id: currentVehicle().vehicle_id, slot_id: selected, booking_type: when }));
        setBusy(btn, false);
        if (!b) { selected = null; loadSlots(); return; }
        store.set('sp_booking', b.booking_id);
        showToast('Slot booked successfully', 'success');
        setTimeout(() => { window.location.href = 'booking.html?id=' + b.booking_id; }, 500);
    });
    loadSlots();
});
