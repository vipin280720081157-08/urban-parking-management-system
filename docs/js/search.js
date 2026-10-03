/* Search Parking - filter lots and choose one. */
document.addEventListener('DOMContentLoaded', async () => {
    const user = requireUser(); if (!user) return;
    const saved = store.get('sp_search', {});
    const fCity = $('#f-city'), fType = $('#f-type'), fDur = $('#f-duration');
    const veh = store.get('sp_vehicle');
    fType.value = saved.type || ''; fDur.value = saved.duration || '2';
    if (saved.when === 'later') $('#when-later').checked = true;

    if (!saved.type && veh) {
        const list = await safe(() => getVehicles(user.user_id));
        const v = list && list.find((x) => x.vehicle_id === veh);
        if (v) fType.value = v.vehicle_type;
    }
    const lots = await safe(getLots);
    const cities = lots ? Array.from(new Set(lots.map((l) => l.city))).sort() : ['Coimbatore'];
    fCity.innerHTML = '<option value="">All cities</option>' + cities.map((c) => `<option>${esc(c)}</option>`).join('');
    fCity.value = saved.city || cities[0] || '';

    let results = [];
    const distance = (id) => (((id * 7) % 30) + 5) / 10;

    async function runSearch() {
        const params = { city: fCity.value, type: fType.value, duration: fDur.value };
        $('#results').innerHTML = '<div class="card empty">Searching…</div>';
        const rows = await safe(() => searchLots(params));
        if (!rows) { $('#results').innerHTML = '<div class="card empty"><i data-lucide="alert-circle"></i><div>Search failed. Please try again.</div></div>'; refreshIcons(); return; }
        results = rows;
        store.set('sp_search', Object.assign({}, params, { when: $('input[name=when]:checked').value }));
        if (!rows.length) { $('#results').innerHTML = '<div class="card empty"><i data-lucide="search-x"></i><div>No parking lots match your filters.</div></div>'; refreshIcons(); return; }
        $('#results').innerHTML = rows.map((l) => `
          <article class="card lot-card">
            <div>
              <h3>${esc(l.lot_name)}</h3>
              <div class="lot-meta">
                <span><i data-lucide="map-pin"></i>${esc(l.address || '')}, ${esc(l.city)}</span>
                <span><i data-lucide="navigation"></i>${distance(l.lot_id).toFixed(1)} km away</span>
                <span><i data-lucide="clock"></i>${esc(String(l.open_time).slice(0, 5))} - ${esc(String(l.close_time).slice(0, 5))}</span>
              </div>
              <div class="lot-meta">
                <span class="badge ${l.free_slots > 0 ? 'badge-available' : 'badge-occupied'}">${l.free_slots} free slots</span>
                <span>${starsHtml(l.avg_rating)} ${Number(l.avg_rating).toFixed(1)} (${l.review_count})</span>
              </div>
            </div>
            <div class="lot-side">
              <div class="price">${formatCurrency(l.rate_per_hour)}<span class="small text-secondary">/hr</span></div>
              <div class="small text-secondary mb-16">≈ ${formatCurrency(l.estimated_cost)} for ${esc(fDur.value)} h</div>
              <button class="btn btn-primary" data-lot="${l.lot_id}" ${l.free_slots === 0 ? 'disabled' : ''}>Select This Lot</button>
            </div>
          </article>`).join('');
        refreshIcons();
    }

    $('#search-form').addEventListener('submit', (e) => { e.preventDefault(); runSearch(); });
    $('#results').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-lot]'); if (!btn) return;
        const lot = results.find((l) => l.lot_id === Number(btn.dataset.lot));
        store.set('sp_lot', { lot_id: lot.lot_id, lot_name: lot.lot_name });
        store.set('sp_search', Object.assign(store.get('sp_search', {}), { when: $('input[name=when]:checked').value }));
        window.location.href = 'slots.html';
    });
    runSearch();
});
