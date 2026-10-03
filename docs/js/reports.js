/* Admin Reports - KPIs, four charts, top users. Charts redraw on theme change. */
document.addEventListener('DOMContentLoaded', async () => {
    const charts = {};
    let data = null;
    const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    if (typeof Chart === 'undefined') showToast('Charts could not load (Chart.js is unavailable offline).', 'warning');

    function base(extra = {}) {
        const text = css('--text-secondary'), grid = css('--border');
        return Object.assign({
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: css('--text') } } },
            scales: { x: { ticks: { color: text }, grid: { color: grid } }, y: { ticks: { color: text }, grid: { color: grid }, beginAtZero: true } }
        }, extra);
    }
    function draw(key, canvasId, config) {
        if (typeof Chart === 'undefined') return;
        if (charts[key]) charts[key].destroy();
        charts[key] = new Chart(document.getElementById(canvasId), config);
    }

    function renderCharts() {
        if (!data) return;
        const primary = css('--primary');
        const status = [css('--primary'), css('--available'), css('--maintenance'), css('--occupied'), css('--selected')];
        const byLot = {}; data.revenue.forEach((r) => { byLot[r.lot_name] = (byLot[r.lot_name] || 0) + Number(r.revenue); });
        draw('rev', 'chart-revenue', { type: 'bar', data: { labels: Object.keys(byLot), datasets: [{ label: 'Revenue (₹)', data: Object.values(byLot), backgroundColor: primary, borderRadius: 6 }] }, options: base({ plugins: { legend: { display: false } } }) });

        const hours = Array.from({ length: 24 }, (_, h) => h), hc = {}; data.peak.forEach((p) => { hc[p.hour_of_day] = Number(p.bookings); });
        draw('peak', 'chart-peak', { type: 'line', data: { labels: hours.map((h) => pad2(h) + ':00'), datasets: [{ label: 'Bookings', data: hours.map((h) => hc[h] || 0), borderColor: primary, backgroundColor: primary + '33', fill: true, tension: 0.35, pointRadius: 3 }] }, options: base({ plugins: { legend: { display: false } } }) });

        draw('split', 'chart-split', { type: 'doughnut', data: { labels: data.split.map((s) => s.vehicle_type), datasets: [{ data: data.split.map((s) => Number(s.bookings)), backgroundColor: status, borderColor: css('--surface'), borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: css('--text') } } } } });

        draw('util', 'chart-util', { type: 'bar', data: { labels: data.util.map((u) => u.lot_name), datasets: [{ label: 'Utilization (%)', data: data.util.map((u) => Number(u.utilization_pct)), backgroundColor: css('--selected'), borderRadius: 6 }] }, options: base({ indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { max: 100, beginAtZero: true, ticks: { color: css('--text-secondary') }, grid: { color: css('--border') } }, y: { ticks: { color: css('--text-secondary') }, grid: { color: css('--border') } } } }) });
    }
    document.addEventListener('themechange', renderCharts);

    const [summary, revenue, peak, split, util, top] = await Promise.all([
        safe(getReportSummary), safe(getRevenueReport), safe(getPeakHours), safe(getVehicleSplit), safe(getUtilization), safe(getTopUsers)
    ]);
    if (summary) {
        const k = [["Today's Revenue", formatCurrency(summary.today_revenue), 'credit-card'], ['Total Bookings', summary.total_bookings, 'calendar-check'], ['Avg Duration', formatDuration(summary.avg_duration), 'clock'], ['Pending Payments', summary.pending_payments, 'alert-triangle']];
        $('#kpis').innerHTML = k.map(([l, v, icon]) => `<div class="card"><div class="stat-top"><div class="stat-icon"><i data-lucide="${icon}"></i></div><div class="stat-label">${l}</div></div><div class="stat-value ${String(v).length > 8 ? 'sm' : ''}">${esc(v)}</div></div>`).join('');
    }
    data = { revenue: revenue || [], peak: peak || [], split: split || [], util: util || [] };
    renderCharts();
    $('#top-rows').innerHTML = top && top.length ? top.map((u, i) => `<tr><td class="num">${i + 1}</td><td>${esc(u.full_name)}</td><td class="num">${esc(u.bookings)}</td><td class="num">${formatCurrency(u.total_spent)}</td></tr>`).join('') : emptyRow(4, 'No completed bookings yet', 'users');
    refreshIcons();
});
