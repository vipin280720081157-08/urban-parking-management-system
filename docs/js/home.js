/* Home - user picker, live stats, module cards. */
document.addEventListener('DOMContentLoaded', () => {
    let users = [];
    let editingId = null;
    const select = $('#user-select');

    async function loadStats() {
        const s = await safe(getReportSummary);
        if (!s) { $('#stats').innerHTML = '<div class="card empty" style="grid-column:1/-1">Statistics are unavailable right now.</div>'; return; }
        const items = [
            ['Total Lots', s.total_lots, 'map-pin'], ['Free Slots', s.free_slots, 'grid-3x3'], ['Active Bookings', s.active_bookings, 'clock'],
            ["Today's Revenue", formatCurrency(s.today_revenue), 'credit-card'], ['Total Users', s.total_users, 'users'], ['Avg Rating', Number(s.avg_rating).toFixed(1) + ' / 5', 'star']
        ];
        $('#stats').innerHTML = items.map(([label, val, icon]) => `
            <div class="card"><div class="stat-top"><div class="stat-icon"><i data-lucide="${icon}"></i></div><div class="stat-label">${label}</div></div>
            <div class="stat-value ${String(val).length > 8 ? 'sm' : ''}">${esc(val)}</div></div>`).join('');
        refreshIcons();
    }

    async function loadUsers(selectId) {
        const list = await safe(getUsers);
        if (!list) return;
        users = list;
        const saved = selectId || (getCurrentUser() || {}).user_id;
        select.innerHTML = '<option value="">Select a user…</option>' + users.map((u) => `<option value="${u.user_id}">${esc(u.full_name)}</option>`).join('');
        const found = users.find((u) => u.user_id === Number(saved));
        if (found) { select.value = found.user_id; setCurrentUser(found); } else { setCurrentUser(null); }
        updateButtons();
    }

    function updateButtons() {
        const has = !!select.value;
        $('#btn-edit-user').disabled = !has; $('#btn-delete-user').disabled = !has;
    }

    select.addEventListener('change', () => {
        const u = users.find((x) => x.user_id === Number(select.value));
        setCurrentUser(u || null); updateButtons();
        if (u) showToast('Welcome, ' + u.full_name, 'success');
    });

    function openUserModal(user) {
        editingId = user ? user.user_id : null;
        $('#user-modal-title').textContent = user ? 'Edit user' : 'Add new user';
        $('#u-name').value = user ? user.full_name : ''; $('#u-email').value = user ? user.email : ''; $('#u-phone').value = user ? user.phone : '';
        clearErrors($('#user-form'));
        openModal('user-modal');
    }
    $('#btn-add-user').addEventListener('click', () => openUserModal(null));
    $('#btn-edit-user').addEventListener('click', () => openUserModal(users.find((u) => u.user_id === Number(select.value))));

    $('#user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target; clearErrors(form);
        const name = $('#u-name'), email = $('#u-email'), phone = $('#u-phone');
        let ok = true;
        if (name.value.trim().length < 2) { setFieldError(name, 'Enter the full name'); ok = false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setFieldError(email, 'Enter a valid email address'); ok = false; }
        if (!/^\d{10}$/.test(phone.value.trim())) { setFieldError(phone, 'Enter a 10-digit phone number'); ok = false; }
        if (!ok) return;
        const data = { full_name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim() };
        const btn = $('#u-save'); setBusy(btn, true, 'Saving…');
        const res = await safe(() => (editingId ? updateUser(editingId, data) : createUser(data)));
        setBusy(btn, false);
        if (!res) return;
        closeModal('user-modal');
        showToast(editingId ? 'User updated' : 'User added', 'success');
        await loadUsers(res.user_id); loadStats();
    });

    $('#btn-delete-user').addEventListener('click', async () => {
        const u = users.find((x) => x.user_id === Number(select.value));
        if (!u || !confirm('Delete ' + u.full_name + '? Their vehicles and reviews will also be removed.')) return;
        const res = await safe(() => deleteUser(u.user_id));
        if (res === undefined) return;
        showToast('User deleted', 'success');
        if ((getCurrentUser() || {}).user_id === u.user_id) setCurrentUser(null);
        await loadUsers(); loadStats();
    });

    $('#get-started').addEventListener('click', () => { $('#picker').scrollIntoView({ behavior: 'smooth' }); select.focus(); });

    if (param('need') === 'user') showToast('Please pick a user to continue.', 'info');
    if (CONFIG.MODE === 'MOCK') $('#mode-note').classList.remove('hidden');
    $('#reset-demo') && $('#reset-demo').addEventListener('click', () => { resetMockData(); showToast('Demo data reset', 'success'); loadUsers(); loadStats(); });
    loadUsers(); loadStats();
});
