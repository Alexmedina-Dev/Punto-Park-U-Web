// Validación del formulario
document.getElementById('registrationForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const nombres = document.getElementById('nombres').value.trim();
  const apellidos = document.getElementById('apellidos').value.trim();
  const cedula = document.getElementById('cedula').value.trim();
  const fecha = document.getElementById('fecha_nacimiento').value;

  // Validar nombres y apellidos
  if (nombres.length < 2 || apellidos.length < 2) {
    window.location.href = 'error.html?msg=' + encodeURIComponent('Nombres y apellidos deben tener al menos 2 caracteres.');
    return;
  }

  // Validar cédula
  if (!/^\d{6,12}$/.test(cedula)) {
    window.location.href = 'error.html?msg=' + encodeURIComponent('La cédula debe contener entre 6 y 12 números.');
    return;
  }

  // Validar fecha
  if (!fecha) {
    window.location.href = 'error.html?msg=' + encodeURIComponent('Debe ingresar una fecha de nacimiento.');
    return;
  }

  const birthDate = new Date(fecha);
  const today = new Date();

  // Validar que la fecha no sea futura
  if (birthDate > today) {
    window.location.href = 'error.html?msg=' + encodeURIComponent('La fecha de nacimiento no puede ser en el futuro.');
    return;
  }

  // Calcular edad
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Validar edad mínima
  if (age < 18) {
    window.location.href = 'error.html?msg=' + encodeURIComponent('Debe ser mayor de 18 años para registrarse.');
    return;
  }

  // Si todo es válido, redirigir a página de éxito
  const nombreCompleto = nombres + ' ' + apellidos;
  window.location.href = 'Registro-exitoso/registro-exitoso.html?nombre=' + encodeURIComponent(nombreCompleto) + '&cedula=' + encodeURIComponent(cedula);
});

// Login con Google
function loginWithGoogle() {
  // Aquí debes integrar el SDK de Google Sign-In
  // Ejemplo de URL de autenticación (debes configurar tu Client ID)
  const clientId = 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  const redirectUri = encodeURIComponent(window.location.origin + '/auth/google/callback');
  const scope = encodeURIComponent('profile email');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

  // Para desarrollo/pruebas
  alert('Login con Google. En producción, configure el Client ID de Google OAuth.');
  // window.location.href = authUrl;
}

// Login con Microsoft
function loginWithMicrosoft() {
  // Aquí debes integrar el SDK de Microsoft Identity Platform
  const clientId = 'TU_MICROSOFT_CLIENT_ID';
  const redirectUri = encodeURIComponent(window.location.origin + '/auth/microsoft/callback');
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid%20profile%20email`;

  // Para desarrollo/pruebas
  alert('Login con Microsoft. En producción, configure el Client ID de Microsoft.');
  // window.location.href = authUrl;
}

// Login con Apple
function loginWithApple() {
  // Aquí debes integrar el SDK de Sign in with Apple
  const clientId = 'TU_APPLE_CLIENT_ID';
  const redirectUri = encodeURIComponent(window.location.origin + '/auth/apple/callback');
  const authUrl = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=name%20email&response_mode=form_post`;

  // Para desarrollo/pruebas
  alert('Login con Apple. En producción, configure el Service ID de Apple.');
  // window.location.href = authUrl;
}