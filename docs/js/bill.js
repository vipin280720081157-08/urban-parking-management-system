/* Bill & Payment - itemised invoice and payment mode. */
document.addEventListener('DOMContentLoaded', async () => {
    const user = requireUser(); if (!user) return;
    const box = $('#invoice');
    const id = param('id') || store.get('sp_booking');
    const fail = (msg) => { box.innerHTML = `<div class="empty"><i data-lucide="receipt"></i><div>${msg}</div><a class="btn btn-primary mt-16" href="history.html">My bookings</a></div>`; refreshIcons(); };
    if (!id) return fail('No booking selected.');
    const b = await safe(() => getBooking(id));
    if (!b) return fail('Booking not found.');
    if (b.booking_status === 'active') { window.location.href = 'session.html?id=' + b.booking_id; return; }
    if (b.booking_status === 'cancelled') return fail('This booking was cancelled, so there is nothing to pay.');

    const minutes = (new Date(b.exit_time) - new Date(b.entry_time)) / 60000;
    const bill = calcBill(minutes, b, b.vehicle_type);
    const row = (k, v) => `<div class="row"><span class="k">${k}</span><span class="v mono">${v}</span></div>`;
    const modes = [['cash', 'banknote', 'Cash'], ['upi', 'smartphone', 'UPI'], ['card', 'credit-card', 'Card'], ['wallet', 'wallet', 'Wallet']];

    function paidView(mode) {
        return `<div class="success-box"><i data-lucide="check-circle"></i><h3>Payment successful</h3>
          <p class="text-secondary">${formatCurrency(b.total_amount)} paid by ${esc(String(mode).toUpperCase())}.</p>
          <div class="flex gap-12 wrap" style="justify-content:center"><a class="btn btn-primary" href="history.html">My history</a><a class="btn btn-secondary" href="search.html">Park again</a></div></div>`;
    }
    function payView() {
        return `${b.payment_status === 'pending' ? '<p class="small badge badge-pending" style="display:block;text-align:center">A payment for this booking is pending.</p>' : ''}
          <h3>Payment mode</h3>
          <div class="pay-modes" role="radiogroup">${modes.map(([v, icon, label], i) => `<div class="pay-mode"><input type="radio" name="mode" id="m-${v}" value="${v}" ${i === 1 ? 'checked' : ''}><label for="m-${v}"><i data-lucide="${icon}"></i>${label}</label></div>`).join('')}</div>
          <button class="btn btn-primary btn-lg btn-block" id="btn-pay"><i data-lucide="credit-card"></i>Pay ${formatCurrency(b.total_amount)}</button>`;
    }

    box.innerHTML = `
      <div class="flex between wrap gap-8 mb-16"><div><div class="small text-secondary">Invoice</div><h2 class="mb-0">Booking #${String(b.booking_id).padStart(5, '0')}</h2></div>${badge(b.booking_status)}</div>
      <div class="row"><span class="k">Lot / Slot</span><span class="v">${esc(b.lot_name)} · <span class="mono">${esc(b.slot_number)}</span></span></div>
      <div class="row"><span class="k">Vehicle</span><span class="v"><span class="mono">${esc(b.vehicle_number)}</span> (${esc(b.vehicle_type)})</span></div>
      <div class="row"><span class="k">Time</span><span class="v">${esc(formatTime(b.entry_time))} → ${esc(formatTime(b.exit_time))}</span></div>
      <div class="row"><span class="k">Duration</span><span class="v mono">${esc(formatDuration(minutes))}</span></div>
      <div class="divider"></div>
      ${row(`Parking (${bill.hours} h × ${formatCurrency(bill.rate)})`, formatCurrency(bill.base))}
      ${row(`Grace period (${esc(b.grace_minutes)} min)`, bill.graceApplied ? 'Applied - free' : 'Not applicable')}
      ${row('Daily maximum discount', bill.capDiscount ? '-' + formatCurrency(bill.capDiscount) : formatCurrency(0))}
      ${row('Overtime penalty', formatCurrency(bill.overtime))}
      ${row('EV surcharge', formatCurrency(bill.evSurcharge))}
      <div class="divider"></div>
      <div class="total"><span>Total</span><span class="mono">${formatCurrency(b.total_amount)}</span></div>
      <div id="pay-area" class="mt-24"></div>`;
    const area = $('#pay-area');

    if (b.payment_status === 'success') {
        const p = await safe(() => getPayment(b.booking_id));
        area.innerHTML = paidView(p ? p.payment_mode : b.payment_mode || 'paid');
    } else {
        area.innerHTML = payView();
        $('#btn-pay').addEventListener('click', async () => {
            const mode = $('input[name=mode]:checked').value;
            const btn = $('#btn-pay'); setBusy(btn, true, 'Processing…');
            const res = await safe(() => createPayment({ booking_id: b.booking_id, payment_mode: mode }));
            if (!res) { setBusy(btn, false); return; }
            showToast('Payment recorded successfully.', 'success');
            area.innerHTML = paidView(mode); refreshIcons();
        });
    }
    refreshIcons();
});
