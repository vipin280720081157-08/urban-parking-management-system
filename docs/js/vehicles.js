/* My Vehicles - add / edit / delete / choose the vehicle to park. */
document.addEventListener('DOMContentLoaded', () => {
    const user = requireUser(); if (!user) return;
    let vehicles = [];
    const form = $('#vehicle-form');
    const fNum = $('#v-number'), fType = $('#v-type'), fModel = $('#v-model'), fId = $('#v-id');
    $('#owner-name').textContent = user.full_name;

    async function load() {
        const list = await safe(() => getVehicles(user.user_id));
        if (!list) { $('#vehicle-rows').innerHTML = emptyRow(5, 'Could not load vehicles', 'alert-circle'); refreshIcons(); return; }
        vehicles = list; render();
    }

    function render() {
        const chosen = store.get('sp_vehicle');
        $('#vehicle-rows').innerHTML = vehicles.length ? vehicles.map((v, i) => `
            <tr>
              <td class="num">${i + 1}</td>
              <td class="num">${esc(v.vehicle_number)} ${chosen === v.vehicle_id ? '<span class="badge badge-active">In use</span>' : ''}</td>
              <td><span class="badge badge-type">${esc(v.vehicle_type)}</span></td>
              <td>${esc(v.model || '-')}</td>
              <td>
                <button class="icon-btn sm" data-act="use" data-id="${v.vehicle_id}" title="Use for parking"><i data-lucide="check-circle"></i></button>
                <button class="icon-btn sm view" data-act="view" data-id="${v.vehicle_id}" title="View"><i data-lucide="eye"></i></button>
                <button class="icon-btn sm edit" data-act="edit" data-id="${v.vehicle_id}" title="Edit"><i data-lucide="pencil"></i></button>
                <button class="icon-btn sm delete" data-act="delete" data-id="${v.vehicle_id}" title="Delete"><i data-lucide="trash-2"></i></button>
              </td>
            </tr>`).join('') : emptyRow(5, 'No vehicles yet. Add your first vehicle using the form.', 'car');
        refreshIcons();
    }

    function resetForm() {
        form.reset(); fId.value = ''; clearErrors(form);
        $('#form-title').textContent = 'Add a vehicle'; $('#v-save').innerHTML = '<i data-lucide="plus"></i> Add vehicle'; $('#v-cancel').classList.add('hidden');
        refreshIcons();
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); clearErrors(form);
        let ok = true;
        const num = fNum.value.trim().toUpperCase();
        if (!/^[A-Z]{2}-?\d{2}-?[A-Z]{1,3}-?\d{4}$/.test(num)) { setFieldError(fNum, 'Use the format TN-37-AB-1234'); ok = false; }
        if (!fType.value) { setFieldError(fType, 'Choose a vehicle type'); ok = false; }
        if (!ok) return;
        const data = { user_id: user.user_id, vehicle_number: num, vehicle_type: fType.value, model: fModel.value.trim() };
        const editing = !!fId.value;
        const btn = $('#v-save'); setBusy(btn, true, 'Saving…');
        const res = await safe(() => (editing ? updateVehicle(fId.value, data) : createVehicle(data)));
        setBusy(btn, false);
        if (!res) return;
        showToast(editing ? 'Vehicle updated' : 'Vehicle added', 'success');
        if (!store.get('sp_vehicle')) store.set('sp_vehicle', res.vehicle_id);
        resetForm(); load();
    });
    $('#v-cancel').addEventListener('click', resetForm);

    $('#vehicle-rows').addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-act]'); if (!btn) return;
        const v = vehicles.find((x) => x.vehicle_id === Number(btn.dataset.id)); if (!v) return;
        if (btn.dataset.act === 'use') { store.set('sp_vehicle', v.vehicle_id); store.set('sp_search', Object.assign(store.get('sp_search', {}), { type: v.vehicle_type })); showToast(v.vehicle_number + ' selected for parking', 'success'); render(); }
        if (btn.dataset.act === 'view') {
            $('#view-body').innerHTML = `<dl class="kv"><dt>Number</dt><dd class="mono">${esc(v.vehicle_number)}</dd><dt>Type</dt><dd>${esc(v.vehicle_type)}</dd><dt>Model</dt><dd>${esc(v.model || '-')}</dd><dt>Owner</dt><dd>${esc(user.full_name)}</dd><dt>Added on</dt><dd>${formatDate(v.created_at)}</dd></dl>`;
            openModal('view-modal');
        }
        if (btn.dataset.act === 'edit') {
            fId.value = v.vehicle_id; fNum.value = v.vehicle_number; fType.value = v.vehicle_type; fModel.value = v.model || '';
            $('#form-title').textContent = 'Edit vehicle'; $('#v-save').innerHTML = '<i data-lucide="save"></i> Update vehicle'; $('#v-cancel').classList.remove('hidden');
            refreshIcons(); fNum.focus(); window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (btn.dataset.act === 'delete') {
            if (!confirm('Delete vehicle ' + v.vehicle_number + '?')) return;
            const res = await safe(() => deleteVehicle(v.vehicle_id));
            if (res === undefined) return;
            if (store.get('sp_vehicle') === v.vehicle_id) store.remove('sp_vehicle');
            showToast('Vehicle deleted', 'success'); load();
        }
    });
    load();
});
