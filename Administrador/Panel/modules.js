/* ═══════════════════════════════════════════
   MODULES — Operator Monitoring, Heatmap, Active Integrations
   Vanilla JavaScript (ES6+) — Sin React, sin dependencias externas
═══════════════════════════════════════════ */

(function() {
'use strict';

/* ─── Datos mock ───────────────────────────── */
const OPERATORS = [
  { id: 1, name: 'Carlos Martínez', initials: 'CM', tickets: 47, avgResponse: 45, status: 'active', shift: '06:00 - 14:00' },
  { id: 2, name: 'Laura González', initials: 'LG', tickets: 38, avgResponse: 52, status: 'active', shift: '06:00 - 14:00' },
  { id: 3, name: 'Andrés Pérez', initials: 'AP', tickets: 29, avgResponse: 38, status: 'active', shift: '08:00 - 16:00' },
  { id: 4, name: 'María Rodríguez', initials: 'MR', tickets: 0, avgResponse: 0, status: 'off', shift: '14:00 - 22:00' },
  { id: 5, name: 'Jorge Ramírez', initials: 'JR', tickets: 0, avgResponse: 0, status: 'off', shift: '14:00 - 22:00' },
];

const INTEGRATIONS = [
  { id: 1, name: 'Cámaras LPR', icon: 'videocam', status: 'online', lastSync: 'Hace 2 seg', uptime: 99.97 },
  { id: 2, name: 'Barreras Automáticas', icon: 'sensor_door', status: 'online', lastSync: 'Hace 5 seg', uptime: 99.82 },
  { id: 3, name: 'Pasarela de Pago (POS/ePayco)', icon: 'payments', status: 'online', lastSync: 'Hace 1 seg', uptime: 99.99 },
];

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

/* ─── Helpers ───────────────────────────────── */

function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1,3), 16), g1 = parseInt(c1.slice(3,5), 16), b1 = parseInt(c1.slice(5,7), 16);
  const r2 = parseInt(c2.slice(1,3), 16), g2 = parseInt(c2.slice(3,5), 16), b2 = parseInt(c2.slice(5,7), 16);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

function heatColor(value) {
  const pct = value / 100;
  if (pct <= 0.25) return lerpColor('#4ade80', '#a3e635', pct / 0.25);
  if (pct <= 0.5)  return lerpColor('#a3e635', '#facc15', (pct - 0.25) / 0.25);
  if (pct <= 0.75) return lerpColor('#facc15', '#fb923c', (pct - 0.5) / 0.25);
  return lerpColor('#fb923c', '#f87171', Math.min((pct - 0.75) / 0.25, 1));
}

function formatTime(seconds) {
  if (seconds === 0) return '--';
  return `${Math.floor(seconds / 60)}m ${(seconds % 60).toString().padStart(2, '0')}s`;
}

function generateHeatmapData() {
  return DAY_NAMES.map((_, di) => {
    const isWeekend = di >= 5;
    return Array.from({ length: 24 }, (_, hi) => {
      if (hi < 6) return Math.floor(Math.random() * 10 + 2);
      if (hi < 8) return Math.floor(Math.random() * 20 + (isWeekend ? 5 : 15));
      if (hi < 10) return Math.floor(Math.random() * 25 + (isWeekend ? 15 : 40));
      if (hi < 12) return Math.floor(Math.random() * 20 + (isWeekend ? 25 : 65));
      if (hi < 14) return Math.floor(Math.random() * 20 + (isWeekend ? 20 : 55));
      if (hi < 16) return Math.floor(Math.random() * 20 + (isWeekend ? 30 : 70));
      if (hi < 18) return Math.floor(Math.random() * 20 + (isWeekend ? 40 : 75));
      if (hi < 20) return Math.floor(Math.random() * 20 + (isWeekend ? 30 : 55));
      if (hi < 22) return Math.floor(Math.random() * 15 + (isWeekend ? 15 : 25));
      return Math.floor(Math.random() * 10 + 5);
    });
  });
}

/* ─── Operator Monitoring ──────────────────── */
function initOperatorMonitoring() {
  const root = document.getElementById('operator-monitoring-root');
  if (!root) return;

  const activeCount = OPERATORS.filter(o => o.status === 'active').length;

  const header = document.createElement('div');
  header.className = 'module-header';
  header.innerHTML = `
    <div class="module-header__left">
      <span class="material-symbols-outlined">badge</span>
      <div>
        <div class="module-header__title">Monitoreo de Operadores</div>
        <div class="module-header__sub">Personal actualmente en turno</div>
      </div>
    </div>
    <span class="module-header__count">${activeCount} activos / ${OPERATORS.length} totales</span>`;
  root.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'operator-grid';
  grid.dataset.detailId = '';

  OPERATORS.forEach(op => {
    const card = document.createElement('div');
    card.className = `operator-card${op.status === 'off' ? ' operator-card--off' : ''}`;
    card.dataset.operatorId = op.id;

    card.innerHTML = `
      <div class="operator-card__top">
        <div class="operator-avatar operator-avatar--${op.status}">${op.initials}</div>
        <div class="operator-info">
          <div class="operator-name">${op.name}</div>
          <div class="operator-shift">${op.shift}</div>
        </div>
        <div class="operator-status operator-status--${op.status}">
          <span class="operator-status__dot operator-status__dot--${op.status}"></span>
          ${op.status === 'active' ? 'En turno' : 'Fuera'}
        </div>
      </div>
      <div class="operator-stats">
        <div class="operator-stat">
          <div class="operator-stat__value operator-stat__value--highlight">${op.tickets}</div>
          <div class="operator-stat__label">Tickets</div>
        </div>
        <div class="operator-stat">
          <div class="operator-stat__value">${formatTime(op.avgResponse)}</div>
          <div class="operator-stat__label">Respuesta</div>
        </div>
      </div>
      <div class="operator-card__actions">
        <button class="operator-btn operator-btn--details" data-opid="${op.id}">
          <span class="material-symbols-outlined">info</span>
          Detalles
        </button>
      </div>
      <div class="operator-detail-banner" id="detail-${op.id}" style="display:none">
        <span class="material-symbols-outlined">assignment</span>
        <div class="operator-detail-banner__text">
          <strong>${op.name}</strong> — Turno ${op.shift}. Ha procesado <strong>${op.tickets} tickets</strong> con tiempo promedio de respuesta de <strong>${formatTime(op.avgResponse)}</strong>. Última actividad registrada hace 2 minutos.
        </div>
      </div>`;

    grid.appendChild(card);
  });

  root.appendChild(grid);

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.operator-btn--details');
    if (!btn) return;
    const opId = btn.dataset.opid;
    const banner = document.getElementById(`detail-${opId}`);
    const isOpen = banner && banner.style.display !== 'none';

    document.querySelectorAll('.operator-detail-banner').forEach(b => b.style.display = 'none');
    document.querySelectorAll('.operator-btn--details').forEach(b => b.innerHTML = '<span class="material-symbols-outlined">info</span> Detalles');

    if (!isOpen && banner) {
      banner.style.display = 'flex';
      btn.innerHTML = '<span class="material-symbols-outlined">info</span> Cerrar';
    }
  });
}

/* ─── Occupancy Heatmap ────────────────────── */
function initOccupancyHeatmap() {
  const root = document.getElementById('heatmap-root');
  if (!root) return;

  const data = generateHeatmapData();
  let tooltipEl = null;

  const header = document.createElement('div');
  header.className = 'module-header';
  header.innerHTML = `
    <div class="module-header__left">
      <span class="material-symbols-outlined">grid_on</span>
      <div>
        <div class="module-header__title">Mapa de Ocupación</div>
        <div class="module-header__sub">Ocupación promedio por día y hora</div>
      </div>
    </div>`;
  root.appendChild(header);

  const container = document.createElement('div');
  container.className = 'heatmap-container';

  const legendSteps = [0, 10, 25, 50, 75, 90, 100];
  container.innerHTML = `
    <div class="heatmap-legend">
      <span class="heatmap-legend__min">0%</span>
      <div class="heatmap-legend__bar">
        ${legendSteps.map(v => `<div class="heatmap-legend__step" style="background:${heatColor(v)}"></div>`).join('')}
      </div>
      <span class="heatmap-legend__max">100%</span>
      <span class="heatmap-legend__label">Ocupación</span>
    </div>
    <div class="heatmap-wrapper">
      <div class="heatmap-table">
        <div class="heatmap-header-row">
          <div class="heatmap-header-row__spacer"></div>
          ${HOUR_LABELS.map((h, i) => `<div class="heatmap-header-row__label">${i % 3 === 0 ? h.split(':')[0] : ''}</div>`).join('')}
        </div>
        ${data.map((row, dayIdx) => `
          <div class="heatmap-row">
            <div class="heatmap-row__label">${DAY_NAMES[dayIdx]}</div>
            ${row.map((val, hour) => `
              <div class="heatmap-cell"
                   style="background:${heatColor(val)}"
                   data-day="${dayIdx}"
                   data-hour="${hour}"
                   data-value="${val}"></div>`).join('')}
          </div>`).join('')}
      </div>
    </div>`;

  container.addEventListener('mouseover', e => {
    const cell = e.target.closest('.heatmap-cell');
    if (!cell) {
      if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
      return;
    }
    const dayIdx = parseInt(cell.dataset.day);
    const hour = parseInt(cell.dataset.hour);
    const value = parseInt(cell.dataset.value);
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'heatmap-tooltip';
      document.body.appendChild(tooltipEl);
    }
    const rect = cell.getBoundingClientRect();
    tooltipEl.style.left = (rect.left + rect.width / 2) + 'px';
    tooltipEl.style.top = (rect.top - 8) + 'px';
    tooltipEl.style.transform = 'translate(-50%, -100%)';
    tooltipEl.innerHTML = `
      <div class="heatmap-tooltip__day">${DAY_NAMES[dayIdx]}</div>
      <div class="heatmap-tooltip__hour">${hour}:00</div>
      <div class="heatmap-tooltip__occupancy">
        <div class="heatmap-tooltip__bar">
          <div class="heatmap-tooltip__bar-fill" style="width:${value}%;background:${heatColor(value)}"></div>
        </div>
        <span class="heatmap-tooltip__value">${value}%</span>
      </div>`;
  });

  container.addEventListener('mouseout', e => {
    const related = e.relatedTarget;
    if (related && related.closest && related.closest('.heatmap-container')) return;
    if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
  });

  root.appendChild(container);
}

/* ─── Active Integrations ──────────────────── */
function initActiveIntegrations() {
  const root = document.getElementById('integrations-root');
  if (!root) return;

  const onlineCount = INTEGRATIONS.filter(i => i.status === 'online').length;

  const header = document.createElement('div');
  header.className = 'module-header';
  header.innerHTML = `
    <div class="module-header__left">
      <span class="material-symbols-outlined">api</span>
      <div>
        <div class="module-header__title">Integraciones Activas</div>
        <div class="module-header__sub">Estado de conexión de los sistemas externos</div>
      </div>
    </div>
    <span class="module-header__count">${onlineCount}/${INTEGRATIONS.length} en línea</span>`;
  root.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'integrations-grid';

  INTEGRATIONS.forEach(integration => {
    const card = document.createElement('div');
    card.className = `integration-card integration-card--${integration.status}`;
    card.innerHTML = `
      <div class="integration-card__icon integration-card__icon--${integration.status}">
        <span class="material-symbols-outlined">${integration.icon}</span>
      </div>
      <div class="integration-card__info">
        <div class="integration-card__name">${integration.name}</div>
        <div class="integration-card__meta">
          <span class="integration-card__meta-item">Última sincronización: <strong>${integration.lastSync}</strong></span>
          <span class="integration-card__meta-item">Uptime: <strong>${integration.uptime}%</strong></span>
        </div>
      </div>
      <div class="integration-card__status integration-card__status--${integration.status}">
        <span class="integration-card__status-dot integration-card__status-dot--${integration.status}"></span>
        ${integration.status === 'online' ? 'En línea' : 'Desconectado'}
      </div>`;
    grid.appendChild(card);
  });

  root.appendChild(grid);
}

/* ─── Init ──────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initOperatorMonitoring();
  initOccupancyHeatmap();
  initActiveIntegrations();
});

})();
