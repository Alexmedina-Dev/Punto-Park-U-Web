// Cargar datos guardados del localStorage
window.onload = function() {
    loadSavedData();
    updatePreview();
    updateSchedulePreview();
};

function loadSavedData() {
    const savedPrices = JSON.parse(localStorage.getItem('parkingPrices'));
    const savedSchedule = JSON.parse(localStorage.getItem('parkingSchedule'));

    if (savedPrices) {
        document.getElementById('carHour').value = savedPrices.car.hour;
        document.getElementById('carDay').value = savedPrices.car.day;
        document.getElementById('carMonth').value = savedPrices.car.month;
        document.getElementById('motoHour').value = savedPrices.moto.hour;
        document.getElementById('motoDay').value = savedPrices.moto.day;
        document.getElementById('motoMonth').value = savedPrices.moto.month;
        document.getElementById('bikeHour').value = savedPrices.bike.hour;
        document.getElementById('bikeDay').value = savedPrices.bike.day;
        document.getElementById('bikeMonth').value = savedPrices.bike.month;
    }

    if (savedSchedule) {
        document.getElementById('weekdayOpen').value = savedSchedule.weekday.open;
        document.getElementById('weekdayClose').value = savedSchedule.weekday.close;
        document.getElementById('sundayOpen').value = savedSchedule.sunday.open;
        document.getElementById('sundayClose').value = savedSchedule.sunday.close;
    }
}

// Funciones de Modal
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    if (modalId === 'pricesModal') updatePreview();
    if (modalId === 'scheduleModal') updateSchedulePreview();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Preview de Precios
function updatePreview() {
    const preview = document.getElementById('pricePreview');
    preview.innerHTML = `
        <div class="preview-item">
            <strong>🚗 Carros - Hora</strong>
            ${formatPrice(document.getElementById('carHour').value)}
        </div>
        <div class="preview-item">
            <strong>🚗 Carros - Día</strong>
            ${formatPrice(document.getElementById('carDay').value)}
        </div>
        <div class="preview-item">
            <strong>🚗 Carros - Mes</strong>
            ${formatPrice(document.getElementById('carMonth').value)}
        </div>
        <div class="preview-item">
            <strong>🏍️ Motos - Hora</strong>
            ${formatPrice(document.getElementById('motoHour').value)}
        </div>
        <div class="preview-item">
            <strong>🏍️ Motos - Día</strong>
            ${formatPrice(document.getElementById('motoDay').value)}
        </div>
        <div class="preview-item">
            <strong>🏍️ Motos - Mes</strong>
            ${formatPrice(document.getElementById('motoMonth').value)}
        </div>
        <div class="preview-item">
            <strong>🚴 Bicicletas - Hora</strong>
            ${formatPrice(document.getElementById('bikeHour').value)}
        </div>
        <div class="preview-item">
            <strong>🚴 Bicicletas - Día</strong>
            ${formatPrice(document.getElementById('bikeDay').value)}
        </div>
        <div class="preview-item">
            <strong>🚴 Bicicletas - Mes</strong>
            ${formatPrice(document.getElementById('bikeMonth').value)}
        </div>
    `;
}

function formatPrice(price) {
    return parseInt(price).toLocaleString('es-CO');
}

// Guardar Precios
function savePrices() {
    const prices = {
        car: {
            hour: document.getElementById('carHour').value,
            day: document.getElementById('carDay').value,
            month: document.getElementById('carMonth').value
        },
        moto: {
            hour: document.getElementById('motoHour').value,
            day: document.getElementById('motoDay').value,
            month: document.getElementById('motoMonth').value
        },
        bike: {
            hour: document.getElementById('bikeHour').value,
            day: document.getElementById('bikeDay').value,
            month: document.getElementById('bikeMonth').value
        }
    };

    localStorage.setItem('parkingPrices', JSON.stringify(prices));
    
    // Agregar al historial
    addToHistory('Se modificaron los precios del parqueadero');
    
    // Mostrar confirmación
    alert('✅ Precios actualizados correctamente');
    closeModal('pricesModal');
}

// Preview de Horarios
function updateSchedulePreview() {
    const weekdayOpen = document.getElementById('weekdayOpen').value;
    const weekdayClose = document.getElementById('weekdayClose').value;
    const sundayOpen = document.getElementById('sundayOpen').value;
    const sundayClose = document.getElementById('sundayClose').value;

    const preview = document.getElementById('schedulePreview');
    preview.innerHTML = `
        <div class="preview-item" style="margin-bottom: 10px;">
            <strong>📅 Lunes a Sábado</strong>
            ${formatTime(weekdayOpen)} - ${formatTime(weekdayClose)}
        </div>
        <div class="preview-item">
            <strong>🎉 Domingo y Festivos</strong>
            ${formatTime(sundayOpen)} - ${formatTime(sundayClose)}
        </div>
    `;
}

function formatTime(time) {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayHour}:${minute} ${ampm}`;
}

// Guardar Horarios
function saveSchedule() {
    const schedule = {
        weekday: {
            open: document.getElementById('weekdayOpen').value,
            close: document.getElementById('weekdayClose').value
        },
        sunday: {
            open: document.getElementById('sundayOpen').value,
            close: document.getElementById('sundayClose').value
        }
    };

    localStorage.setItem('parkingSchedule', JSON.stringify(schedule));
    
    // Agregar al historial
    addToHistory('Se actualizaron los horarios de atención');
    
    // Mostrar confirmación
    alert('✅ Horarios actualizados correctamente');
    closeModal('scheduleModal');
}

// Seleccionar Reporte
let selectedReportType = null;

function selectReport(type) {
    selectedReportType = type;
    
    // Remover selección anterior
    document.querySelectorAll('.report-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Marcar el seleccionado
    event.target.closest('.report-card').classList.add('selected');
}

// Descargar Reporte
function downloadReport(format) {
    if (!selectedReportType) {
        alert('⚠️ Por favor selecciona un tipo de reporte');
        return;
    }

    const reportNames = {
        daily: 'Reporte Diario',
        monthly: 'Reporte Mensual',
        vehicle: 'Reporte por Vehículo',
        financial: 'Reporte Financiero'
    };

    const formatNames = {
        pdf: 'PDF',
        excel: 'Excel'
    };

    // Simular descarga
    alert(`📥 Descargando ${reportNames[selectedReportType]} en formato ${formatNames[format]}...\n\n` +
          `Contenido del informe según normativa colombiana:\n` +
          `✅ Placa del vehículo\n` +
          `✅ Tipo de vehículo\n` +
          `✅ Fecha y hora de ingreso/salida\n` +
          `✅ Nombre del conductor\n` +
          `✅ Tarifa cobrada\n` +
          `✅ Método de pago\n\n` +
          `(La descarga real se implementará con la base de datos)`);

    // Agregar al historial
    addToHistory(`Se generó ${reportNames[selectedReportType]} en ${formatNames[format]}`);
    
    closeModal('reportsModal');
    selectedReportType = null;
    
    // Remover selección
    document.querySelectorAll('.report-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// Agregar al Historial
function addToHistory(action) {
    const now = new Date();
    const time = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    
    const historyContainer = document.getElementById('historyContainer');
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <div class="time">Hoy, ${time}</div>
        <div class="action">${action}</div>
    `;
    
    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
    
    // Limitar a 10 items
    while (historyContainer.children.length > 10) {
        historyContainer.removeChild(historyContainer.lastChild);
    }
}

// Actualizar estadísticas (simulado - se conectará con BD después)
function updateStats() {
    // Estas estadísticas se actualizarán desde la base de datos
    // Por ahora son valores de ejemplo
}

setInterval(updateStats, 30000); // Actualizar cada 30 segundos
