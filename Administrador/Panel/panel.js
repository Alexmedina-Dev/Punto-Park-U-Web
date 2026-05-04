/* ══════════════════════════════════════════
   PUNTO PARK U — Panel Admin JS
   Compatible con el diseño nuevo 100%
══════════════════════════════════════════ */

// ─── Estado global ───────────────────────
let selectedReportType = null;

// ─── Init ─────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    updatePricePreview();
    updateSchedulePreview();
    labelPriceCellsForMobile();
});

// ─── SIDEBAR MÓVIL ────────────────────────
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}

// ─── MODALES ──────────────────────────────
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Refresh previews al abrir
    if (modalId === 'pricesModal') updatePricePreview();
    if (modalId === 'scheduleModal') updateSchedulePreview();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

// Cerrar al click en el overlay (fuera del modal)
function handleOverlayClick(event, modalId) {
    if (event.target === document.getElementById(modalId)) {
        closeModal(modalId);
    }
}

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        ['pricesModal', 'scheduleModal', 'reportsModal'].forEach(closeModal);
    }
});

// ─── PERSISTENCIA (localStorage) ──────────
function loadSavedData() {
    const prices   = JSON.parse(localStorage.getItem('parkingPrices'))   || null;
    const schedule = JSON.parse(localStorage.getItem('parkingSchedule')) || null;

    if (prices) {
        setVal('carHour',   prices.car?.hour);
        setVal('carDay',    prices.car?.day);
        setVal('carMonth',  prices.car?.month);
        setVal('motoHour',  prices.moto?.hour);
        setVal('motoDay',   prices.moto?.day);
        setVal('motoMonth', prices.moto?.month);
        setVal('bikeHour',  prices.bike?.hour);
        setVal('bikeDay',   prices.bike?.day);
        setVal('bikeMonth', prices.bike?.month);
    }

    if (schedule) {
        setVal('weekdayOpen',  schedule.weekday?.open);
        setVal('weekdayClose', schedule.weekday?.close);
        setVal('sundayOpen',   schedule.sunday?.open);
        setVal('sundayClose',  schedule.sunday?.close);
    }
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
}

// ─── GUARDAR PRECIOS ──────────────────────
function savePrices() {
    const prices = {
        car:  { hour: getVal('carHour'),  day: getVal('carDay'),  month: getVal('carMonth')  },
        moto: { hour: getVal('motoHour'), day: getVal('motoDay'), month: getVal('motoMonth') },
        bike: { hour: getVal('bikeHour'), day: getVal('bikeDay'), month: getVal('bikeMonth') }
    };

    localStorage.setItem('parkingPrices', JSON.stringify(prices));
    addToHistory('Se modificaron los precios del parqueadero');
    closeModal('pricesModal');
    showToast('✅ Precios actualizados correctamente');
}

// ─── PREVIEW PRECIOS ──────────────────────
function updatePricePreview() {
    const grid = document.getElementById('pricePreview');
    if (!grid) return;

    const items = [
        { label: '🚗 Carro / Hora',  id: 'carHour'   },
        { label: '🚗 Carro / Día',   id: 'carDay'    },
        { label: '🚗 Carro / Mes',   id: 'carMonth'  },
        { label: '🏍️ Moto / Hora',  id: 'motoHour'  },
        { label: '🏍️ Moto / Día',   id: 'motoDay'   },
        { label: '🏍️ Moto / Mes',   id: 'motoMonth' },
        { label: '🚴 Bici / Hora',   id: 'bikeHour'  },
        { label: '🚴 Bici / Día',    id: 'bikeDay'   },
        { label: '🚴 Bici / Mes',    id: 'bikeMonth' },
    ];

    grid.innerHTML = items.map(item => `
        <div class="preview-item">
            <span class="preview-item__label">${item.label}</span>
            <span class="preview-item__value">${formatCOP(getVal(item.id))}</span>
        </div>
    `).join('');
}

// ─── GUARDAR HORARIOS ─────────────────────
function saveSchedule() {
    const schedule = {
        weekday: { open: getVal('weekdayOpen'), close: getVal('weekdayClose') },
        sunday:  { open: getVal('sundayOpen'),  close: getVal('sundayClose')  }
    };

    localStorage.setItem('parkingSchedule', JSON.stringify(schedule));
    addToHistory('Se actualizaron los horarios de atención');
    closeModal('scheduleModal');
    showToast('✅ Horarios actualizados correctamente');
}

// ─── PREVIEW HORARIOS ────────────────────
function updateSchedulePreview() {
    const el = document.getElementById('schedulePreview');
    if (!el) return;

    const wOpen  = getVal('weekdayOpen')  || '07:00';
    const wClose = getVal('weekdayClose') || '19:00';
    const sOpen  = getVal('sundayOpen')   || '09:00';
    const sClose = getVal('sundayClose')  || '17:00';

    el.innerHTML = `
        <div class="schedule-preview-item">
            <span class="schedule-preview-label">📅 Lunes a Sábado</span>
            <span class="schedule-preview-value">${fmt12h(wOpen)} → ${fmt12h(wClose)}</span>
        </div>
        <div class="schedule-preview-item">
            <span class="schedule-preview-label">🎉 Domingos y Festivos</span>
            <span class="schedule-preview-value">${fmt12h(sOpen)} → ${fmt12h(sClose)}</span>
        </div>
    `;
}

// ─── SELECCIONAR TIPO DE INFORME ─────────
function selectReport(type, element) {
    selectedReportType = type;
    document.querySelectorAll('.report-type-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
}

// ─── DESCARGAR INFORME ────────────────────
function downloadReport(format) {
    if (!selectedReportType) {
        showToast('⚠️ Selecciona un tipo de reporte primero', true);
        return;
    }

    const names = {
        daily:     'Reporte Diario',
        monthly:   'Reporte Mensual',
        vehicle:   'Reporte por Vehículo',
        financial: 'Reporte Financiero'
    };

    const formatName = format === 'pdf' ? 'PDF' : 'Excel';
    const reportName = names[selectedReportType];

    addToHistory(`Se generó ${reportName} en ${formatName}`);
    closeModal('reportsModal');
    showToast(`📥 Descargando ${reportName} (${formatName})…`);

    // Limpiar selección
    selectedReportType = null;
    document.querySelectorAll('.report-type-card').forEach(c => c.classList.remove('selected'));
}

// ─── HISTORIAL ────────────────────────────
function addToHistory(action) {
    const container = document.getElementById('historyContainer');
    if (!container) return;

    const now  = new Date();
    const time = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const item = document.createElement('div');
    item.className = 'history-item history-item--normal';
    item.innerHTML = `
        <div class="history-dot"></div>
        <div class="history-body">
            <span class="history-time">Hoy, ${time}</span>
            <p class="history-action">${action}</p>
        </div>
    `;

    container.insertBefore(item, container.firstChild);

    // Máximo 10 items
    while (container.children.length > 10) {
        container.removeChild(container.lastChild);
    }
}

// ─── TOAST ────────────────────────────────
function showToast(message, isWarning = false) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    if (!toast || !toastText) return;

    toastText.textContent = message;
    toast.style.borderColor = isWarning ? 'var(--orange)' : 'var(--cyan)';
    toast.classList.add('show');

    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── HELPERS ──────────────────────────────
function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

function formatCOP(value) {
    const n = parseInt(value) || 0;
    return '$' + n.toLocaleString('es-CO');
}

function fmt12h(time) {
    if (!time) return '--';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    const h12  = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Labels para tabla de precios en móvil (data-label)
function labelPriceCellsForMobile() {
    const labels = ['🚗 Carros', '🏍️ Motos', '🚴 Bicicletas'];
    document.querySelectorAll('.price-table__row').forEach(row => {
        const cells = row.querySelectorAll('.price-table__cell');
        cells.forEach((cell, i) => {
            if (labels[i]) cell.setAttribute('data-label', labels[i]);
        });
    });
}