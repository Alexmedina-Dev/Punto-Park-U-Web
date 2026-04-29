// ===== STATE =====
let state = {
  activeReservation: null, // null | 'paid' | 'unpaid'
  vehicles: [
    {id:'1', plate:'ABC-123', type:'Carro', brand:'Chevrolet Spark', color:'Rojo', year:'2020'},
    {id:'2', plate:'XYZ-789', type:'Moto', brand:'Yamaha FZ', color:'Negro', year:'2021'}
  ],
  currentEdit: null,
  selectedType: 'Carro'
};

// ===== INIT =====
window.onload = function() {
  renderVehicles();
  renderActiveReservation();
  populateReserveSelect();
};

// ===== TAB NAVIGATION =====
function showTab(tab) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.bottom-tab').forEach(b => b.classList.remove('active'));

  document.getElementById('tab-' + tab).classList.add('active');

  const navEl = document.getElementById('nav-' + tab);
  if (navEl) navEl.classList.add('active');
  const btabEl = document.getElementById('btab-' + tab);
  if (btabEl) btabEl.classList.add('active');

  closeNotifDropdown();
  window.scrollTo({top:0, behavior:'smooth'});
}

// ===== NOTIFICATIONS DROPDOWN =====
function toggleNotifDropdown() {
  const d = document.getElementById('notifDropdown');
  d.classList.toggle('active');
}
function closeNotifDropdown() {
  document.getElementById('notifDropdown').classList.remove('active');
}
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown.contains(e.target) &&
      !e.target.closest('#notifBtnMobile') &&
      !e.target.closest('[onclick="toggleNotifDropdown()"]')) {
    closeNotifDropdown();
  }
});

// ===== ACTIVE RESERVATION =====
function renderActiveReservation() {
  const cont = document.getElementById('activeReservationContainer');
  if (!state.activeReservation) {
    cont.innerHTML = `
      <div class="reservation-card" style="text-align:center; padding:28px 24px;">
        <div class="no-res-icon">🚗</div>
        <div class="no-res-title">No tienes reservas activas</div>
        <button class="btn btn-primary" onclick="showTab('reserve')">📝 Hacer Reserva</button>
      </div>`;
  } else {
    const isPaid = state.activeReservation === 'paid';
    const statusClass = isPaid ? 'status-paid' : 'status-unpaid';
    const statusText = isPaid ? '✅ PAGADO' : '⚠️ SIN PAGAR';
    cont.innerHTML = `
      <div class="reservation-card">
        <div class="res-header">
          <div class="res-label">
            <div class="pulse-dot"></div> Reserva Activa
          </div>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="plate-big">ABC-123</div>
        <div class="res-meta">Chevrolet Spark · Rojo</div>
        <div class="res-info-grid" style="margin-top:18px;">
          <div class="res-info-item">
            <div class="res-info-icon">🅿️</div>
            <div>
              <div class="res-info-label">Espacio</div>
              <div class="res-info-value">A5</div>
            </div>
          </div>
          <div class="res-info-item">
            <div class="res-info-icon">⏰</div>
            <div>
              <div class="res-info-label">Tiempo Rest.</div>
              <div class="res-info-value danger">15:42</div>
            </div>
          </div>
        </div>
        <div class="btn-group" style="margin-top:16px;">
          <button class="btn btn-primary">💳 Pagar Extra</button>
          <button class="btn btn-danger" onclick="cancelReservation()" ${isPaid ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>❌ Cancelar</button>
        </div>
      </div>`;
  }
}

// ===== VEHICLES =====
function renderVehicles() {
  const list = document.getElementById('vehiclesList');
  list.innerHTML = '';
  state.vehicles.forEach(v => {
    const card = document.createElement('div');
    card.className = 'vehicle-card';
    card.innerHTML = `
      <div class="vc-header">
        <div class="vc-plate">${v.plate}</div>
        <div class="vc-type-badge">${v.type}</div>
      </div>
      <div class="vc-details">${v.brand} · ${v.color} · ${v.year}</div>
      <button class="btn btn-secondary btn-sm" onclick="openEditModal('${v.id}')">✏️ Editar</button>`;
    list.appendChild(card);
  });
}

function populateReserveSelect() {
  const sel = document.getElementById('reserveVehicle');
  sel.innerHTML = '';
  state.vehicles.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = `${v.plate} (${v.type})`;
    sel.appendChild(opt);
  });
}

// ===== EDIT VEHICLE =====
function openEditModal(id) {
  const v = state.vehicles.find(v => v.id === id);
  if (!v) return;
  state.currentEdit = id;
  document.getElementById('editPlate').value = v.plate;
  document.getElementById('editBrand').value = v.brand;
  document.getElementById('editColor').value = v.color;
  document.getElementById('editYear').value = v.year;
  openModal('editModal');
}

function saveEdit() {
  const brand = document.getElementById('editBrand').value.trim();
  const color = document.getElementById('editColor').value.trim();
  const year  = document.getElementById('editYear').value.trim();
  if (!brand || !color || !year) { showToast('⚠️ Completa todos los campos'); return; }
  const idx = state.vehicles.findIndex(v => v.id === state.currentEdit);
  if (idx !== -1) {
    state.vehicles[idx].brand = brand;
    state.vehicles[idx].color = color;
    state.vehicles[idx].year = year;
  }
  closeModal('editModal');
  renderVehicles();
  populateReserveSelect();
  showToast('✅ Vehículo actualizado');
}

function deleteVehicle() {
  if (!confirm('¿Eliminar este vehículo?')) return;
  state.vehicles = state.vehicles.filter(v => v.id !== state.currentEdit);
  closeModal('editModal');
  renderVehicles();
  populateReserveSelect();
  showToast('🗑️ Vehículo eliminado');
}

// ===== ADD VEHICLE =====
function openAddModal() {
  selectType('Carro');
  document.getElementById('addPlate').value = '';
  document.getElementById('addBrand').value = '';
  document.getElementById('addColor').value = '';
  document.getElementById('addYear').value = '';
  openModal('addModal');
}

function selectType(type) {
  state.selectedType = type;
  ['Carro','Moto','Bicicleta'].forEach(t => {
    const btn = document.getElementById('type' + t);
    if (btn) btn.classList.toggle('selected', t === type);
  });
  const isBici = type === 'Bicicleta';
  document.getElementById('fieldPlacaLabel').textContent = isBici ? 'Número de Serie / Marco' : 'Placa';
  document.getElementById('addPlate').placeholder = isBici ? 'Ej: SER-2023-001' : 'Ej: ABC-123';
  document.getElementById('fieldYearGroup').style.display = isBici ? 'none' : 'block';
}

function saveNewVehicle() {
  const plate = document.getElementById('addPlate').value.trim();
  const brand = document.getElementById('addBrand').value.trim();
  const color = document.getElementById('addColor').value.trim();
  const year  = document.getElementById('addYear').value.trim();
  const isBici = state.selectedType === 'Bicicleta';

  if (!plate || !brand || !color) { showToast('⚠️ Completa todos los campos'); return; }
  if (!isBici && !year) { showToast('⚠️ Ingresa el año'); return; }

  const duplicate = state.vehicles.find(v => v.plate.toUpperCase() === plate.toUpperCase());
  if (duplicate) { showToast('⚠️ Ese vehículo ya está registrado'); return; }

  state.vehicles.push({
    id: Date.now().toString(),
    plate: plate.toUpperCase(),
    type: state.selectedType,
    brand,
    color,
    year: isBici ? 'N/A' : year
  });

  closeModal('addModal');
  renderVehicles();
  populateReserveSelect();
  const msg = isBici ? '✅ Bicicleta registrada · Valida con el operador al ingresar' : '✅ Vehículo registrado · La cámara IA lo reconocerá';
  showToast(msg);
}

// ===== RESERVATIONS =====
function makeReservation() {
  const vehicleId = document.getElementById('reserveVehicle').value;
  const payment   = document.getElementById('reservePayment').value;
  const vehicle   = state.vehicles.find(v => v.id === vehicleId);

  if (!vehicle) { showToast('⚠️ Registra un vehículo primero'); return; }
  if (state.activeReservation) { showToast('⚠️ Ya tienes una reserva activa'); return; }

  if (payment === 'prepaid') {
    if (confirm(`💳 Pagar por PSE\n\nVehículo: ${vehicle.plate}\nMonto: $3.000\n\n¿Confirmar pago?`)) {
      showToast('🔄 Procesando pago...');
      setTimeout(() => {
        state.activeReservation = 'paid';
        renderActiveReservation();
        showTab('home');
        showToast('✅ Pago confirmado · Reserva activa');
      }, 1500);
    }
  } else {
    state.activeReservation = 'unpaid';
    renderActiveReservation();
    showTab('home');
    showToast('✅ Reserva confirmada · La cámara IA te reconocerá al ingresar');
  }
}

function cancelReservation() {
  if (state.activeReservation === 'paid') {
    showToast('❌ No puedes cancelar una reserva pagada');
    return;
  }
  if (confirm('¿Cancelar la reserva?')) {
    state.activeReservation = null;
    renderActiveReservation();
    showToast('✅ Reserva cancelada');
  }
}

// ===== PROFILE =====
function toggleProfileForm(show) {
  document.getElementById('profileDisplay').style.display = show ? 'none' : 'block';
  document.getElementById('profileForm').style.display   = show ? 'block' : 'none';
}

function saveProfile() {
  const name  = document.getElementById('profileName').value.trim();
  const email = document.getElementById('profileEmail').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  if (!name || !email || !phone) { showToast('⚠️ Completa todos los campos'); return; }
  document.getElementById('displayName').textContent  = name;
  document.getElementById('displayEmail').textContent = email;
  document.getElementById('displayPhone').textContent = phone;
  document.getElementById('sidebarName').textContent  = name;
  toggleProfileForm(false);
  showToast('✅ Datos actualizados');
}

// ===== PASSWORD =====
function changePassword() {
  const oldP = document.getElementById('passOld').value;
  const newP = document.getElementById('passNew').value;
  const conP = document.getElementById('passConfirm').value;
  if (!oldP || !newP || !conP) { showToast('⚠️ Completa todos los campos'); return; }
  if (newP.length < 6) { showToast('⚠️ Mínimo 6 caracteres'); return; }
  if (newP !== conP) { showToast('⚠️ Las contraseñas no coinciden'); return; }
  document.getElementById('passOld').value = '';
  document.getElementById('passNew').value = '';
  document.getElementById('passConfirm').value = '';
  closeModal('passwordModal');
  showToast('✅ Contraseña actualizada');
}

// ===== NOTIFICATIONS =====
function saveNotificationSettings() {
  const settings = {
    sms:      document.getElementById('notifSMS').checked,
    whatsapp: document.getElementById('notifWhatsApp').checked,
    push:     document.getElementById('notifPush').checked,
    ingreso:  document.getElementById('notifIngreso').checked,
    tiempo:   document.getElementById('notifTiempo').checked,
    vencido:  document.getElementById('notifVencido').checked,
    pago:     document.getElementById('notifPago').checked,
    nivel:    document.getElementById('notifNivel').checked,
    promo:    document.getElementById('notifPromo').checked
  };
  localStorage.setItem('notificationSettings', JSON.stringify(settings));
  closeModal('notifModal');
  showToast('✅ Preferencias de notificación guardadas');
}

// ===== LEVEL INFO =====
function showLevelInfo() {
  alert('🥇 Nivel ORO\n\n✅ Descuento del 10% en todas las reservas\n✅ Notificaciones prioritarias\n✅ Acceso a tarifas especiales de fin de semana\n\nSigue acumulando visitas para mantener tu nivel.');
}

// ===== MAPS =====
function openGoogleMaps() {
  window.open('https://www.google.com/maps/dir/?api=1&destination=4.6674,-74.0561', '_blank');
}
function openWaze() {
  window.open('https://waze.com/ul?ll=4.6674,-74.0561&navigate=yes', '_blank');
}

// ===== LOGOUT =====
function logout() {
  if (confirm('¿Cerrar sesión?')) {
    window.location.href = '../index.html';
  }
}

// ===== MODAL HELPERS =====
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}