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

    if (pass.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Usuario de prueba hardcodeado (se reemplazará con backend)
    const validUsers = {
      'admin': 'admin123',
      'cliente': 'cliente123',
      'juan': 'juan123'
    };

    if (validUsers[user] && validUsers[user] === pass) {
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

  // ── Año automático en footer ──────────────────────────────
document.getElementById("footer-year").textContent = new Date().getFullYear();
