/* ══════════════════════════════════════════
   PUNTO PARK U — Panel Admin JS
══════════════════════════════════════════ */

// ─── Estado global ───────────────────────
let selectedReportType = null;

// Guard mínimo — válido solo para demo/académico
if (sessionStorage.getItem('adminAuth') !== 'true') {
  window.location.href = '../Admi.html';
}

// ─── Init ─────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    updatePricePreview();
    updateSchedulePreview();
    labelPriceCellsForMobile();
    initParkingMap();
});

// ─── NAVEGACIÓN SPA ───────────────────────
function navigate(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    const target = document.getElementById('view-' + view);
    if (target) target.classList.add('active');

    const titles = {
        dashboard: 'dashboard',
        mapa:      'mapa en Vivo',
        tarifas:   'tarifas',
        horarios:  'horarios',
        informes:  'informes',
        monitoreo: 'monitoreo',
        sistema:   'estado del Sistema'
    };
    const titleEl = document.getElementById('topbarViewTitle');
    if (titleEl) titleEl.textContent = titles[view] || view;

    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    closeSidebar();

    if (view === 'tarifas') updatePricePreview();
    if (view === 'horarios') updateSchedulePreview();
    if (view === 'informes') {
        reportState.type = 'financial';
        setTimeout(initCharts, 100);
        renderInfTable();
        updateInfKpis();
    }
}

// ─── SIDEBAR MÓVIL ────────────────────────
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}

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
        { label: '🏍️ Moto / Hora',   id: 'motoHour'  },
        { label: '🏍️ Moto / Día',    id: 'motoDay'   },
        { label: '🏍️ Moto / Mes',    id: 'motoMonth' },
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

// ─── SWITCH VEHICLE TAB ────────────────────
function switchVehicleTab(vehicle, btn) {
    document.querySelectorAll('.vehicle-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tariff-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('panel-' + vehicle);
    if (panel) panel.classList.add('active');
}

// ─── UPDATE LIVE TARIFF CARD ──────────────
function updateTariffLiveCard(vehicle) {
    ['Hour', 'Day', 'Month'].forEach(period => {
        const id = vehicle + period;
        const input = document.getElementById(id);
        const preview = document.getElementById('live-' + id);
        if (input && preview) {
            preview.textContent = formatCOP(input.value);
        }
    });
}

// ─── INFORME: FILTROS ─────────────────────
function setInfPeriod(period, btn) {
    document.querySelectorAll('.inf-period-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const customRange = document.getElementById('infCustomRange');
    if (customRange) customRange.style.display = period === 'custom' ? 'flex' : 'none';
}

function setInfType(type, btn) {
    document.querySelectorAll('.inf-type-pill').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
}

function applyCustomRange() {
    showToast('✅ Rango personalizado aplicado');
}

function filterInfTable(query) {
    document.querySelectorAll('#infTableBody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

// ─── INFORME: KPIs ────────────────────────
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
}

// ─── INFORME: TABLA ───────────────────────
function renderInfTable() {
    const tbody = document.getElementById('infTableBody');
    if (!tbody) return;
    const plates = ['ABC123','XYZ456','BCD789','DEF012','GHI345','JKL678','MNO901','PQR234','STU567','VWX890'];
    const types = ['Carro','Moto','Bicicleta'];
    const methods = ['Efectivo','Transferencia','Tarjeta','ePayco'];
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
            <td>${methods[Math.floor(Math.random() * methods.length)]}</td>
        </tr>`;
    }).join('');
    tbody.innerHTML = rows;
    const countEl = document.getElementById('infTableCount');
    if (countEl) countEl.textContent = 'Mostrando ' + (rows.length) + ' registros';
}

// ─── INFORME: CHART.JS ────────────────────
function initCharts() {
    if (typeof Chart === 'undefined') return;
    // Destroy previous instances if any
    if (window._chartIngresos) { window._chartIngresos.destroy(); }
    if (window._chartDistribucion) { window._chartDistribucion.destroy(); }
    if (window._chartOcupacion) { window._chartOcupacion.destroy(); }

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
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
            }
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
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                cutout: '70%'
            }
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
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } } }
            }
        });
    }
}

// ─── GUARDAR HORARIOS ─────────────────────
function saveSchedule() {
    const schedule = {
        weekday: { open: getVal('weekdayOpen'), close: getVal('weekdayClose') },
        sunday:  { open: getVal('sundayOpen'),  close: getVal('sundayClose')  }
    };

    localStorage.setItem('parkingSchedule', JSON.stringify(schedule));
    addToHistory('Se actualizaron los horarios de atención');
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

// ─── MAPA DE PARQUEO ─────────────────────
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

// ─── HISTORIAL ────────────────────────────
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
        </div>
    `;

    container.insertBefore(item, container.firstChild);
    while (container.children.length > 10) container.removeChild(container.lastChild);
}

// ─── TOAST ────────────────────────────────
function showToast(message, isWarning = false) {
    const toast     = document.getElementById('toast');
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

function labelPriceCellsForMobile() {
    // Deprecado — la UI de tarifas usa .tariff-card y no necesita labels móviles
}


/* ══════════════════════════════════════════
   PUNTO PARK U — Módulo de Informes
   Agrega esto al final de panel.js
   (o reemplaza las funciones de reportes existentes)
══════════════════════════════════════════ */

// ─── Estado del módulo de informes ────────
const reportState = {
    type:         null,   // 'daily' | 'monthly' | 'vehicle' | 'financial'
    dailyDate:    null,
    monthlyDate:  null,
    vehiclePlate: '',
    vehicleType:  'all',
    financialRange: 'day',
    financialFrom: null,
    financialTo:   null,
};

// ─── SELECCIONAR TIPO ─────────────────────
function selectReport(type, element) {
    reportState.type = type;

    // Limpiar selección visual
    document.querySelectorAll('.report-type-card').forEach(c => {
        c.classList.remove('selected');
        const f = c.querySelector('.report-filter');
        if (f) f.classList.remove('visible');
    });

    element.classList.add('selected');

    // Mostrar filtro correspondiente
    const filter = document.getElementById('filter-' + type);
    if (filter) {
        filter.classList.add('visible');
        // Inicializar límites de fecha al abrir
        if (type === 'daily')   initDailyLimits();
        if (type === 'monthly') initMonthlyLimits();
    }
}

// ─── REPORTE DIARIO — validación ─────────
function initDailyLimits() {
    const input = document.getElementById('dailyDate');
    if (!input) return;
 
    const today   = new Date();
    const maxBack = new Date();
    maxBack.setDate(today.getDate() - 5);
    maxBack.setHours(0, 0, 0, 0); // ← 4 args: limpia ms
 
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
    minDate.setHours(0, 0, 0, 0); // ← 4 args
 
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

// ─── REPORTE MENSUAL — validación ────────
function initMonthlyLimits() {
    const input = document.getElementById('monthlyDate');
    if (!input) return;
 
    const today    = new Date();
    const maxMonth = getMaxAvailableMonth(today);
 
    // Límite: 12 meses atrás desde hoy
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

// ─── REPORTE POR VEHÍCULO ─────────────────
function formatPlate(input) {
    // Formato colombiano: ABC123 o AB123C
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    reportState.vehiclePlate = input.value;

    const hint = document.getElementById('vehicleHint');
    const plate = input.value;

    if (plate.length === 0) { hint.textContent = ''; return; }

    // Validación formato colombiano: 3 letras + 3 dígitos (carros/motos) o 3+3
    const isValid = /^[A-Z]{3}[0-9]{3}$/.test(plate) ||
                    /^[A-Z]{2}[0-9]{3}[A-Z]$/.test(plate);

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

// ─── ANÁLISIS FINANCIERO — rangos ─────────
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

// ─── VALIDAR ANTES DE DESCARGAR ──────────
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

// ─── DESCARGAR REPORTE ────────────────────
async function downloadReport(format) {
    if (!validateReportState()) return;
    const reportContent = buildReportContent(reportState, format);
    if (format === 'pdf') {
        await downloadAsPDF(reportContent);   // ← await
    } else {
        downloadAsExcel(reportContent);
    }
 
    const names = {
        daily:     'Reporte Diario',
        monthly:   'Reporte Mensual',
        vehicle:   'Reporte por Vehículo',
        financial: 'Análisis Financiero'
    };
 
    addToHistory(`Se generó ${names[reportState.type]} en ${format.toUpperCase()}`);
    showToast(`📥 Descargando ${names[reportState.type]} (${format.toUpperCase()})…`);
}

// ─── CONSTRUIR CONTENIDO DEL REPORTE ──────
function buildReportContent(state, format) {
    const now = new Date();
    const generatedAt = now.toLocaleString('es-CO');
    const prices = JSON.parse(localStorage.getItem('parkingPrices')) || getDefaultPrices();

    // Datos simulados — reemplazar con llamada a BD
    const mockData = getMockData(state);

    return {
        meta: {
            title:       getReportTitle(state),
            subtitle:    getReportSubtitle(state),
            generatedAt,
            period:      getReportPeriod(state),
        },
        summary:   mockData.summary,
        breakdown: mockData.breakdown,
        kpis:      mockData.kpis,
        rows:      mockData.rows,
        prices,
        state,
    };
}

function getReportTitle(state) {
    const titles = {
        daily:     '📅 Reporte Diario — Punto Park U',
        monthly:   '📆 Reporte Mensual — Punto Park U',
        vehicle:   '🚗 Reporte por Vehículo — Punto Park U',
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
            if (state.financialRange === 'week')   return `Semana actual`;
            if (state.financialRange === 'month')  return new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
            return `${fmt(new Date(state.financialFrom + 'T00:00:00'))} → ${fmt(new Date(state.financialTo + 'T00:00:00'))}`;
        default: return '';
    }
}

// ─── DATOS SIMULADOS (reemplazar con BD) ──
function getMockData(state) {
    // Estos valores vendrán de tu BD cuando la conectes.
    // Estructura lista para ser llenada con datos reales.
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

    // Para vehículo: filtrar por placa
    if (state.type === 'vehicle') {
        base.rows = base.rows.map(r => ({ ...r, placa: state.vehiclePlate || 'ABC123' }));
    }

    return base;
}

function generateMockRows(state) {
    const plates   = ['ABC123','XYZ456','BCD789','DEF012','GHI345','JKL678'];
    const types    = ['Carro','Moto','Bicicleta'];
    const methods  = ['Efectivo','Transferencia','Tarjeta'];
    const rows     = [];
    const count    = state.type === 'monthly' ? 20 : 10;

    for (let i = 0; i < count; i++) {
        const hour = 7 + Math.floor(Math.random() * 10);
        const stay = 1 + Math.floor(Math.random() * 5);
        const type = types[Math.floor(Math.random() * types.length)];
        const rate = type === 'Carro' ? 3000 : type === 'Moto' ? 1500 : 1000;
        rows.push({
            placa:   plates[i % plates.length],
            tipo:    type,
            ingreso: `${String(hour).padStart(2,'0')}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}`,
            salida:  `${String(hour + stay).padStart(2,'0')}:${Math.floor(Math.random()*60).toString().padStart(2,'0')}`,
            duracion: `${stay}h`,
            tarifa:  `$${(rate * stay).toLocaleString('es-CO')}`,
            pago:    methods[Math.floor(Math.random() * methods.length)],
            conductor: `Cliente ${i + 1}`,
        });
    }
    return rows;
}

function getDefaultPrices() {
    return { car: { hour: 3000, day: 15000, month: 250000 }, moto: { hour: 1500, day: 8000, month: 120000 }, bike: { hour: 1000, day: 5000, month: 80000 } };
}

// ─── GENERAR PDF (HTML imprimible) ────────
async function downloadAsPDF(content) {
    const logoBase64 = await getLogoBase64();
    const html = buildPrintableHTML(content, logoBase64);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank', 'width=900,height=700');
    win.onload = () => {
        win.print();
        URL.revokeObjectURL(url);
    };
}

function buildPrintableHTML(c, logoBase64 = null) {
    const isFinancial = c.state.type === 'financial';
    const rows = c.rows.map(r => `
        <tr>
            <td>${r.placa}</td>
            <td>${r.tipo}</td>
            <td>${r.ingreso}</td>
            <td>${r.salida}</td>
            <td>${r.duracion}</td>
            <td><strong>${r.tarifa}</strong></td>
            <td>${r.pago}</td>
            <td>${r.conductor}</td>
        </tr>`).join('');

    const kpisBlock = isFinancial ? `
        <h2 style="color:#1e3c72;margin:32px 0 12px">📊 KPIs del Período</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
            ${c.kpis.map(k => `
                <div style="background:#f0f7ff;border-left:4px solid #4facfe;padding:12px 16px;border-radius:8px">
                    <div style="font-size:11px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:.5px">${k.label}</div>
                    <div style="font-size:22px;font-weight:800;color:#1e3c72;margin:4px 0">${k.value}</div>
                    <div style="font-size:11px;color:#888">${k.detail}</div>
                </div>`).join('')}
        </div>
        <h2 style="color:#1e3c72;margin:0 0 12px">💼 Ingresos por Tipo de Vehículo</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
            <thead><tr style="background:#1e3c72;color:white">
                <th style="padding:10px 14px;text-align:left">Tipo</th>
                <th style="padding:10px 14px;text-align:right">Vehículos</th>
                <th style="padding:10px 14px;text-align:right">Ingresos</th>
                <th style="padding:10px 14px;text-align:right">% del total</th>
            </tr></thead>
            <tbody>${c.breakdown.map((b,i) => `
                <tr style="background:${i % 2 === 0 ? '#fff' : '#f8f9fa'}">
                    <td style="padding:10px 14px">${b.tipo}</td>
                    <td style="padding:10px 14px;text-align:right">${b.cantidad}</td>
                    <td style="padding:10px 14px;text-align:right;font-weight:700">$${b.ingresos.toLocaleString('es-CO')}</td>
                    <td style="padding:10px 14px;text-align:right">${b.porcentaje}%</td>
                </tr>`).join('')}
            </tbody>
        </table>` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${c.meta.title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',sans-serif; color:#222; padding:32px 40px; font-size:13px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1e3c72; padding-bottom:20px; margin-bottom:24px; }
  .brand { font-size:22px; font-weight:800; color:#1e3c72; }
  .brand span { color:#4facfe; }
  .meta { text-align:right; font-size:11px; color:#666; line-height:1.6; }
  .report-title { font-size:18px; font-weight:700; color:#1e3c72; margin-bottom:4px; }
  .report-sub { font-size:13px; color:#555; }
  .summary-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:24px 0; }
  .summary-card { background:linear-gradient(135deg,#e3f2fd,#bbdefb); border-radius:10px; padding:16px; }
  .summary-card .val { font-size:24px; font-weight:800; color:#1e3c72; }
  .summary-card .lbl { font-size:11px; color:#555; text-transform:uppercase; letter-spacing:.5px; margin-top:2px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { background:#1e3c72; color:white; padding:10px 12px; text-align:left; font-weight:600; }
  td { padding:8px 12px; border-bottom:1px solid #e8ecf0; }
  tr:nth-child(even) td { background:#f8f9fa; }
  .footer { margin-top:32px; padding-top:16px; border-top:1px solid #ddd; font-size:10px; color:#999; text-align:center; }
  .badge { display:inline-block; padding:2px 8px; border-radius:99px; font-size:10px; font-weight:700; }
  .badge-ok { background:#d1fae5; color:#065f46; }
  @media print {
    body { padding:16px 24px; }
    button { display:none; }
    @page { margin:12mm; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      ${logoBase64
    ? `<img src="${logoBase64}" alt="Punto Park U" style="height:48px;object-fit:contain;margin-bottom:4px">`
    : `<div class="brand">🅿️ Punto Park <span>U</span></div>`
}
      <div class="report-title" style="margin-top:8px">${c.meta.title.replace(/[📅📆🚗💰]/gu,'').trim()}</div>
      <div class="report-sub">${c.meta.subtitle}</div>
    </div>
    <div class="meta">
      <strong>Período:</strong> ${c.meta.period}<br>
      <strong>Generado:</strong> ${c.meta.generatedAt}<br>
      <strong>Administrador:</strong> Parking<br>
      <span class="badge badge-ok">✓ Según normativa colombiana</span>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="val">$${c.summary.totalIngresos.toLocaleString('es-CO')}</div>
      <div class="lbl">Ingresos del período</div>
    </div>
    <div class="summary-card">
      <div class="val">${c.summary.totalVehiculos}</div>
      <div class="lbl">Vehículos atendidos</div>
    </div>
    <div class="summary-card">
      <div class="val">${c.summary.tasaOcupacion}%</div>
      <div class="lbl">Tasa de ocupación</div>
    </div>
    <div class="summary-card">
      <div class="val">$${c.summary.ticketPromedio.toLocaleString('es-CO')}</div>
      <div class="lbl">Ticket promedio</div>
    </div>
    <div class="summary-card">
      <div class="val">${c.summary.tiempoPromedio}</div>
      <div class="lbl">Tiempo promedio estadía</div>
    </div>
    <div class="summary-card">
      <div class="val">$${c.summary.ingresosPorHora.toLocaleString('es-CO')}</div>
      <div class="lbl">Ingreso promedio/hora</div>
    </div>
  </div>

  ${kpisBlock}

  <h2 style="color:#1e3c72;margin:0 0 12px">📋 Registro de Vehículos</h2>
  <table>
    <thead>
      <tr>
        <th>Placa</th><th>Tipo</th><th>Ingreso</th><th>Salida</th>
        <th>Duración</th><th>Tarifa</th><th>Pago</th><th>Conductor</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    Documento generado por Panel Administrador — Punto Park U · ${c.meta.generatedAt}<br>
    Este reporte cumple con los requisitos de la Resolución 4100 de 2004 y normativa colombiana de parqueaderos.
  </div>
</body>
</html>`;
}

// ─── GENERAR CSV (Excel) ──────────────────
function downloadAsExcel(content) {
    const isFinancial = content.state.type === 'financial';
 
    const dataRows = content.rows.map((r, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#e8f4fd'}">
            <td style="font-weight:700;color:#1e3c72;letter-spacing:1px">${r.placa}</td>
            <td>${r.tipo}</td>
            <td style="text-align:center">${r.ingreso}</td>
            <td style="text-align:center">${r.salida}</td>
            <td style="text-align:center">${r.duracion}</td>
            <td style="font-weight:700;color:#0a6620;text-align:right">${r.tarifa}</td>
            <td>${r.pago}</td>
            <td>${r.conductor}</td>
        </tr>`).join('');
 
    const kpisRows = isFinancial
        ? content.kpis.map(k => `
            <tr style="background:#e8f4fd">
                <td style="font-weight:600;color:#1e3c72">${k.label}</td>
                <td style="font-size:14pt;font-weight:800;color:#1e3c72;text-align:center">${k.value}</td>
                <td colspan="6" style="color:#555;font-size:10pt">${k.detail}</td>
            </tr>`).join('')
        : '';
 
    const breakdownRows = isFinancial
        ? content.breakdown.map((b, i) => `
            <tr style="background:${i % 2 === 0 ? '#fff' : '#f0f7ff'}">
                <td>${b.tipo}</td>
                <td style="text-align:right;font-weight:600">${b.cantidad}</td>
                <td style="font-weight:700;color:#0a6620;text-align:right">$${b.ingresos.toLocaleString('es-CO')}</td>
                <td style="text-align:right">${b.porcentaje}%</td>
                <td colspan="4"></td>
            </tr>`).join('')
        : '';
 
    const financialSection = isFinancial ? `
        <tr><td colspan="8" style="height:12px;border:none"></td></tr>
        <tr><td colspan="8" style="background:#1e3c72;color:white;font-weight:bold;font-size:12pt;padding:10px">
            📈 KPIs OPERATIVOS
        </td></tr>
        <tr>
            <th style="background:#2a5298;color:white;padding:8px">Indicador</th>
            <th style="background:#2a5298;color:white;padding:8px">Valor</th>
            <th style="background:#2a5298;color:white;padding:8px" colspan="6">Detalle</th>
        </tr>
        ${kpisRows}
        <tr><td colspan="8" style="height:12px;border:none"></td></tr>
        <tr><td colspan="8" style="background:#1e3c72;color:white;font-weight:bold;font-size:12pt;padding:10px">
            💼 INGRESOS POR TIPO DE VEHÍCULO
        </td></tr>
        <tr>
            <th style="background:#2a5298;color:white;padding:8px">Tipo</th>
            <th style="background:#2a5298;color:white;padding:8px;text-align:right">Vehículos</th>
            <th style="background:#2a5298;color:white;padding:8px;text-align:right">Ingresos</th>
            <th style="background:#2a5298;color:white;padding:8px;text-align:right">% del total</th>
            <td colspan="4" style="background:#2a5298"></td>
        </tr>
        ${breakdownRows}
    ` : '';
 
    const excelHTML = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Reporte</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
<style>
  body  { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #cce0f0; padding: 7px 10px; vertical-align: middle; }
  .no-border td { border: none; }
</style>
</head>
<body>
<table>
  <!-- Encabezado -->
  <tr class="no-border">
    <td colspan="8" style="font-size:18pt;font-weight:800;color:#1e3c72;border:none;padding:14px 10px 4px">
        🅿️ Punto Park U — ${content.meta.title.replace(/[📅📆🚗💰]/gu,'').trim()}
    </td>
  </tr>
  <tr class="no-border">
    <td colspan="8" style="font-size:11pt;color:#555;border:none;padding:2px 10px">
        ${content.meta.subtitle}
    </td>
  </tr>
  <tr class="no-border">
    <td colspan="8" style="font-size:9pt;color:#888;border:none;padding:2px 10px 12px">
        📅 Período: ${content.meta.period} &nbsp;|&nbsp; ⏱ Generado: ${content.meta.generatedAt} &nbsp;|&nbsp; ✅ Normativa colombiana
    </td>
  </tr>
 
  <!-- Resumen -->
  <tr>
    <td colspan="8" style="background:#1e3c72;color:white;font-weight:bold;font-size:12pt;padding:10px">
        📊 RESUMEN DEL PERÍODO
    </td>
  </tr>
  <tr>
    <td style="background:#deeeff;font-weight:600;color:#1e3c72">Ingresos totales</td>
    <td style="font-size:14pt;font-weight:800;color:#0a6620">$${content.summary.totalIngresos.toLocaleString('es-CO')}</td>
    <td style="background:#deeeff;font-weight:600;color:#1e3c72">Vehículos atendidos</td>
    <td style="font-size:14pt;font-weight:800;color:#1e3c72;text-align:center">${content.summary.totalVehiculos}</td>
    <td style="background:#deeeff;font-weight:600;color:#1e3c72">Tasa de ocupación</td>
    <td style="font-size:14pt;font-weight:800;color:#1e3c72;text-align:center">${content.summary.tasaOcupacion}%</td>
    <td style="background:#deeeff;font-weight:600;color:#1e3c72">Ticket promedio</td>
    <td style="font-size:12pt;font-weight:700;color:#0a6620">$${content.summary.ticketPromedio.toLocaleString('es-CO')}</td>
  </tr>
  <tr>
    <td style="background:#deeeff;font-weight:600;color:#1e3c72">Tiempo promedio estadía</td>
    <td style="font-size:12pt;font-weight:700;color:#1e3c72">${content.summary.tiempoPromedio}</td>
    <td style="background:#deeeff;font-weight:600;color:#1e3c72">Ingreso promedio/hora</td>
    <td style="font-size:12pt;font-weight:700;color:#0a6620">$${content.summary.ingresosPorHora.toLocaleString('es-CO')}</td>
    <td colspan="4"></td>
  </tr>
 
  ${financialSection}
 
  <!-- Registros de vehículos -->
  <tr><td colspan="8" style="height:12px;border:none"></td></tr>
  <tr>
    <td colspan="8" style="background:#1e3c72;color:white;font-weight:bold;font-size:12pt;padding:10px">
        📋 REGISTRO DE VEHÍCULOS
    </td>
  </tr>
  <tr>
    <th style="background:#2a5298;color:white;padding:8px">Placa</th>
    <th style="background:#2a5298;color:white;padding:8px">Tipo</th>
    <th style="background:#2a5298;color:white;padding:8px;text-align:center">Ingreso</th>
    <th style="background:#2a5298;color:white;padding:8px;text-align:center">Salida</th>
    <th style="background:#2a5298;color:white;padding:8px;text-align:center">Duración</th>
    <th style="background:#2a5298;color:white;padding:8px;text-align:right">Tarifa</th>
    <th style="background:#2a5298;color:white;padding:8px">Método de Pago</th>
    <th style="background:#2a5298;color:white;padding:8px">Conductor</th>
  </tr>
  ${dataRows}
 
  <!-- Footer -->
  <tr><td colspan="8" style="height:12px;border:none"></td></tr>
  <tr class="no-border">
    <td colspan="8" style="font-size:9pt;color:#999;border:none;border-top:1px solid #ddd;padding:8px 10px">
        Documento generado por Panel Administrador — Punto Park U · ${content.meta.generatedAt}
    </td>
  </tr>
  <tr class="no-border">
    <td colspan="8" style="font-size:9pt;color:#999;border:none;padding:2px 10px">
        Resolución 4100 de 2004 · Normativa colombiana de parqueaderos
    </td>
  </tr>
</table>
</body>
</html>`;
 
    const blob = new Blob(['\uFEFF' + excelHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `PuntoParkU_${content.state.type}_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─── LOGO HELPER (base64 para PDF) ───────
async function getLogoBase64() {
    try {
        const res  = await fetch('../Images/Logo.png');
        const blob = await res.blob();
        return await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null; // Si falla, el PDF sale sin logo (no rompe nada)
    }
}

// ─── HELPERS FECHA ────────────────────────
function toInputDate(date) {
    return date.toISOString().split('T')[0];
}

function toInputMonth(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function fmt(date) {
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── ESC KEY ──────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
});