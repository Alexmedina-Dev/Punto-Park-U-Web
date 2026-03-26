let state = {
    activeReservation: null,
    vehicles: [
        {id: '1', plate: 'ABC-123', type: 'Carro', brand: 'Chevrolet Spark', color: 'Rojo', year: '2020'},
        {id: '2', plate: 'XYZ-789', type: 'Moto', brand: 'Yamaha FZ', color: 'Negro', year: '2021'}
    ],
    currentEdit: null
};

window.onload = function() {
    renderVehicles();
    renderActiveVehicle();
};

function renderVehicles() {
    const list = document.getElementById('vehiclesList');
    list.innerHTML = '';
    state.vehicles.forEach(v => {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.innerHTML = `
            <div class="vehicle-header">
                <div class="vehicle-plate">${v.plate}</div>
                <div class="vehicle-type">${v.type}</div>
            </div>
            <div class="vehicle-details">${v.brand} • ${v.color} • ${v.year}</div>
            <button class="btn btn-secondary" onclick="editVehicle('${v.id}')">✏️ Editar</button>
        `;
        list.appendChild(card);
    });

    const select = document.getElementById('reserveVehicle');
    select.innerHTML = '';
    state.vehicles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.plate} (${v.type})`;
        select.appendChild(opt);
    });
}

function renderActiveVehicle() {
    const cont = document.getElementById('activeVehicleContainer');
    if (!state.activeReservation) {
        cont.innerHTML = `
            <div class="active-vehicle">
                <div class="no-vehicle">
                    <div class="no-vehicle-icon">🚗</div>
                    <h3 style="color: #1e3c72;">No tienes reservas activas</h3>
                    <button class="btn btn-primary" onclick="showSection('reserveSection')">📝 Hacer Reserva</button>
                </div>
            </div>
        `;
    } else {
        const isPaid = state.activeReservation === 'paid';
        cont.innerHTML = `
            <div class="active-vehicle">
                <h3>🚗 Vehículo Activo</h3>
                <div class="vehicle-info">
                    <div class="vehicle-row"><span class="vehicle-label">Placa:</span><span class="vehicle-value">ABC-123</span></div>
                    <div class="vehicle-row"><span class="vehicle-label">Espacio:</span><span class="vehicle-value">A5</span></div>
                    <div class="vehicle-row"><span class="vehicle-label">Estado:</span><span class="status-badge ${isPaid ? 'status-ok' : 'status-warning'}">${isPaid ? 'PAGADO' : 'SIN PAGAR'}</span></div>
                </div>
                <div class="button-group">
                    <button class="btn btn-primary">💳 Pagar Extra</button>
                    <button class="btn btn-danger" onclick="cancelReservation()" ${isPaid ? 'disabled style="opacity:0.5;"' : ''}>❌ Cancelar</button>
                </div>
            </div>
        `;
    }
}

function addVehicle() {
    const type = prompt('Tipo:\n1=Carro\n2=Moto\n3=Bicicleta');
    if (!type) return;

    let typeText = type === '1' ? 'Carro' : type === '2' ? 'Moto' : 'Bicicleta';
    let identifier;

    if (type === '3') {
        identifier = prompt('Número de Serie/Marco de la bicicleta:');
        if (!identifier) return;
        const brand = prompt('Marca:') || 'N/A';
        const color = prompt('Color:') || 'N/A';
        state.vehicles.push({
            id: Date.now().toString(),
            plate: identifier,
            type: typeText,
            brand: brand,
            color: color,
            year: 'N/A'
        });
        alert('✅ Bicicleta registrada\n\n📸 Valida con el operador al ingresar');
    } else {
        identifier = prompt('Ingrese la placa:');
        if (!identifier) return;
        const brand = prompt('Marca y modelo:') || 'N/A';
        const color = prompt('Color:') || 'N/A';
        const year = prompt('Año:') || 'N/A';
        state.vehicles.push({
            id: Date.now().toString(),
            plate: identifier,
            type: typeText,
            brand: brand,
            color: color,
            year: year
        });
        alert('✅ Vehículo registrado\n\n📹 La cámara IA lo reconocerá');
    }
    renderVehicles();
}

function editVehicle(id) {
    const vehicle = state.vehicles.find(v => v.id === id);
    if (!vehicle) return;
    
    state.currentEdit = id;
    document.getElementById('editPlate').value = vehicle.plate;
    document.getElementById('editBrand').value = vehicle.brand;
    document.getElementById('editColor').value = vehicle.color;
    document.getElementById('editYear').value = vehicle.year;
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    state.currentEdit = null;
}

function saveEdit() {
    const brand = document.getElementById('editBrand').value;
    const color = document.getElementById('editColor').value;
    const year = document.getElementById('editYear').value;
    
    if (!brand || !color || !year) {
        alert('⚠️ Completa todos los campos');
        return;
    }

    const index = state.vehicles.findIndex(v => v.id === state.currentEdit);
    if (index !== -1) {
        state.vehicles[index].brand = brand;
        state.vehicles[index].color = color;
        state.vehicles[index].year = year;
    }

    alert('✅ Vehículo actualizado');
    closeEditModal();
    renderVehicles();
}

function deleteVehicle() {
    if (!confirm('¿Eliminar este vehículo?')) return;
    
    state.vehicles = state.vehicles.filter(v => v.id !== state.currentEdit);
    alert('✅ Vehículo eliminado');
    closeEditModal();
    renderVehicles();
}

function makeReservation() {
    const vehicleId = document.getElementById('reserveVehicle').value;
    const payment = document.getElementById('reservePayment').value;
    const vehicle = state.vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
        alert('⚠️ Selecciona un vehículo');
        return;
    }

    const isPrepaid = payment.includes('Prepagar');

    if (isPrepaid) {
        if (confirm(`💳 Pagar por PSE\n\nVehículo: ${vehicle.plate}\nMonto: $3.000\n\n¿Confirmar?`)) {
            alert('🔄 Redirigiendo a PSE...');
            setTimeout(() => {
                state.activeReservation = 'paid';
                alert('✅ Pago confirmado\n\nReserva activa');
                renderActiveVehicle();
                showSection('homeSection');
            }, 1500);
        }
    } else {
        state.activeReservation = 'unpaid';
        alert(`✅ Reserva confirmada (sin pago previo)\n\nVehículo: ${vehicle.plate}\n\n📹 La cámara IA te reconocerá al ingresar al parqueadero\n💰 Pagarás al salir`);
        renderActiveVehicle();
        showSection('homeSection');
    }
}

function cancelReservation() {
    if (state.activeReservation === 'paid') {
        alert('❌ No puedes cancelar una reserva pagada\n\nNo hay devoluciones por PSE');
        return;
    }

    if (confirm('¿Cancelar la reserva?')) {
        state.activeReservation = null;
        alert('✅ Reserva cancelada');
        renderActiveVehicle();
    }
}

function showProfileEdit() {
    document.getElementById('profileForm').style.display = 'block';
    document.getElementById('btnEditProfile').style.display = 'none';
}

function cancelProfileEdit() {
    document.getElementById('profileForm').style.display = 'none';
    document.getElementById('btnEditProfile').style.display = 'block';
}

function saveProfile() {
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('profilePhone').value;

    if (!name || !email || !phone) {
        alert('⚠️ Completa todos los campos');
        return;
    }

    document.getElementById('displayName').textContent = name;
    document.getElementById('displayEmail').textContent = email;
    document.getElementById('displayPhone').textContent = phone;

    alert('✅ Datos actualizados');
    cancelProfileEdit();
}

function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    
    document.getElementById(id).classList.add('active');
    
    const tabs = ['homeSection', 'vehiclesSection', 'reserveSection', 'locationSection', 'profileSection'];
    const index = tabs.indexOf(id);
    if (index !== -1) {
        document.querySelectorAll('.tab-item')[index].classList.add('active');
    }
    
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function logout() {
    if (confirm('¿Cerrar sesión?')) {
        window.location.href = '../index.html';
    }
}

function showNotifications() {
    alert('📬 Notificaciones:\n\n1. Tu tiempo termina en 15min\n2. Promoción: 10% descuento\n3. Has alcanzado nivel ORO 🥇');
}

function openGoogleMaps() {
    window.open('https://www.google.com/maps/dir/?api=1&destination=4.6674,-74.0561', '_blank');
}

function openWaze() {
    window.open('https://waze.com/ul?ll=4.6674,-74.0561&navigate=yes', '_blank');
}

function changePassword() {
    const newPass = prompt('Ingrese nueva contraseña (mínimo 6 caracteres):');
    if (newPass && newPass.length >= 6) {
        alert('✅ Contraseña actualizada correctamente');
    } else if (newPass) {
        alert('❌ La contraseña debe tener al menos 6 caracteres');
    }
}

function showNotificationSettings() {
    document.getElementById('notificationModal').classList.add('active');
}

function closeNotificationModal() {
    document.getElementById('notificationModal').classList.remove('active');
}

function saveNotificationSettings() {
    const settings = {
        sms: document.getElementById('notifSMS').checked,
        whatsapp: document.getElementById('notifWhatsApp').checked,
        email: document.getElementById('notifEmail').checked,
        push: document.getElementById('notifPush').checked,
        ingreso: document.getElementById('notifIngreso').checked,
        tiempo: document.getElementById('notifTiempo').checked,
        vencido: document.getElementById('notifVencido').checked,
        pago: document.getElementById('notifPago').checked,
        nivel: document.getElementById('notifNivel').checked,
        promo: document.getElementById('notifPromo').checked
    };

    // Guardar en localStorage (temporal, se conectará con BD)
    localStorage.setItem('notificationSettings', JSON.stringify(settings));

    let canales = [];
    if (settings.sms) canales.push('SMS');
    if (settings.whatsapp) canales.push('WhatsApp');
    if (settings.email) canales.push('Email');
    if (settings.push) canales.push('Push');

    alert(`✅ Configuración guardada\n\nCanales activos: ${canales.join(', ')}\n\nRecibirás notificaciones según tu configuración.`);
    closeNotificationModal();
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
}
