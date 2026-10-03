/* Booking Confirmation - receipt, start session or cancel. */
document.addEventListener('DOMContentLoaded', async () => {
    const user = requireUser(); if (!user) return;
    const id = param('id') || store.get('sp_booking');
    const box = $('#receipt');
    if (!id) { box.innerHTML = '<div class="empty"><i data-lucide="ticket"></i><div>No booking selected.</div><a class="btn btn-primary mt-16" href="search.html">Find parking</a></div>'; refreshIcons(); return; }
    const b = await safe(() => getBooking(id));
    if (!b) { box.innerHTML = '<div class="empty"><i data-lucide="alert-circle"></i><div>Booking not found.</div><a class="btn btn-primary mt-16" href="search.html">Find parking</a></div>'; refreshIcons(); return; }
    store.set('sp_booking', b.booking_id);
    const row = (k, v) => `<div class="row"><span class="k">${k}</span><span class="v">${v}</span></div>`;
    const active = b.booking_status === 'active';
    box.innerHTML = `
      <div class="receipt-head"><i data-lucide="ticket" style="width:28px;height:28px;color:var(--primary)"></i>
        <div class="small text-secondary">Booking confirmation</div><div class="id">#${String(b.booking_id).padStart(5, '0')}</div>${badge(b.booking_status)}</div>
      ${row('Customer', esc(b.full_name))}
      ${row('Vehicle', `<span class="mono">${esc(b.vehicle_number)}</span> · ${esc(b.vehicle_type)}`)}
      ${row('Parking lot', esc(b.lot_name))}
      ${row('Slot', `<span class="mono">${esc(b.slot_number)}</span> · Floor ${esc(b.floor || '-')}`)}
      ${row('Booking type', b.booking_type === 'pre_book' ? 'Pre-booked' : 'Walk-in')}
      ${row('Entry time', esc(formatDateTime(b.entry_time)))}
      ${row('Rate', `${formatCurrency(b.rate_per_hour)} / hour · ${esc(b.grace_minutes)} min grace`)}
      <div class="actions">${active
        ? '<button class="btn btn-primary" id="btn-start"><i data-lucide="play"></i>Start Session</button><button class="btn btn-ghost" id="btn-cancel"><i data-lucide="x"></i>Cancel Booking</button>'
        : `<a class="btn btn-primary" href="bill.html?id=${b.booking_id}">View bill</a><a class="btn btn-secondary" href="history.html">My history</a>`}</div>`;
    refreshIcons();
    if (!active) return;
    $('#btn-start').addEventListener('click', () => { window.location.href = 'session.html?id=' + b.booking_id; });
    $('#btn-cancel').addEventListener('click', async () => {
        if (!confirm('Cancel this booking and release the slot?')) return;
        const res = await safe(() => cancelBooking(b.booking_id));
        if (res === undefined) return;
        store.remove('sp_booking'); showToast('Booking cancelled', 'info');
        setTimeout(() => { window.location.href = 'search.html'; }, 700);
    });
});
