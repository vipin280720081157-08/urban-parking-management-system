/* SmartPark - shared UI helpers. */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const param = (name) => new URLSearchParams(window.location.search).get(name);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const refreshIcons = () => { if (window.lucide) lucide.createIcons(); };

/* ---------- storage ---------- */
const store = {
    get(key, fallback = null) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ } },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
};
const getCurrentUser = () => store.get('sp_user');
function setCurrentUser(user) {
    if (user) store.set('sp_user', user); else store.remove('sp_user');
    renderUserBadge();
}
/* Pages that need a user send the visitor to Home when none is chosen. */
function requireUser() {
    const u = getCurrentUser();
    if (!u) { window.location.href = 'index.html?need=user'; return null; }
    return u;
}

/* ---------- formatting ---------- */
const formatCurrency = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toDate = (d) => (d instanceof Date ? d : new Date(d));
const formatDate = (d) => d ? toDate(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const formatTime = (d) => d ? toDate(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-';
const formatDateTime = (d) => d ? formatDate(d) + ', ' + formatTime(d) : '-';
function formatDuration(minutes) {
    const m = Math.max(0, Math.round(Number(minutes) || 0));
    const h = Math.floor(m / 60);
    return h ? `${h}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`;
}
const pad2 = (n) => String(n).padStart(2, '0');
const formatClock = (sec) => `${pad2(Math.floor(sec / 3600))}:${pad2(Math.floor((sec % 3600) / 60))}:${pad2(sec % 60)}`;

/* ---------- billing (same rules as the database trigger) ---------- */
function calcBill(minutes, rule, type) {
    const r = rule || { rate_per_hour: 30, daily_max: 200, grace_minutes: 10, ev_surcharge: 0 };
    const rate = Number(r.rate_per_hour), cap = Number(r.daily_max), grace = Number(r.grace_minutes);
    const out = { minutes, hours: 0, rate, base: 0, graceApplied: false, capDiscount: 0, evSurcharge: 0, overtime: 0, total: 0 };
    if (minutes <= grace) { out.graceApplied = true; return out; }
    out.hours = Math.ceil(minutes / 60);
    out.base = out.hours * rate;
    if (out.base > cap) { out.capDiscount = out.base - cap; }
    out.evSurcharge = type === 'EV' ? Number(r.ev_surcharge) : 0;
    out.total = out.base - out.capDiscount + out.evSurcharge;
    return out;
}

/* ---------- toasts ---------- */
function showToast(message, type = 'info') {
    let wrap = $('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    const icons = { success: 'check-circle', error: 'alert-circle', info: 'info', warning: 'alert-triangle' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i data-lucide="${icons[type] || 'info'}"></i><div><strong>${esc(type)}</strong><span>${esc(message)}</span></div>`;
    wrap.appendChild(el);
    refreshIcons();
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 260); }, 3000);
}

/* ---------- modals ---------- */
function openModal(id) { const m = document.getElementById(id); if (m) { m.classList.add('open'); const f = $('input,select,textarea,button.btn', m); if (f) setTimeout(() => f.focus(), 50); } }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }
document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
    const closer = e.target.closest('[data-close-modal]');
    if (closer) closeModal(closer.getAttribute('data-close-modal'));
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal-overlay.open').forEach((m) => m.classList.remove('open')); });

/* ---------- form helpers ---------- */
function setFieldError(input, message) {
    input.classList.toggle('invalid', !!message);
    let err = input.parentElement.querySelector('.field-error');
    if (message) { if (!err) { err = document.createElement('div'); err.className = 'field-error'; input.parentElement.appendChild(err); } err.textContent = message; }
    else if (err) err.remove();
}
function clearErrors(root) { $$('.invalid', root).forEach((i) => setFieldError(i, '')); }
function setBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) { btn.dataset.label = btn.innerHTML; btn.disabled = true; if (label) btn.textContent = label; }
    else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; refreshIcons(); }
}
const starsHtml = (n) => `<span class="stars" title="${n} / 5">${[1, 2, 3, 4, 5].map((i) => `<i data-lucide="star" ${i <= Math.round(n) ? 'fill="currentColor"' : ''}></i>`).join('')}</span>`;
const badge = (status) => `<span class="badge badge-${esc(status)}">${esc(String(status).replace('_', ' '))}</span>`;
const emptyRow = (cols, text, icon = 'inbox') => `<tr><td colspan="${cols}"><div class="empty"><i data-lucide="${icon}"></i><div>${esc(text)}</div></div></td></tr>`;
/* Run an async action; show an error toast when it fails. */
async function safe(fn) { try { return await fn(); } catch (err) { showToast(err.message || 'Something went wrong', 'error'); return undefined; } }

/* ---------- navbar ---------- */
const NAV_PAGES = {
    'index.html': 'home', 'vehicles.html': 'home', 'search.html': 'search', 'slots.html': 'search',
    'booking.html': 'bookings', 'session.html': 'bookings', 'bill.html': 'bookings', 'history.html': 'bookings', 'reports.html': 'reports'
};
function renderNavbar() {
    const host = document.getElementById('navbar');
    if (!host) return;
    const file = window.location.pathname.split('/').pop() || 'index.html';
    const current = NAV_PAGES[file] || 'home';
    const links = [['home', 'index.html', 'home', 'Home'], ['search', 'search.html', 'search', 'Search'], ['bookings', 'history.html', 'calendar-check', 'Bookings'], ['reports', 'reports.html', 'bar-chart-3', 'Reports']];
    host.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="navbar"><div class="navbar-inner">
        <a class="logo" href="index.html"><i data-lucide="square-parking"></i><span>SmartPark</span></a>
        <nav class="nav-links" id="nav-links" aria-label="Main">
          ${links.map(([k, href, icon, label]) => `<a class="nav-link ${k === current ? 'active' : ''}" href="${href}" ${k === current ? 'aria-current="page"' : ''}><i data-lucide="${icon}"></i>${label}</a>`).join('')}
        </nav>
        <div class="nav-right">
          <button class="icon-btn" id="theme-toggle" type="button" aria-label="Toggle theme"></button>
          <a class="user-badge" id="user-badge" href="index.html" title="Change user"></a>
          <button class="icon-btn hamburger" id="hamburger" type="button" aria-label="Menu"><i data-lucide="menu"></i></button>
        </div>
      </div></header>`;
    $('#hamburger').addEventListener('click', () => $('#nav-links').classList.toggle('open'));
    renderUserBadge();
    initTheme();
    refreshIcons();
}
function renderUserBadge() {
    const el = document.getElementById('user-badge');
    if (!el) return;
    const u = getCurrentUser();
    const initials = u ? u.full_name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() : '?';
    el.innerHTML = `<span class="avatar">${esc(initials)}</span><span class="name">${u ? esc(u.full_name) : 'Select user'}</span>`;
}
document.addEventListener('DOMContentLoaded', renderNavbar);
