/* Live Session - running timer, running bill, extend, exit. */
document.addEventListener('DOMContentLoaded', async () => {
    const user = requireUser(); if (!user) return;
    const area = $('#session-area');
    const empty = (msg) => { area.innerHTML = `<div class="card empty"><i data-lucide="clock"></i><div>${msg}</div><a class="btn btn-primary mt-16" href="search.html">Find parking</a></div>`; refreshIcons(); };

    let id = param('id') || store.get('sp_booking');
    let b = null;
    if (id) b = await safe(() => getBooking(id));
    if (!b || b.booking_status !== 'active' || b.user_id !== user.user_id) {
        const active = await safe(() => getActiveBookings(user.user_id));
        b = active && active[0];
    }
    if (!b) return empty('You have no active parking session.');
    store.set('sp_booking', b.booking_id);

    const entry = new Date(b.entry_time).getTime();
    const planKey = 'sp_plan_' + b.booking_id;
    let plan = store.get(planKey, Number(store.get('sp_search', {}).duration) || 1);

    area.innerHTML = `
      <div class="live-dot">Session live</div>
      <div class="timer" id="timer" aria-live="off">00:00:00</div>
      <div class="small text-secondary">Running bill (estimate)</div>
      <div class="running-bill" id="bill">${formatCurrency(0)}</div>
      <p class="session-info"><strong>${esc(b.lot_name)}</strong> · Slot <span class="mono">${esc(b.slot_number)}</span> (Floor ${esc(b.floor || '-')}) · <span class="mono">${esc(b.vehicle_number)}</span><br>
        Entered ${esc(formatTime(b.entry_time))} · <span id="plan"></span></p>
      <div class="session-actions">
        <button class="btn btn-secondary btn-lg" id="btn-extend"><i data-lucide="clock"></i>Extend Time</button>
        <button class="btn btn-primary btn-lg" id="btn-exit"><i data-lucide="log-out"></i>Exit &amp; Pay</button>
      </div>`;
    refreshIcons();

    function tick() { $('#timer').textContent = formatClock(Math.max(0, Math.floor((Date.now() - entry) / 1000))); }
    function updateBill() { $('#bill').textContent = formatCurrency(calcBill((Date.now() - entry) / 60000, b, b.vehicle_type).total); }
    function updatePlan() { $('#plan').textContent = `Planned stay ${plan} h · until ${formatTime(new Date(entry + plan * 3600000))}`; }
    tick(); updateBill(); updatePlan();
    const t1 = setInterval(tick, 1000), t2 = setInterval(updateBill, 10000);

    $('#btn-extend').addEventListener('click', () => {
        plan += 1; store.set(planKey, plan); updatePlan();
        showToast('Planned stay extended by 1 hour.', 'success');
    });
    $('#btn-exit').addEventListener('click', async () => {
        if (!confirm('End this session and generate the bill?')) return;
        const btn = $('#btn-exit'); setBusy(btn, true, 'Generating bill…');
        const res = await safe(() => exitBooking(b.booking_id));
        if (!res) { setBusy(btn, false); return; }
        clearInterval(t1); clearInterval(t2);
        showToast('Session ended. Your bill is ready.', 'success');
        setTimeout(() => { window.location.href = 'bill.html?id=' + b.booking_id; }, 500);
    });
});
