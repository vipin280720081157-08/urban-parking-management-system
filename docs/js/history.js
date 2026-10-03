/* My History - past bookings, stats, reviews. */
document.addEventListener('DOMContentLoaded', async () => {
    const user = requireUser(); if (!user) return;
    $('#history-owner').textContent = user.full_name;
    let bookings = [], rating = 0;

    async function load() {
        const list = await safe(() => getUserBookings(user.user_id));
        if (!list) { $('#history-rows').innerHTML = emptyRow(9, 'Could not load your bookings', 'alert-circle'); refreshIcons(); return; }
        bookings = list; renderStats(); renderRows();
    }

    function renderStats() {
        const done = bookings.filter((b) => b.booking_status === 'completed');
        const spent = done.reduce((a, b) => a + Number(b.total_amount), 0);
        const mins = done.reduce((a, b) => a + Number(b.duration_minutes), 0);
        const counts = {}; bookings.filter((b) => b.booking_status !== 'cancelled').forEach((b) => { counts[b.lot_name] = (counts[b.lot_name] || 0) + 1; });
        const fav = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '-';
        const items = [['Total Bookings', bookings.length, 'calendar-check'], ['Total Spent', formatCurrency(spent), 'credit-card'], ['Total Parked', formatDuration(mins), 'clock'], ['Favorite Lot', fav, 'star']];
        $('#history-stats').innerHTML = items.map(([l, v, icon]) => `<div class="card"><div class="stat-top"><div class="stat-icon"><i data-lucide="${icon}"></i></div><div class="stat-label">${l}</div></div><div class="stat-value ${String(v).length > 8 ? 'sm' : ''}">${esc(v)}</div></div>`).join('');
    }

    function renderRows() {
        $('#history-rows').innerHTML = bookings.length ? bookings.map((b, i) => {
            let actions = '';
            if (b.booking_status === 'active') actions = `<a class="icon-btn sm edit" href="session.html?id=${b.booking_id}" title="Open live session"><i data-lucide="clock"></i></a>`;
            if (b.booking_status === 'completed') {
                actions = `<a class="icon-btn sm view" href="bill.html?id=${b.booking_id}" title="${b.payment_status === 'success' ? 'View bill' : 'Pay now'}"><i data-lucide="${b.payment_status === 'success' ? 'eye' : 'credit-card'}"></i></a>`;
                if (!b.reviewed) actions += `<button class="icon-btn sm edit" data-rate="${b.lot_id}" title="Rate this lot"><i data-lucide="star"></i></button>`;
            }
            const pay = b.booking_status === 'completed' ? badge(b.payment_status || 'unpaid').replace('badge-unpaid', 'badge-failed') : '-';
            return `<tr><td class="num">${bookings.length - i}</td><td>${esc(formatDate(b.entry_time))}</td><td>${esc(b.lot_name)}</td><td class="num">${esc(b.slot_number)}</td>
              <td class="num">${esc(formatDuration(b.duration_minutes))}</td><td class="num">${formatCurrency(b.total_amount)}</td><td>${badge(b.booking_status)}</td><td>${pay}</td><td>${actions}</td></tr>`;
        }).join('') : emptyRow(9, 'No bookings yet. Find a parking lot to get started.', 'calendar-check');
        refreshIcons();
    }

    function setStars(n) {
        rating = n;
        $$('#r-stars button').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) <= n));
        $$('#r-stars i').forEach((ic, i) => ic.setAttribute('fill', i < n ? 'currentColor' : 'none'));
    }
    $('#r-stars').innerHTML = [1, 2, 3, 4, 5].map((n) => `<button type="button" data-v="${n}" aria-label="${n} star${n > 1 ? 's' : ''}"><i data-lucide="star"></i></button>`).join('');
    $('#r-stars').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setStars(Number(b.dataset.v)); });

    function openReview(lotId) {
        const lots = {}; bookings.forEach((b) => { lots[b.lot_id] = b.lot_name; });
        if (!Object.keys(lots).length) return showToast('Park at a lot first, then you can rate it.', 'info');
        $('#r-lot').innerHTML = Object.keys(lots).map((id) => `<option value="${id}">${esc(lots[id])}</option>`).join('');
        if (lotId) $('#r-lot').value = lotId;
        $('#r-comment').value = ''; setStars(0); clearErrors($('#review-form')); refreshIcons();
        openModal('review-modal');
    }
    $('#btn-rate').addEventListener('click', () => openReview());
    $('#history-rows').addEventListener('click', (e) => { const b = e.target.closest('button[data-rate]'); if (b) openReview(b.dataset.rate); });

    $('#review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (rating < 1) return showToast('Please choose a star rating.', 'warning');
        const btn = $('#r-save'); setBusy(btn, true, 'Saving…');
        const res = await safe(() => createReview({ user_id: user.user_id, lot_id: Number($('#r-lot').value), rating, comment: $('#r-comment').value.trim() }));
        setBusy(btn, false);
        if (!res) return;
        closeModal('review-modal'); showToast('Thanks for your review!', 'success'); load();
    });
    load();
});
