/* ══════════════════════════════════════════
   PUNTO PARK U — Panel Admin JS
══════════════════════════════════════════ */

/* ─── GLOBAL STATE ─────────────────────── */
let selectedReportType = null;
const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
if (!isDev && sessionStorage.getItem('adminAuth') !== 'true') {
    window.location.href = '../Admi.html';
} else if (isDev) {
    console.log("🛠️ Modo desarrollo detectado: Guard saltado.");
}

/* ─── INIT ───────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    updatePricePreview();
    updateSchedulePreview();
    initParkingMap();
    startUpdateTimer();
    initSparklines();
    renderVehTable();
    initOcupHoraWidget();
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', closeSidebar);
    });
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.addEventListener('click', closeSidebar);
});

/* ─── NAVIGATION ────────────────────────── */
function navigate(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + view);
    if (target) target.classList.add('active');
    const titles = {
        dashboard: 'dashboard', mapa: 'mapa en Vivo',
        'tarifas-horarios': 'tarifas y horarios',
        informes: 'informes', monitoreo: 'monitoreo', sistema: 'estado del Sistema'
    };
    const titleEl = document.getElementById('topbarViewTitle');
    if (titleEl) titleEl.textContent = titles[view] || view;
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });
    closeSidebar();
    if (view === 'tarifas-horarios') {
        updatePricePreview();
        updateSchedulePreview();
    }
    if (view === 'informes') {
        reportState.type = 'financial';
        setTimeout(initCharts, 100);
        renderInfTable();
        updateInfKpis();
        setTimeout(updateInfPaymentKpis, 150);
    }
    if (view === 'dashboard') {
        setTimeout(() => {
            initSparklines();
            renderVehTable();
            initOcupHoraWidget();
        }, 80);
    }
}

/* ─── SIDEBAR ──────────────────────────── */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
}

function isMobileDevice() { return window.innerWidth <= 480; }

window.addEventListener('resize', () => {
    if (window.innerWidth > 480) closeSidebar();
});

/* ─── PERSISTENCE ──────────────────────── */
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

/* ─── PRICES ────────────────────────────── */
function savePrices() {
    const prices = {
        car:  { hour: getVal('carHour'),  day: getVal('carDay'),  month: getVal('carMonth')  },
        moto: { hour: getVal('motoHour'), day: getVal('motoDay'), month: getVal('motoMonth') },
        bike: { hour: getVal('bikeHour'), day: getVal('bikeDay'), month: getVal('bikeMonth') }
    };
    localStorage.setItem('parkingPrices', JSON.stringify(prices));
    addToHistory('Se modificaron los precios del parqueadero');
    showToast('✅ Precios actualizados correctamente');
}

function updatePricePreview() {
    const grid = document.getElementById('pricePreview');
    if (!grid) return;
    const items = [
        { label: '🚗 Carro / Hora',  id: 'carHour'   },
        { label: '🚗 Carro / Día',   id: 'carDay'    },
        { label: '🚗 Carro / Mes',   id: 'carMonth'  },
        { label: '🏍️ Moto / Hora',   id: 'motoHour'  },
        { label: '🏍️ Moto / Día',    id: 'motoDay'   },
        { label: '🏍️ Moto / Mes',    id: 'motoMonth' },
        { label: '🚴 Bici / Hora',   id: 'bikeHour'  },
        { label: '🚴 Bici / Día',    id: 'bikeDay'   },
        { label: '🚴 Bici / Mes',    id: 'bikeMonth' },
    ];
    grid.innerHTML = items.map(item =>
        `<div class="preview-item">
            <span class="preview-item__label">${item.label}</span>
            <span class="preview-item__value">${formatCOP(getVal(item.id))}</span>
        </div>`
    ).join('');
}

/* ─── VEHICLE TABS ──────────────────────── */
function switchVehicleTab(vehicle, btn) {
    document.querySelectorAll('.vehicle-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    document.querySelectorAll('.tariff-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('panel-' + vehicle);
    if (panel) panel.classList.add('active');
}

function updateTariffLiveCard(vehicle) {
    ['Hour', 'Day', 'Month'].forEach(period => {
        const id = vehicle + period;
        const input = document.getElementById(id);
        const preview = document.getElementById('live-' + id);
        if (input && preview) preview.textContent = formatCOP(input.value);
    });
}

/* ─── INF PAYMENT KPIS ───────────────────── */
function updateInfPaymentKpis() {
    const rows = document.querySelectorAll('#infTableBody tr');
    const totals = { Efectivo: 0, POS: 0, ePayco: 0 };

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 7) return;
        const payment = cells[6].textContent.trim();
        const tarifaStr = cells[5].textContent.trim().replace(/[$.]/g, '');
        const tarifa = parseInt(tarifaStr) || 0;
        if (totals[payment] !== undefined) {
            totals[payment] += tarifa;
        }
    });

    const elEf = document.getElementById('kpiMetodoEfectivo');
    const elPo = document.getElementById('kpiMetodoPOS');
    const elEp = document.getElementById('kpiMetodoEpayco');
    if (elEf) elEf.textContent = '$' + totals.Efectivo.toLocaleString('es-CO');
    if (elPo) elPo.textContent = '$' + totals.POS.toLocaleString('es-CO');
    if (elEp) elEp.textContent = '$' + totals.ePayco.toLocaleString('es-CO');
}

/* ─── INFORME ────────────────────────────── */
function setInfPeriod(period, btn) {
    document.querySelectorAll('.inf-period-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    const customRange = document.getElementById('infCustomRange');
    if (customRange) customRange.style.display = period === 'custom' ? 'flex' : 'none';
    updateInfProjection();
}

function setInfType(type, btn) {
    document.querySelectorAll('.inf-type-pill').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
}

function applyCustomRange() { showToast('✅ Rango personalizado aplicado'); }

function filterInfTable(query) {
    document.querySelectorAll('#infTableBody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
    });
}

/* ─── PAYMENT METHOD WEIGHTED DISTRIBUTION ── */
const PAYMENT_METHODS = [
    { method: 'Efectivo', weight: 50 },
    { method: 'POS',      weight: 30 },
    { method: 'ePayco',   weight: 20 },
];

function pickPaymentMethod() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const { method, weight } of PAYMENT_METHODS) {
        cumulative += weight;
        if (rand <= cumulative) return method;
    }
    return 'Efectivo';
}

/* ─── INF METODO PAGO FILTER ─────────────── */
let _infPaymentMethod = 'all';

function setInfMetodoPago(method, btn) {
    _infPaymentMethod = method;
    document.querySelectorAll('.inf-metodo-pill').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    filterInfByPaymentMethod();
}

function filterInfByPaymentMethod() {
    const rows = document.querySelectorAll('#infTableBody tr');
    if (!rows.length) return;
    const opFilter = document.getElementById('infOperatorFilter');
    const opValue = opFilter ? opFilter.value : 'all';
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 9) return;
        const paymentText = cells[6].textContent.trim();
        const matchPayment = (_infPaymentMethod === 'all' || paymentText === _infPaymentMethod);
        // Respect active operator filter
        const operatorText = cells[8].textContent.trim();
        const matchOperator = opValue === 'all' || operatorText === opValue;
        row.style.display = (matchPayment && matchOperator) ? '' : 'none';
    });
    // Update the payment method KPI totals after filtering
    updateInfPaymentKpis();
}

/* ─── INF OPERADOR FILTER ────────────────── */
function filterInfByOperator(value) {
    document.querySelectorAll('#infTableBody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 9) return;
        const operatorText = cells[8].textContent.trim();
        const matchOperator = value === 'all' || operatorText === value;
        // Also respect active payment method filter
        const paymentText = cells[6].textContent.trim();
        const matchPayment = _infPaymentMethod === 'all' || paymentText === _infPaymentMethod;
        row.style.display = (matchOperator && matchPayment) ? '' : 'none';
    });
}

function updateInfKpis() {
    const data = {
        ingresos: 245000 + Math.floor(Math.random() * 50000),
        vehiculos: 24 + Math.floor(Math.random() * 6),
        ocupacion: 68 + Math.floor(Math.random() * 10),
        ticket: 10208 + Math.floor(Math.random() * 2000),
        tiempo: '3h 20m',
        ingHora: 28375 + Math.floor(Math.random() * 5000),
    };
    const els = {
        kpiIngresos: '$' + data.ingresos.toLocaleString('es-CO'),
        kpiVehiculos: data.vehiculos,
        kpiOcupacion: data.ocupacion + '%',
        kpiTicket: '$' + data.ticket.toLocaleString('es-CO'),
        kpiTiempo: data.tiempo,
        kpiIngHora: '$' + data.ingHora.toLocaleString('es-CO'),
    };
    Object.keys(els).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = els[id];
    });
    updateInfProjection();
}

/* ─── INF PROYECCIÓN DEL MES ────────────── */
function updateInfProjection() {
    const valueEl = document.getElementById('kpiProyeccion');
    const subEl   = document.getElementById('kpiProyeccionSub');
    if (!valueEl) return;

    // Detect active period
    const activeTab = document.querySelector('.inf-period-tab.active');
    const period = activeTab ? activeTab.dataset.period : 'today';

    if (period === 'month') {
        valueEl.textContent = 'N/A';
        if (subEl) subEl.textContent = 'Período completo';
        return;
    }

    // Read current income from the DOM
    const ingresosEl = document.getElementById('kpiIngresos');
    if (!ingresosEl) return;
    const income = parseInt(ingresosEl.textContent.replace(/[$.]/g, '')) || 0;

    const today = new Date();
    const daysElapsed = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    // Projection: (income / days_elapsed) × days_in_month
    const projection = Math.round((income / daysElapsed) * daysInMonth);

    valueEl.textContent = '$' + projection.toLocaleString('es-CO');
    if (subEl) subEl.textContent = 'Basado en ' + daysElapsed + ' días';
}

function renderInfTable() {
    const tbody = document.getElementById('infTableBody');
    if (!tbody) return;
    const plates = ['ABC123','XYZ456','BCD789','DEF012','GHI345','JKL678','MNO901','PQR234','STU567','VWX890'];
    const types = ['Carro','Moto','Bicicleta'];
    const operadores = ['Carlos Martínez','Laura González','Andrés Pérez'];
    const zoneMap = { Carro: 'Zona A', Moto: 'Zona B', Bicicleta: 'Zona C' };
    const rows = Array.from({ length: 12 }, (_, i) => {
        const h = 7 + Math.floor(Math.random() * 10);
        const stay = 1 + Math.floor(Math.random() * 5);
        const type = types[Math.floor(Math.random() * types.length)];
        const rate = type === 'Carro' ? 3000 : type === 'Moto' ? 1500 : 1000;
        return `<tr>
            <td><span class="plate-badge">${plates[i % plates.length]}</span></td>
            <td><span class="tipo-badge"><span class="material-symbols-outlined">directions_car</span> ${type}</span></td>
            <td>${String(h).padStart(2,'0')}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}</td>
            <td>${String(h+stay).padStart(2,'0')}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}</td>
            <td>${stay}h</td>
            <td><span class="tarifa-value">$${(rate*stay).toLocaleString('es-CO')}</span></td>
            <td>${pickPaymentMethod()}</td>
            <td><span class="zona-badge zona-badge--${zoneMap[type].replace('Zona ','')}">${zoneMap[type]}</span></td>
            <td><span class="op-badge">${operadores[i % operadores.length]}</span></td>
        </tr>`;
    }).join('');
    tbody.innerHTML = rows;
    const countEl = document.getElementById('infTableCount');
    if (countEl) countEl.textContent = 'Mostrando ' + (rows.length) + ' registros';
    // Apply active payment method filter and update KPIs
    filterInfByPaymentMethod();
    // Re-apply operator dropdown filter
    const opFilter = document.getElementById('infOperatorFilter');
    if (opFilter && opFilter.value !== 'all') filterInfByOperator(opFilter.value);
}

/* ─── SCHEDULE ──────────────────────────── */
function saveSchedule() {
    const schedule = {
        weekday: { open: getVal('weekdayOpen'), close: getVal('weekdayClose') },
        sunday:  { open: getVal('sundayOpen'),  close: getVal('sundayClose')  }
    };
    localStorage.setItem('parkingSchedule', JSON.stringify(schedule));
    addToHistory('Se actualizaron los horarios de atención');
    showToast('✅ Horarios actualizados correctamente');
}

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
        </div>`;
}

/* ─── PARKING MAP ──────────────────────── */
function initParkingMap() {
    const zones = [
        { id: 'zonaA', total: 20, occupied: [2, 5, 7, 8, 11, 14, 16, 17, 18] },
        { id: 'zonaB', total: 20, occupied: [1, 3, 4, 9, 12, 15, 19] },
        { id: 'zonaC', total: 10, occupied: [2, 6, 8] }
    ];
    let totalOcupados = 0;
    zones.forEach(({ id, total, occupied }) => {
        const container = document.getElementById(id);
        if (!container) return;
        container.innerHTML = Array.from({ length: total }, (_, i) => {
            const n = i + 1;
            const isOcc = occupied.includes(n);
            if (isOcc) totalOcupados++;
            return `<div class="parking-spot parking-spot--${isOcc ? 'ocupado' : 'libre'}" title="Espacio ${n}">${n}</div>`;
        }).join('');
    });
    const mapaEl = document.getElementById('mapaOcupados');
    if (mapaEl) mapaEl.textContent = totalOcupados;
}

/* ─── HISTORY ──────────────────────────── */
function addToHistory(action) {
    const container = document.getElementById('historyContainer');
    if (!container) return;
    const now  = new Date();
    const time = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
        <div class="history-dot"></div>
        <div class="history-body">
            <span class="history-time">Hoy, ${time}</span>
            <p class="history-action">${action}</p>
        </div>`;
    container.insertBefore(item, container.firstChild);
    while (container.children.length > 10) container.removeChild(container.lastChild);
}

/* ─── TOAST ──────────────────────────────── */
function showToast(message, isWarning = false) {
    const toast     = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.style.borderColor = isWarning ? 'var(--orange)' : 'var(--cyan)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ─── HELPERS ────────────────────────────── */
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

/* ─── REPORT STATE ──────────────────────── */
const reportState = {
    type:         null,
    dailyDate:    null,
    monthlyDate:  null,
    vehiclePlate: '',
    vehicleType:  'all',
    financialRange: 'day',
    financialFrom: null,
    financialTo:   null,
};

/* ─── REPORT SELECT ──────────────────────── */
function selectReport(type, element) {
    reportState.type = type;
    document.querySelectorAll('.report-type-card').forEach(c => {
        c.classList.remove('selected');
        const f = c.querySelector('.report-filter');
        if (f) f.classList.remove('visible');
    });
    element.classList.add('selected');
    const filter = document.getElementById('filter-' + type);
    if (filter) {
        filter.classList.add('visible');
        if (type === 'daily')   initDailyLimits();
        if (type === 'monthly') initMonthlyLimits();
    }
}

/* ─── REPORT DAILY ──────────────────────── */
function initDailyLimits() {
    const input = document.getElementById('dailyDate');
    if (!input) return;
    const today   = new Date();
    const maxBack = new Date();
    maxBack.setDate(today.getDate() - 5);
    maxBack.setHours(0, 0, 0, 0);
    input.max   = toInputDate(today);
    input.min   = toInputDate(maxBack);
    input.value = toInputDate(today);
    reportState.dailyDate = input.value;
    document.getElementById('dailyHint').textContent =
        `Disponible desde ${fmt(maxBack)} hasta hoy`;
    document.getElementById('dailyHint').style.color = 'var(--text-muted)';
}

function validateDailyDate(input) {
    const selected = new Date(input.value + 'T00:00:00');
    const today    = new Date();
    today.setHours(23, 59, 59, 999);
    const minDate  = new Date();
    minDate.setDate(minDate.getDate() - 5);
    minDate.setHours(0, 0, 0, 0);
    const hint = document.getElementById('dailyHint');
    if (selected > today) {
        hint.textContent = '⚠️ No puedes seleccionar fechas futuras';
        hint.style.color = 'var(--red)';
        input.value = toInputDate(new Date());
        reportState.dailyDate = input.value;
        return;
    }
    if (selected < minDate) {
        hint.textContent = '⚠️ Máximo 5 días de antigüedad permitidos';
        hint.style.color = 'var(--red)';
        input.value = toInputDate(minDate);
        reportState.dailyDate = input.value;
        return;
    }
    hint.textContent = `✅ ${fmt(selected)}`;
    hint.style.color = 'var(--green)';
    reportState.dailyDate = input.value;
}

/* ─── REPORT MONTHLY ────────────────────── */
function initMonthlyLimits() {
    const input = document.getElementById('monthlyDate');
    if (!input) return;
    const today    = new Date();
    const maxMonth = getMaxAvailableMonth(today);
    const minMonth = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    input.max   = toInputMonth(maxMonth);
    input.min   = toInputMonth(minMonth);
    input.value = toInputMonth(maxMonth);
    reportState.monthlyDate = input.value;
    const hint = document.getElementById('monthlyHint');
    if (today.getDate() >= 15) {
        hint.textContent = `✅ Mes anterior disponible — cierre contable completado`;
        hint.style.color = 'var(--green)';
    } else {
        hint.textContent = `ℹ️ Disponible desde el día 15 del mes (cierre contable)`;
        hint.style.color = 'var(--text-muted)';
    }
}

function getMaxAvailableMonth(today) {
    const m = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    if (today.getDate() < 15) m.setMonth(m.getMonth() - 1);
    return m;
}

function validateMonthlyDate(input) {
    const selected   = new Date(input.value + '-01T00:00:00');
    const maxAllowed = getMaxAvailableMonth(new Date());
    const today      = new Date();
    const minAllowed = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    const hint       = document.getElementById('monthlyHint');
    if (selected > maxAllowed) {
        hint.textContent = '⚠️ El cierre contable de este mes aún no está disponible';
        hint.style.color = 'var(--red)';
        input.value = toInputMonth(maxAllowed);
        reportState.monthlyDate = input.value;
        return;
    }
    if (selected < minAllowed) {
        hint.textContent = '⚠️ Solo se permiten los últimos 12 meses';
        hint.style.color = 'var(--red)';
        input.value = toInputMonth(minAllowed);
        reportState.monthlyDate = input.value;
        return;
    }
    const monthName = selected.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    hint.textContent = `✅ ${monthName}`;
    hint.style.color = 'var(--green)';
    reportState.monthlyDate = input.value;
}

/* ─── REPORT VEHICLE ────────────────────── */
function formatPlate(input) {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    reportState.vehiclePlate = input.value;
    const hint = document.getElementById('vehicleHint');
    const plate = input.value;
    if (plate.length === 0) { hint.textContent = ''; return; }
    const isValid = /^[A-Z]{3}[0-9]{3}$/.test(plate) || /^[A-Z]{2}[0-9]{3}[A-Z]$/.test(plate);
    if (plate.length < 6) {
        hint.textContent = `Ingresando… (${plate.length}/6)`;
        hint.style.color = 'var(--text-muted)';
    } else if (isValid) {
        hint.textContent = `✅ Placa válida`;
        hint.style.color = 'var(--green)';
    } else {
        hint.textContent = '⚠️ Formato esperado: ABC123 o AB123C';
        hint.style.color = 'var(--orange)';
    }
}

function setVehicleType(type, btn) {
    reportState.vehicleType = type;
    document.querySelectorAll('.vtype-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

/* ─── REPORT FINANCIAL ──────────────────── */
function setFinancialRange(range, btn) {
    reportState.financialRange = range;
    document.querySelectorAll('.frange-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const customRange = document.getElementById('infCustomRange');
    customRange.style.display = range === 'custom' ? 'flex' : 'none';
    if (range !== 'custom') {
        const { from, to } = getFinancialRangeDates(range);
        reportState.financialFrom = from;
        reportState.financialTo   = to;
    }
}

function getFinancialRangeDates(range) {
    const today = new Date();
    let from, to;
    switch (range) {
        case 'day':
            from = to = toInputDate(today);
            break;
        case 'week':
            const monday = new Date(today);
            monday.setDate(today.getDate() - today.getDay() + 1);
            from = toInputDate(monday);
            to   = toInputDate(today);
            break;
        case 'month':
            from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            to   = toInputDate(today);
            break;
        default:
            from = to = toInputDate(today);
    }
    return { from, to };
}

/* ─── REPORT VALIDATE ────────────────────── */
function validateReportState() {
    if (!reportState.type) {
        showToast('⚠️ Selecciona un tipo de reporte primero', true);
        return false;
    }
    if (reportState.type === 'daily' && !reportState.dailyDate) {
        showToast('⚠️ Selecciona una fecha para el reporte diario', true);
        return false;
    }
    if (reportState.type === 'monthly' && !reportState.monthlyDate) {
        showToast('⚠️ Selecciona un mes para el reporte mensual', true);
        return false;
    }
    if (reportState.type === 'vehicle') {
        const plate = document.getElementById('vehiclePlate')?.value || '';
        if (plate.length < 6) {
            showToast('⚠️ Ingresa una placa válida (6 caracteres)', true);
            return false;
        }
        reportState.vehiclePlate = plate;
    }
    if (reportState.type === 'financial' && reportState.financialRange === 'custom') {
        const from = document.getElementById('infFrom')?.value;
        const to   = document.getElementById('infTo')?.value;
        if (!from || !to) {
            showToast('⚠️ Selecciona el rango de fechas personalizado', true);
            return false;
        }
        if (from > to) {
            showToast('⚠️ La fecha inicio no puede ser mayor a la fecha fin', true);
            return false;
        }
        reportState.financialFrom = from;
        reportState.financialTo   = to;
    }
    return true;
}

/* ─── REPORT DOWNLOAD ────────────────────── */
function setActiveDownloadFormat(format) {
    document.querySelectorAll('.inf-actions .btn[data-format]').forEach(btn => {
        const isActive = btn.dataset.format === format;
        btn.classList.toggle('btn-primary', isActive);
        btn.classList.toggle('btn-secondary', !isActive);
    });
}

async function downloadReport(format) {
    if (!validateReportState()) return;
    setActiveDownloadFormat(format);
    const reportContent = buildReportContent(reportState, format);
    let success = false;
    if (format === 'pdf') {
        success = await downloadAsPDF(reportContent);
    } else {
        downloadAsExcel(reportContent);
        success = true;
    }
    if (!success) return;
    const names = {
        daily: 'Reporte Diario', monthly: 'Reporte Mensual',
        vehicle: 'Reporte por Vehículo', financial: 'Análisis Financiero'
    };
    addToHistory(`Se generó ${names[reportState.type]} en ${format.toUpperCase()}`);
    showToast(`📥 Descargando ${names[reportState.type]} (${format.toUpperCase()})…`);
}

/* ─── REPORT BUILD ──────────────────────── */
function buildReportContent(state, format) {
    const now = new Date();
    const generatedAt = now.toLocaleString('es-CO');
    const prices = JSON.parse(localStorage.getItem('parkingPrices')) || getDefaultPrices();
    const mockData = getMockData(state);
    return {
        meta: {
            title: getReportTitle(state),
            subtitle: getReportSubtitle(state),
            generatedAt,
            period: getReportPeriod(state),
        },
        summary: mockData.summary,
        breakdown: mockData.breakdown,
        kpis: mockData.kpis,
        rows: mockData.rows,
        prices,
        state,
    };
}

function getReportTitle(state) {
    const titles = {
        daily: '📅 Reporte Diario — Punto Park U',
        monthly: '📆 Reporte Mensual — Punto Park U',
        vehicle: '🚗 Reporte por Vehículo — Punto Park U',
        financial: '💰 Análisis Financiero — Punto Park U',
    };
    return titles[state.type];
}

function getReportSubtitle(state) {
    switch (state.type) {
        case 'daily':    return `Actividad del día ${fmt(new Date(state.dailyDate + 'T00:00:00'))}`;
        case 'monthly':  return `Resumen del mes ${new Date(state.monthlyDate + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`;
        case 'vehicle':  return `Historial de placa ${state.vehiclePlate} · Tipo: ${state.vehicleType === 'all' ? 'Todos' : state.vehicleType}`;
           case 'financial': return `Período: ${getReportPeriod(state)}`;
        default: return '';
    }
}

function getReportPeriod(state) {
    switch (state.type) {
        case 'daily':    return fmt(new Date(state.dailyDate + 'T00:00:00'));
        case 'monthly':  return new Date(state.monthlyDate + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
        case 'vehicle':  return 'Histórico completo';
        case 'financial':
            if (state.financialRange === 'day')    return fmt(new Date());
            if (state.financialRange === 'week')   return 'Semana actual';
            if (state.financialRange === 'month')  return new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
            return `${fmt(new Date(state.financialFrom + 'T00:00:00'))} → ${fmt(new Date(state.financialTo + 'T00:00:00'))}`;
        default: return '';
    }
}

/* ────────────────────────────────── PDF ────────────────────────────────── */
async function downloadAsPDF(content) {

    try {
        // 1. Verificar librerías antes de usarlas
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            console.error('jsPDF not loaded. window.jspdf =', window.jspdf);
            showToast('⚠️ jsPDF no está cargado. ¿Bloqueador de anuncios?', true);
            return false;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        if (typeof doc.autoTable !== 'function') {
            console.error('autoTable not found on jsPDF instance');
            showToast('⚠️ jsPDF-autoTable no disponible. Recarga la página.', true);
            return false;
        }
        const pw = doc.internal.pageSize.getWidth();
        const LM = 18, RM = 18, CW = pw - LM - RM, BOTTOM_LIMIT = 280;
        const cDark   = [30, 58, 95];
        const cMid    = [42, 82, 152];
        const cGreen  = [10, 102, 32];
        const cGray   = [90, 90, 90];
        const cWhite  = [255, 255, 255];
        const cZebra1 = [232, 244, 253];
        const cZebra2 = [248, 249, 250];
        let y = LM;

        function needSpace(mm) { if (y + mm > BOTTOM_LIMIT) { doc.addPage(); y = LM; } }
        function sectionTitle(text) {
            needSpace(16);
            doc.setFontSize(12); doc.setFont('helvetica', 'bold');
            doc.setTextColor(...cDark); doc.text(text, LM, y); y += 8;
        }
        function divider() {
            doc.setDrawColor(...cDark); doc.setLineWidth(0.6);
            doc.line(LM, y, pw - RM, y); y += 6;
        }

        const s     = content.summary;
        const title = content.meta.title.replace(/[📅📆🚗💰]/gu, '').trim();

        // Logo (con fallback seguro)
        let logoDataUrl = null;
        try { logoDataUrl = await getLogoBase64(); } catch (e) { console.error('PDF logo:', e); }

        if (logoDataUrl) {
            try { doc.addImage(logoDataUrl, 'PNG', LM, y - 2, 28, 12); } catch (_) {}
        }
        doc.setFontSize(20); doc.setFont('helvetica', 'bold');
        doc.setTextColor(...cDark);
        doc.text('Punto Park U', LM + (logoDataUrl ? 33 : 0), y + 3);
        y += 9;
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(125);
        doc.text('NIT: 901.123.456-7  ·  Parqueadero autorizado  ·  Resolución 4100 de 2004', LM, y);
        y += 5;
        divider();

        doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...cDark);
        doc.text(title, LM, y); y += 7;
        doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...cGray);
        doc.text(`Período: ${content.meta.period}`, LM, y);
        doc.text(`Generado: ${content.meta.generatedAt}`, pw - RM, y, { align: 'right' });
        y += 5;
        doc.text(`Administrador: Parking  ·  ${content.meta.subtitle}`, LM, y);
        y += 10;

        // ── RESUMEN
        sectionTitle('RESUMEN DEL PERÍODO');
        doc.autoTable({
            startY: y,
            head: [['Indicador', 'Valor']],
            body: [
                ['Ingresos totales',        `$${s.totalIngresos.toLocaleString('es-CO')}`],
                ['Vehículos atendidos',     String(s.totalVehiculos)],
                ['Tasa de ocupación',       `${s.tasaOcupacion}%`],
                ['Ticket promedio',         `$${s.ticketPromedio.toLocaleString('es-CO')}`],
                ['Tiempo promedio estadía',  s.tiempoPromedio],
                ['Ingreso promedio / hora', `$${s.ingresosPorHora.toLocaleString('es-CO')}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: cDark, textColor: cWhite, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 10 },
            alternateRowStyles: { fillColor: cZebra1 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 80 },
                1: { halign: 'right', cellWidth: 50, fontStyle: 'bold', textColor: cGreen },
            },
            margin: { left: LM, right: RM }, tableWidth: CW, styles: { cellPadding: 3 },
        });
        y = doc.lastAutoTable.finalY + 12;

        // ── DESGLOSE POR TIPO
        sectionTitle('INGRESOS POR TIPO DE VEHÍCULO');
        const brkTotal = content.breakdown.reduce((acc, b) => acc + b.ingresos, 0);
        const brkCount = content.breakdown.reduce((acc, b) => acc + b.cantidad, 0);
        doc.autoTable({
            startY: y,
            head: [['Tipo', 'Vehículos', 'Ingresos', '%']],
            body: content.breakdown.map(b => [
                b.tipo.replace(/[🚗🏍️🚴]/gu, '').trim(),
                String(b.cantidad),
                `$${b.ingresos.toLocaleString('es-CO')}`,
                `${brkTotal > 0 ? ((b.ingresos / brkTotal) * 100).toFixed(0) : 0}%`,
            ]),
            foot: [['TOTAL', String(brkCount), `$${brkTotal.toLocaleString('es-CO')}`, '100%']],
            theme: 'grid',
            headStyles: { fillColor: cMid, textColor: cWhite, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 10 },
            footStyles: { fillColor: cDark, textColor: cWhite, fontStyle: 'bold', fontSize: 10 },
            alternateRowStyles: { fillColor: cZebra2 },
            columnStyles: { 0: { cellWidth: 70 }, 1: { halign: 'center', cellWidth: 28 }, 2: { halign: 'right', cellWidth: 38 }, 3: { halign: 'center', cellWidth: 20 } },
            margin: { left: LM, right: RM }, tableWidth: CW, styles: { cellPadding: 3 },
        });
        y = doc.lastAutoTable.finalY + 12;

        // ── MÉTODO DE PAGO
        sectionTitle('TOTALES POR MÉTODO DE PAGO');
        const pmt = {};
        content.rows.forEach(r => {
            if (!pmt[r.pago]) pmt[r.pago] = { count: 0, total: 0 };
            pmt[r.pago].count++;
            pmt[r.pago].total += parseInt(String(r.tarifa).replace(/[$.]/g, '')) || 0;
        });
        const pmtKeys      = Object.keys(pmt);
        const pmtTotalSum  = pmtKeys.reduce((acc, k) => acc + pmt[k].total, 0);
        doc.autoTable({
            startY: y,
            head: [['Método de Pago', 'Cantidad', 'Total']],
            body: pmtKeys.map(k => [k, String(pmt[k].count), `$${pmt[k].total.toLocaleString('es-CO')}`]),
            foot: pmtKeys.length ? [['TOTAL', String(content.rows.length), `$${pmtTotalSum.toLocaleString('es-CO')}`]] : [],
            theme: 'grid',
            headStyles: { fillColor: cMid, textColor: cWhite, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 10 },
            footStyles: { fillColor: cDark, textColor: cWhite, fontStyle: 'bold', fontSize: 10 },
            alternateRowStyles: { fillColor: cZebra2 },
            columnStyles: { 0: { cellWidth: 70 }, 1: { halign: 'center', cellWidth: 28 }, 2: { halign: 'right', cellWidth: 38, fontStyle: 'bold', textColor: cGreen } },
            margin: { left: LM, right: RM }, tableWidth: CW, styles: { cellPadding: 3 },
        });
        y = doc.lastAutoTable.finalY + 12;

        // ── REGISTRO VEHÍCULOS
        sectionTitle('REGISTRO DE VEHÍCULOS');
        doc.autoTable({
            startY: y,
            head: [['Placa','Tipo','Ingreso','Salida','Duración','Tarifa','Pago','Conductor']],
            body: content.rows.map(r => [r.placa, r.tipo, r.ingreso, r.salida, r.duracion, r.tarifa, r.pago, r.conductor]),
            theme: 'grid',
            headStyles: { fillColor: cDark, textColor: cWhite, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: cZebra2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 18 }, 1: { cellWidth: 16 },
                2: { halign: 'center', cellWidth: 16 }, 3: { halign: 'center', cellWidth: 16 },
                4: { halign: 'center', cellWidth: 14 }, 5: { halign: 'right', cellWidth: 20, fontStyle: 'bold', textColor: cGreen },
                6: { cellWidth: 20 }, 7: { cellWidth: 20 },
            },
            margin: { left: LM, right: RM }, tableWidth: CW, styles: { cellPadding: 2, fontSize: 8 },
        });
        y = Math.max(doc.lastAutoTable.finalY + 12, y + 4);

        // ── FIRMA
        needSpace(55); divider();
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...cGray);
        doc.text('Autorizado por:', LM, y); y += 9;
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...cDark);
        doc.text('Nombre: _____________________________________________', LM, y); y += 8;
        doc.text('Firma:  _____________________________________________', LM, y); y += 8;
        doc.text('C.C.:   _____________________________________________', LM, y); y += 14;

        // ── PIE DE PÁGINA
        needSpace(18);
        doc.setDrawColor(190); doc.setLineWidth(0.3); doc.line(LM, y, pw - RM, y); y += 5;
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(155);
        doc.text(`Documento generado por Panel Administrador — Punto Park U  ·  ${content.meta.generatedAt}`, LM, y); y += 3;
        doc.text('Este reporte cumple con los requisitos de la Resolución 4100 de 2004 y normativa colombiana de parqueaderos.', LM, y);

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7); doc.setTextColor(185);
            doc.text(`Página ${i} de ${totalPages}`, pw - RM, 293, { align: 'right' });
            doc.text('Punto Park U · Panel Administrador', LM, 293);
        }

        doc.save(`PuntoParkU_${content.state.type}_${new Date().toISOString().slice(0,10)}.pdf`);
        return true;

    } catch (err) {
        console.error('PDF generation error:', err);
        showToast(`⚠️ Error al generar PDF: ${err.message || err}. Revisa la consola.`, true);
        return false;
    }
}

/* ──────────────────────────────── EXCEL ──────────────────────────────── */
function downloadAsExcel(content) {
    if (typeof XLSX === 'undefined') {
        showToast('⚠️ La librería de Excel no está disponible. Recarga la página.');
        return;
    }
    const s         = content.summary;
    const rows      = content.rows;
    const breakdown = content.breakdown || [];
    const title     = content.meta.title.replace(/[📅📆🚗💰]/gu, '').trim();
    const periodInfo = `Período: ${content.meta.period}  ·  Generado: ${content.meta.generatedAt}`;

    const values = [];
    // Filas 0-3: Encabezado
    values.push([`Punto Park U — ${title}`, '', '', '', '', '', '', '']);
    values.push([content.meta.subtitle,      '', '', '', '', '', '', '']);
    values.push([periodInfo,                 '', '', '', '', '', '', '']);
    values.push([]);
    // Fila 4: Header resumen
    values.push(['RESUMEN DEL PERÍODO', '', '', '', '', '', '', '']);
    // Filas 5-6: KPIs resumen
    values.push(['Ingresos totales', `$${s.totalIngresos.toLocaleString('es-CO')}`, 'Vehículos atendidos', String(s.totalVehiculos), 'Tasa de ocupación', `${s.tasaOcupacion}%`, 'Ticket promedio', `$${s.ticketPromedio.toLocaleString('es-CO')}`]);
    values.push(['Tiempo promedio', s.tiempoPromedio, 'Ingreso promedio/hora', `$${s.ingresosPorHora.toLocaleString('es-CO')}`, '', '', '', '']);
    // Fila 7: Vacía
    values.push([]);
    // Fila 8: Header desglose
    values.push(['DESGLOSE POR TIPO DE VEHÍCULO', '', '', '', '', '', '', '']);
    // Fila 9: Encabezados columnas desglose
    values.push(['Tipo', 'Vehículos', 'Ingresos', '% del total', '', '', '', '']);
    // Filas 10..10+N-1: datos desglose
    const brkTotal = breakdown.reduce((a, b) => a + b.ingresos, 0);
    const brkCount = breakdown.reduce((a, b) => a + b.cantidad, 0);
    breakdown.forEach(b => {
        const pct = brkTotal > 0 ? ((b.ingresos / brkTotal) * 100).toFixed(0) + '%' : '0%';
        values.push([b.tipo.replace(/[🚗🏍️🚴]/gu, '').trim(), b.cantidad, b.ingresos, pct, '', '', '', '']);
    });
    // Fila total desglose
    values.push(['TOTAL', brkCount, brkTotal, '100%', '', '', '', '']);
    // Fila vacía
    values.push([]);

    // Índice dinámico de la tabla de movimientos
    // 0:tit 1:sub 2:per 3:vac 4:h-res 5-6:kpis 7:vac 8:h-des 9:enc-des [10..10+N]:des [10+N+1]:tot-des [10+N+2]:vac → HEADER en 10+N+3
    const BREAKDOWN_ROWS = breakdown.length;
    const HEADER_ROW     = 10 + BREAKDOWN_ROWS + 1 + 1; // +1 total, +1 vacía

    const headers = ['Placa','Tipo','Ingreso','Salida','Duración','Tarifa','Método de Pago','Conductor'];
    values.push(headers);
    rows.forEach(r => {
        const tarifaNum = parseInt(String(r.tarifa).replace(/[$.]/g, '')) || 0;
        values.push([r.placa, r.tipo, r.ingreso, r.salida, r.duracion, tarifaNum, r.pago, r.conductor]);
    });
    const totalTarifa = rows.reduce((sum, r) => sum + (parseInt(String(r.tarifa).replace(/[$.]/g, '')) || 0), 0);
    values.push(['TOTAL', '', '', '', '', totalTarifa, '', '']);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(values);

    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } },
        { s: { r: 8, c: 0 }, e: { r: 8, c: 7 } },
    ];

    const colWidths = [];
    values.forEach(row => row.forEach((cell, ci) => {
        const len = String(cell || '').length;
        if (!colWidths[ci] || len > colWidths[ci]) colWidths[ci] = len;
    }));
    ws['!cols'] = colWidths.map(w => ({ wch: Math.min(Math.max(w + 3, 10), 40) }));

    const thin = { top: { style:'thin', color:{rgb:'CCE0F0'} }, bottom: { style:'thin', color:{rgb:'CCE0F0'} }, left: { style:'thin', color:{rgb:'CCE0F0'} }, right: { style:'thin', color:{rgb:'CCE0F0'} } };

    function setStyle(r, c, style) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        ws[ref].s = style;
    }

    // Encabezado general
    setStyle(0, 0, { font: { bold:true, sz:16, color:{rgb:'1E3A5F'}, name:'Calibri' }, alignment: { horizontal:'left', vertical:'center' } });
    setStyle(1, 0, { font: { sz:11, color:{rgb:'555555'}, name:'Calibri' }, alignment: { vertical:'center' } });
    setStyle(2, 0, { font: { sz:10, color:{rgb:'888888'}, name:'Calibri' }, alignment: { vertical:'center' } });

    // Header RESUMEN (fila 4)
    setStyle(4, 0, { font: { bold:true, sz:12, color:{rgb:'FFFFFF'}, name:'Calibri' }, fill: { fgColor:{rgb:'1E3A5F'} }, alignment: { horizontal:'left', vertical:'center' } });

    // KPIs resumen (filas 5-6)
    for (let row = 5; row <= 6; row++) {
        for (let c = 0; c < 8; c += 2) {
            setStyle(row, c,   { font: { bold:true, sz:11, color:{rgb:'1E3C72'}, name:'Calibri' }, fill: { fgColor:{rgb:'DEEFFF'} }, alignment: { vertical:'center' }, border: thin });
            const valRef = XLSX.utils.encode_cell({ r: row, c: c + 1 });
            if (ws[valRef] && ws[valRef].v !== '') setStyle(row, c + 1, { font: { bold:true, sz:11, color:{rgb:'0A6620'}, name:'Calibri' }, alignment: { horizontal:'right', vertical:'center' }, border: thin });
        }
    }

    // Header DESGLOSE (fila 8)
    setStyle(8, 0, { font: { bold:true, sz:12, color:{rgb:'FFFFFF'}, name:'Calibri' }, fill: { fgColor:{rgb:'2A5298'} }, alignment: { horizontal:'left', vertical:'center' } });

    // Encabezados columnas desglose (fila 9)
    ['Tipo','Vehículos','Ingresos','% del total'].forEach((_, ci) => {
        setStyle(9, ci, { font: { bold:true, sz:10, color:{rgb:'FFFFFF'}, name:'Calibri' }, fill: { fgColor:{rgb:'1E3A5F'} }, alignment: { horizontal: ci > 0 ? 'center' : 'left', vertical:'center' }, border: thin });
    });

    // Datos desglose (filas 10..10+N-1)
    breakdown.forEach((_, bi) => {
        const ri  = 10 + bi;
        const bg  = bi % 2 === 0 ? 'FFFFFF' : 'E8F4FD';
        setStyle(ri, 0, { font: { bold:true, sz:10, name:'Calibri' }, fill: { fgColor:{rgb:bg} }, border: thin });
        [1,2,3].forEach(ci => setStyle(ri, ci, { font: { sz:10, name:'Calibri' }, fill: { fgColor:{rgb:bg} }, alignment: { horizontal:'center' }, border: thin }));
        const ingRef = XLSX.utils.encode_cell({ r: ri, c: 2 });
        if (ws[ingRef]) ws[ingRef].z = '$#,##0';
    });

    // Total desglose
    const totalBrkRow = 10 + BREAKDOWN_ROWS;
    [0,1,2,3].forEach(ci => setStyle(totalBrkRow, ci, { font: { bold:true, sz:10, color:{rgb:'FFFFFF'}, name:'Calibri' }, fill: { fgColor:{rgb:'1E3A5F'} }, alignment: { horizontal: ci > 0 ? 'center' : 'left', vertical:'center' }, border: thin }));
    const tbRef = XLSX.utils.encode_cell({ r: totalBrkRow, c: 2 });
    if (ws[tbRef]) ws[tbRef].z = '$#,##0';

    // Header tabla movimientos
    headers.forEach((_, ci) => {
        setStyle(HEADER_ROW, ci, { font: { bold:true, sz:11, color:{rgb:'FFFFFF'}, name:'Calibri' }, fill: { fgColor:{rgb:'1E3A5F'} }, alignment: { horizontal: ci===5?'right':(ci>=2&&ci<=4)?'center':'left', vertical:'center' }, border: thin });
    });

    // Datos movimientos
    const DATA_START = HEADER_ROW + 1;
    rows.forEach((_, i) => {
        const bg = i % 2 === 0 ? 'FFFFFF' : 'E8F4FD';
        for (let c = 0; c < 8; c++) {
            setStyle(DATA_START + i, c, { font: { name:'Calibri', sz:11, bold:c===0, color:{rgb:c===0?'1E3C72':c===5?'0A6620':'333333'} }, fill: { fgColor:{rgb:bg} }, alignment: { horizontal:c===5?'right':(c>=2&&c<=4)?'center':'left', vertical:'center' }, border: thin });
        }
        const tr = XLSX.utils.encode_cell({ r: DATA_START + i, c: 5 });
        if (ws[tr]) ws[tr].z = '$#,##0';
    });

    // Fila TOTAL movimientos
    const TOTAL_ROW = DATA_START + rows.length;
    for (let c = 0; c < 8; c++) {
        setStyle(TOTAL_ROW, c, { font: { bold:true, sz:11, color:{rgb:'FFFFFF'}, name:'Calibri' }, fill: { fgColor:{rgb:'1E3A5F'} }, alignment: { horizontal:c===5?'right':c===0?'left':'center', vertical:'center' }, border: thin });
    }
    const tRef = XLSX.utils.encode_cell({ r: TOTAL_ROW, c: 5 });
    if (ws[tRef]) ws[tRef].z = '$#,##0';

    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `PuntoParkU_${content.state.type}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/* ─── LOGO ──────────────────────────────── */
async function getLogoBase64() {
    try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 3000);
        const res        = await fetch('../Images/Logo.png', { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

/* ─── DATE HELPERS ──────────────────────── */
function toInputDate(date) { return date.toISOString().split('T')[0]; }

function toInputMonth(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }

function fmt(date) { return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }); }

/* ─── TIMER ──────────────────────────────── */
let _updateSeconds = 0;
let _updateTimer   = null;

function startUpdateTimer() {
    _updateTimer = setInterval(() => {
        _updateSeconds++;
        const el = document.getElementById('topbarLastUpdate');
        if (!el) return;
        el.textContent = _updateSeconds < 60
            ? `Última actualización: ${_updateSeconds}s ago`
            : `Última actualización: ${Math.floor(_updateSeconds / 60)}m ago`;
    }, 1000);
}

function resetUpdateTimer() {
    _updateSeconds = 0;
    const el = document.getElementById('topbarLastUpdate');
    if (el) el.textContent = 'Última actualización: 0s ago';
}

/* ─── KEYBOARD ────────────────────────────── */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
});

/* ─── MOCK DATA ──────────────────────────── */
const _vehData = (() => {
    const PLACAS  = ['ABC-123','XYZ-789','DEF-456','GHI-012','JKL-345','MNO-678','PQR-901','STU-234','VWX-567','BCD-890'];
    const TIPOS   = ['car','car','moto','bike','car','moto','car','bike','moto','car'];
    const ZONAS   = ['B','A','A','C','B','B','A','C','A','B'];
    const OPS     = ['Juan Pérez','María López','Carlos Ruiz','Ana Gómez','Pedro Silva','Luis Torres'];
    const HORAS   = ['07:12','07:45','08:03','08:30','09:05','09:22','09:48','10:15','10:33','11:00',
                     '11:20','11:45','12:10','12:38','13:05','13:22','13:40','14:05','14:20','14:32'];
    const DURS    = ['0h 45m','1h 15m','1h 22m','1h 27m','1h 38m','2h 00m','2h 12m','2h 37m','2h 55m','3h 10m',
                     '3h 42m','4h 05m','0h 30m','1h 50m','2h 20m','3h 00m','1h 10m','0h 55m','2h 45m','1h 35m'];
    return Array.from({ length: 39 }, (_, i) => {
        const b = i % PLACAS.length;
        const suffix = i >= PLACAS.length
            ? PLACAS[b].replace(/\d+/, n => String(parseInt(n) + Math.floor(i / PLACAS.length) * 111))
            : PLACAS[b];
        return {
            placa: suffix, tipo: TIPOS[b], entrada: HORAS[i % HORAS.length], duracion: DURS[i % DURS.length],
            zona: ZONAS[b], estado: 'activo', pago: i % 3 === 0 ? 'pending' : 'paid', operador: OPS[i % OPS.length],
        };
    });
})();

function getMockData(state) {
    const base = {
        summary: {
            totalIngresos:   state.type === 'monthly' ? 8450000 : 245000,
            totalVehiculos:  state.type === 'monthly' ? 620      : 24,
            tasaOcupacion:   68,
            ticketPromedio:  state.type === 'monthly' ? 13629    : 10208,
            tiempoPromedio:  '3h 20m',
            ingresosPorHora: state.type === 'monthly' ? 394444   : 28375,
        },
        breakdown: [
            { tipo: '🚗 Carros',     cantidad: 14, ingresos: state.type === 'monthly' ? 5100000 : 148000, porcentaje: 60 },
            { tipo: '🏍️ Motos',      cantidad: 7,  ingresos: state.type === 'monthly' ? 2650000 : 70000,  porcentaje: 29 },
            { tipo: '🚴 Bicicletas', cantidad: 3,  ingresos: state.type === 'monthly' ? 700000  : 27000,  porcentaje: 11 },
        ],
        kpis: [
            { label: 'Ocupación pico',        value: '92%',  detail: 'Martes 10:00–12:00', status: 'ok' },
            { label: 'Hora más rentable',     value: '11 AM', detail: '$38.000 promedio',   status: 'ok' },
            { label: 'Día más rentable',      value: 'Martes', detail: 'vs promedio +24%',  status: 'ok' },
            { label: 'Crecimiento vs período anterior', value: '+12%', detail: 'en ingresos totales', status: 'ok' },
            { label: 'Rotación de espacios',  value: '3.2x',  detail: 'usos por espacio/día', status: 'ok' },
            { label: 'Mensualidades activas', value: '8',    detail: '4 carros · 3 motos · 1 bici', status: 'ok' },
        ],
        rows: generateMockRows(state),
    };
    if (state.type === 'vehicle') {
        base.rows = base.rows.map(r => ({ ...r, placa: state.vehiclePlate || 'ABC123' }));
    }
    return base;
}

function generateMockRows(state) {
    const plates  = ['ABC123','XYZ456','BCD789','DEF012','GHI345','JKL678'];
    const allTypes = ['Carro','Moto','Bicicleta'];
    const count   = state.type === 'monthly' ? 20 : 10;
    const typeMap = { car: 'Carro', moto: 'Moto', bike: 'Bicicleta' };
    const forcedType = (state.vehicleType && state.vehicleType !== 'all')
        ? typeMap[state.vehicleType]
        : null;

    return Array.from({ length: count }, (_, i) => {
        const hour = 7 + Math.floor(Math.random() * 10);
        const stay = 1 + Math.floor(Math.random() * 5);
        const type = forcedType || allTypes[Math.floor(Math.random() * allTypes.length)];
        const rate = type === 'Carro' ? 3000 : type === 'Moto' ? 1500 : 1000;
        return {
            placa:    plates[i % plates.length],
            tipo:     type,
            ingreso:  `${String(hour).padStart(2,'0')}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}`,
            salida:   `${String(hour+stay).padStart(2,'0')}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}`,
            duracion: `${stay}h`,
            tarifa:   `$${(rate*stay).toLocaleString('es-CO')}`,
            pago:     pickPaymentMethod(),
            conductor:`Cliente ${i+1}`,
        };
    });
}

function getDefaultPrices() {
    return { car: { hour: 3000, day: 15000, month: 250000 }, moto: { hour: 1500, day: 8000, month: 120000 }, bike: { hour: 1000, day: 5000, month: 80000 } };
}

/* ─── VEHICLE TABLE ──────────────────────── */
const _vehState = { type: 'all', pay: 'all', search: '', page: 1, perPage: 5 };

function setVehType(type, btn) {
    _vehState.type = type;
    _vehState.page = 1;
    document.querySelectorAll('.veh-tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    renderVehTable();
}

function setVehPay(pay, btn) {
    _vehState.pay = pay;
    _vehState.page = 1;
    document.querySelectorAll('.veh-pay').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    renderVehTable();
}

function filterVehTable() {
    _vehState.search = document.getElementById('vehSearch')?.value.toLowerCase() || '';
    _vehState.page   = 1;
    renderVehTable();
}

function _filterVehData() {
    return _vehData.filter(r => {
        const matchType   = _vehState.type === 'all' || r.tipo === _vehState.type;
        const matchPay    = _vehState.pay  === 'all' || r.pago === _vehState.pay;
        const matchSearch = !_vehState.search || r.placa.toLowerCase().includes(_vehState.search);
        return matchType && matchPay && matchSearch;
    });
}

function renderVehTable() {
    const tbody = document.getElementById('vehTableBody');
    const countEl = document.getElementById('vehCount');
    const pagesEl = document.getElementById('vehPages');
    if (!tbody) return;
    const filtered = _filterVehData();
    const total   = filtered.length;
    const pages   = Math.max(1, Math.ceil(total / _vehState.perPage));
    _vehState.page = Math.min(_vehState.page, pages);
    const start   = (_vehState.page - 1) * _vehState.perPage;
    const slice   = filtered.slice(start, start + _vehState.perPage);
    const TIPO_MAP = {
        car:  { icon: 'directions_car', label: 'Automóvil'   },
        moto: { icon: 'two_wheeler',    label: 'Motocicleta' },
        bike: { icon: 'pedal_bike',     label: 'Bicicleta'   },
    };
    tbody.innerHTML = slice.length === 0
        ? `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted);font-family:var(--font-label)">Sin resultados</td></tr>`
        : slice.map(r => {
            const t = TIPO_MAP[r.tipo];
            return `<tr>
                <td><span class="veh-placa">${r.placa}</span></td>
                <td><span class="veh-tipo"><span class="material-symbols-outlined">${t.icon}</span> ${t.label}</span></td>
                <td style="font-family:var(--font-label)">${r.entrada}</td>
                <td style="font-family:var(--font-label);color:var(--text-muted)">${r.duracion}</td>
                <td><span class="zona-badge zona-badge--${r.zona}">Zona ${r.zona}</span></td>
                <td><span class="estado-badge">Activo</span></td>
                <td><span class="pago-badge pago-badge--${r.pago}">${r.pago === 'paid' ? 'Pagado' : 'Pendiente'}</span></td>
                <td style="font-size:12px;color:var(--text-muted);font-family:var(--font-label)">${r.operador}</td>
                <td>
                    <div class="veh-actions">
                        <button class="veh-action-btn" title="Ver detalle" aria-label="Ver detalle"><span class="material-symbols-outlined">visibility</span></button>
                        <button class="veh-action-btn" title="Más opciones" aria-label="Más opciones"><span class="material-symbols-outlined">more_vert</span></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    if (countEl) {
        countEl.textContent = total === 0
            ? 'Sin resultados'
            : `Mostrando ${start+1} a ${Math.min(start+_vehState.perPage, total)} de ${total} vehículos`;
    }
    if (pagesEl) renderVehPagination(pagesEl, pages);
}

function renderVehPagination(container, totalPages) {
    const cur = _vehState.page;
    const btns = [];
    btns.push(`<button class="veh-page-btn" onclick="goVehPage(${cur-1})" ${cur===1?'disabled':''}><span class="material-symbols-outlined">chevron_left</span></button>`);
    const range = buildPageRange(cur, totalPages);
    range.forEach(p => {
        if (p === '...') {
            btns.push(`<span class="veh-page-btn" style="cursor:default;border:none;background:none">…</span>`);
        } else {
            btns.push(`<button class="veh-page-btn ${p===cur?'active':''}" onclick="goVehPage(${p})">${p}</button>`);
        }
    });
    btns.push(`<button class="veh-page-btn" onclick="goVehPage(${cur+1})" ${cur===totalPages?'disabled':''}><span class="material-symbols-outlined">chevron_right</span></button>`);
    container.innerHTML = btns.join('');
}

function buildPageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 3)   return [1, 2, 3, '...', total];
    if (cur >= total - 2) return [1, '...', total - 2, total - 1, total];
    return [1, '...', cur - 1, cur, cur + 1, '...', total];
}

function goVehPage(p) {
    const total = Math.ceil(_filterVehData().length / _vehState.perPage);
    if (p < 1 || p > total) return;
    _vehState.page = p;
    renderVehTable();
}

/* ─── CHARTS ────────────────────────────── */
const _ocupData = {
    today: [5,8,12,22,35,48,62,75,82,78,85,91,88,84,90,95,87,72,58,42,28,18,10,5],
    week:  [12,15,18,25,38,50,65,72,78,75,80,85,82,80,86,88,80,68,55,40,30,22,15,8],
};

function _destroyChart(id) {
    const chart = Chart.getChart(id);
    if (chart) chart.destroy();
}

const _chartBaseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

function initCharts() {
    if (typeof Chart === 'undefined') return;
    _destroyChart('chartIngresos');
    _destroyChart('chartDistribucion');
    _destroyChart('chartOcupacion');
    _destroyChart('chartMetodoPago');

    const ingresosCtx = document.getElementById('chartIngresos');
    if (ingresosCtx) {
        window._chartIngresos = new Chart(ingresosCtx, {
            type: 'bar',
            data: {
                labels: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
                datasets: [
                    { label: 'Actual', data: [32,45,38,52,48,28,15], backgroundColor: 'rgba(0,240,255,0.6)', borderRadius: 4 },
                    { label: 'Anterior', data: [28,40,35,48,42,25,12], backgroundColor: 'rgba(65,71,83,0.5)', borderRadius: 4 },
                ]
            },
            options: { ..._chartBaseOpts, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } } }
        });
    }

    const distCtx = document.getElementById('chartDistribucion');
    if (distCtx) {
        window._chartDistribucion = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: ['Carros','Motos','Bicicletas'],
                datasets: [{ data: [60, 29, 11], backgroundColor: ['#4facfe','#00f0ff','#c084fc'], borderWidth: 0 }]
            },
            options: { ..._chartBaseOpts, cutout: '70%' }
        });
        const legendEl = document.getElementById('donutLegend');
        if (legendEl) {
            const items = [
                { label: 'Carros', color: '#4facfe', value: '60%' },
                { label: 'Motos', color: '#00f0ff', value: '29%' },
                { label: 'Bicicletas', color: '#c084fc', value: '11%' },
            ];
            legendEl.innerHTML = items.map(i => `
                <div class="donut-legend-item">
                    <span class="donut-legend-item__label">
                        <span class="donut-legend-item__dot" style="background:${i.color}"></span>
                        ${i.label}
                    </span>
                    <span class="donut-legend-item__value">${i.value}</span>
                </div>`).join('');
        }
    }

    const ocupaCtx = document.getElementById('chartOcupacion');
    if (ocupaCtx) {
        window._chartOcupacion = new Chart(ocupaCtx, {
            type: 'bar',
            data: {
                labels: ['6-8','8-10','10-12','12-14','14-16','16-18','18-20','20-22'],
                datasets: [{
                    label: 'Ocupación %',
                    data: [25, 55, 78, 65, 82, 88, 60, 30],
                    backgroundColor: ['#4ade80','#a3e635','#facc15','#fb923c','#f87171','#f87171','#fb923c','#a3e635'],
                    borderRadius: 4
                }]
            },
            options: { ..._chartBaseOpts, indexAxis: 'y', scales: { x: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } } } }
        });
    }

    initChartMetodoPago();
}

/* ─── CHART: MÉTODO DE PAGO (stacked bar) ── */
function initChartMetodoPago() {
    if (typeof Chart === 'undefined') return;
    _destroyChart('chartMetodoPago');
    const ctx = document.getElementById('chartMetodoPago');
    if (!ctx) return;

    const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    // Income distribution: Efectivo 50%, POS 30%, ePayco 20% — totals match chartIngresos
    const efectivoData = [160000, 220000, 190000, 260000, 240000, 140000, 75000];
    const posData      = [ 96000, 132000, 114000, 156000, 144000,  84000, 45000];
    const epaycoData   = [ 64000,  88000,  76000, 104000,  96000,  56000, 30000];

    window._chartMetodoPago = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                { label: 'Efectivo', data: efectivoData, backgroundColor: '#4ade80', borderRadius: 2 },
                { label: 'POS',      data: posData,      backgroundColor: '#4facfe', borderRadius: 2 },
                { label: 'ePayco',   data: epaycoData,   backgroundColor: '#c084fc', borderRadius: 2 },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgba(139,145,158,0.9)',
                        font: { family: "'Space Grotesk', sans-serif", size: 11 },
                        usePointStyle: true,
                        padding: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: $${ctx.raw.toLocaleString('es-CO')}`,
                        footer: items => {
                            const total = items.reduce((sum, i) => sum + i.raw, 0);
                            return ` Total: $${total.toLocaleString('es-CO')}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: 'rgba(139,145,158,0.7)', font: { family: "'Space Grotesk', sans-serif" } }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: 'rgba(139,145,158,0.7)',
                        callback: v => '$' + (v / 1000).toFixed(0) + 'k'
                    }
                }
            }
        }
    });
}

const sparkLineConfig = (data, color) => ({
    type: 'line',
    data: {
        labels: data.map((_, i) => i),
        datasets: [{ data, borderColor: color, borderWidth: 2, pointRadius: 0, fill: true, backgroundColor: color.replace(')', ', 0.12)').replace('rgb', 'rgba'), tension: 0.4 }]
    },
    options: {
        responsive: false, animation: { duration: 800, easing: 'easeInOutQuart' },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false, min: 0 } },
        elements: { line: { borderCapStyle: 'round' } }
    }
});

const sparkBarConfig = (data, colors) => ({
    type: 'bar',
    data: {
        labels: data.map((_, i) => i),
        datasets: [{ data, backgroundColor: colors, borderRadius: 2, borderSkipped: false }]
    },
    options: {
        responsive: false, animation: { duration: 800 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false, min: 0 } }
    }
});

function initSparklines() {
    if (typeof Chart === 'undefined') return;
    ['sparkVehicles','sparkIncome','sparkTime','sparkPico','sparkOcupacion'].forEach(_destroyChart);

    const lines = [
        { id:'sparkVehicles', data:[68,72,85,91,78,95,102,110,118,124], color:'rgb(79,172,254)' },
        { id:'sparkIncome', data:[1800000,1950000,2100000,1900000,2200000,2350000,2450000,2400000,2420000,2450000], color:'rgb(74,222,128)' },
        { id:'sparkTime', data:[3.2,3.5,3.1,3.8,3.3,2.9,3.0,2.8,2.75,2.75], color:'rgb(192,132,252)' },
    ];
    lines.forEach(({ id, data, color }) => {
        const el = document.getElementById(id);
        if (el) new Chart(el, sparkLineConfig(data, color));
    });

    const elP = document.getElementById('sparkPico');
    if (elP) {
        const d = [20,30,55,65,70,60,72,88,95,85,75,60,45];
        new Chart(elP, sparkBarConfig(d, d.map((v,i) => i===10?'#f87171':'rgba(248,113,113,0.35)')));
    }

    const elO = document.getElementById('sparkOcupacion');
    if (elO) new Chart(elO, {
        type:'doughnut',
        data:{ datasets:[{ data:[78,22], backgroundColor:['#fb923c','rgba(65,71,83,0.3)'], borderWidth:0 }] },
        options:{ responsive:false, cutout:'72%', animation:{ duration:1000, easing:'easeInOutQuart' }, plugins:{ legend:{ display:false }, tooltip:{ enabled:false } } }
    });
}

function initOcupHoraWidget() {
    if (typeof Chart === 'undefined') return;
    _destroyChart('chartOcupHora');
    const el = document.getElementById('chartOcupHora');
    if (!el) return;
    const data   = _ocupData.today;
    const labels = Array.from({ length: 24 }, (_, i) => i % 2 === 0 ? String(i).padStart(2,'0') : '');
    const avg    = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
    window._chartOcupHora = new Chart(el, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: data.map(v =>
                        v >= 80 ? 'rgba(0,240,255,0.85)' : v >= 55 ? 'rgba(0,240,255,0.55)' : 'rgba(0,240,255,0.25)'
                    ),
                    borderRadius: 3, borderSkipped: false,
                },
                {
                    data: Array(24).fill(avg),
                    type: 'line',
                    borderColor: 'rgba(251,146,60,0.7)',
                    borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, fill: false, tension: 0,
                }
            ]
        },
        options: {
            responsive: false, animation: { duration: 600 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: ctx => `${String(ctx[0].dataIndex).padStart(2,'0')}:00`,
                        label: ctx => ctx.datasetIndex === 0 ? ` ${ctx.raw}% ocupación` : ` Promedio: ${ctx.raw}%`
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color:'rgba(139,145,158,0.7)', font:{ size:9, family:'Space Grotesk' }, maxRotation:0 } },
                y: { min: 0, max: 100, grid: { color: 'rgba(65,71,83,0.2)' }, ticks: { color:'rgba(139,145,158,0.7)', font:{ size:9 }, stepSize:25, callback: v => v + '%' } }
            }
        }
    });
    const avgEl = document.getElementById('ocupHoraAvg');
    if (avgEl) avgEl.textContent = avg + '%';
}

function updateOcupHoraChart(range) {
    const chart = Chart.getChart('chartOcupHora');
    if (!chart) return;
    const data = _ocupData[range] || _ocupData.today;
    const avg  = Math.round(data.reduce((a,b) => a+b, 0) / data.length);
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = data.map(v =>
        v >= 80 ? 'rgba(0,240,255,0.85)' : v >= 55 ? 'rgba(0,240,255,0.55)' : 'rgba(0,240,255,0.25)'
    );
    chart.data.datasets[1].data = Array(24).fill(avg);
    chart.update('active');
    const avgEl = document.getElementById('ocupHoraAvg');
    if (avgEl) avgEl.textContent = avg + '%';
}
