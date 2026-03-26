  document
        .getElementById("loginForm")
        .addEventListener("submit", function (e) {
          e.preventDefault();

          const user = document.getElementById("loginUser").value;
          const password = document.getElementById("loginPassword").value;

          if (user.length < 3) {
            window.location.href =
              "../error/error.html?msg=El usuario debe tener al menos 3 caracteres";
            return;
          }

          if (password.length < 6) {
            window.location.href =
              "../error/error.html?msg=La contraseña debe tener al menos 6 caracteres";
            return;
          }

          if (user === "admin" && password === "admin123") {
            alert("¡Bienvenido! Inicio de sesión exitoso");
          } else {
            window.location.href =
              "../error/error.html?msg=Usuario o contraseña incorrectos";
          }
        });