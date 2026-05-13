/* ══════════════════════════════════════════
   PUNTO PARK U — Admin Login
   Credenciales de prueba: admin / admin123
══════════════════════════════════════════ */

// Función llamada por onsubmit="handleLogin(event)" en el HTML
function handleLogin(e) {
  e.preventDefault();

  const user     = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');

  // Validaciones
  if (user.length < 3) {
    showError(errorMsg, 'El usuario debe tener al menos 3 caracteres.');
    return;
  }

  if (password.length < 6) {
    showError(errorMsg, 'La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  // Credencial de prueba — reemplazar por backend real en producción
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'admin123';

  if (user === ADMIN_USER && password === ADMIN_PASS) {
    sessionStorage.setItem('adminAuth', 'true');
    window.location.href = 'Panel/PanelAdmi.html';
  } else {
    showError(errorMsg, 'Usuario o contraseña incorrectos.');
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}