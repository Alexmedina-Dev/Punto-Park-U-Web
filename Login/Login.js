// ── Manejo del formulario de login ─────────────────────── // 

  function handleLogin(event) {
    event.preventDefault();

    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    // Reset error
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';

    if (user.length < 3) {
      showError('El usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (pass.length < 8) {
      showError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    // Usuarios hardcodeados (temporales, se reemplazarán con backend)
    const validUsers = {
      'admin': 'admin1234',
      'cliente': 'cliente1234',
      'juan': 'juan1234'
    };

    // Buscar también entre usuarios registrados vía formulario
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    const registeredMatch = registeredUsers.find(u => u.username === user && u.password === pass);

    if ((validUsers[user] && validUsers[user] === pass) || registeredMatch) {
      // Guardar sesión en localStorage
      const userData = {
        username: user,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('puntoParkUser', JSON.stringify(userData));
      
      // Redirigir a la pantalla de usuario
      window.location.href = '../Login/Pantalla%20Usuario/PantallaUsuario.html';
    } else {
      showError('Usuario o contraseña incorrectos.');
    }
  }

  function showError(msg) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }

  // ── Toggle visibilidad de contraseña ─────────────────────
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const icon = this.querySelector('.material-symbols-outlined');
      icon.textContent = isPassword ? 'visibility' : 'visibility_off';
      this.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });

  // ── Año automático en footer ──────────────────────────────
document.getElementById("footer-year").textContent = new Date().getFullYear();
