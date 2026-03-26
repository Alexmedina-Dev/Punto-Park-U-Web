 document
        .getElementById("idNumber")
        .addEventListener("input", function (e) {
          this.value = this.value.replace(/[^0-9]/g, "");
        });

      document
        .getElementById("registerForm")
        .addEventListener("submit", function (e) {
          e.preventDefault();

          const firstName = document.getElementById("firstName").value.trim();
          const lastName = document.getElementById("lastName").value.trim();
          const idNumber = document.getElementById("idNumber").value.trim();
          const birthDate = document.getElementById("birthDate").value;

          if (firstName.length < 2) {
            window.location.href =
              "error.html?msg=El nombre debe tener al menos 2 caracteres";
            return;
          }

          if (lastName.length < 2) {
            window.location.href =
              "error.html?msg=El apellido debe tener al menos 2 caracteres";
            return;
          }

          if (!/^\d+$/.test(idNumber)) {
            window.location.href =
              "error.html?msg=La cédula debe contener solo números";
            return;
          }

          if (idNumber.length < 6 || idNumber.length > 12) {
            window.location.href =
              "error.html?msg=La cédula debe tener entre 6 y 12 dígitos";
            return;
          }

          if (!birthDate) {
            window.location.href =
              "error.html?msg=Debe ingresar su fecha de nacimiento";
            return;
          }

          const birth = new Date(birthDate);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birth.getDate())
          ) {
            age--;
          }

          if (age < 18) {
            window.location.href =
              "error.html?msg=Debes ser mayor de 18 años para registrarte";
            return;
          }

          if (birth > today) {
            window.location.href =
              "error.html?msg=La fecha de nacimiento no puede ser en el futuro";
            return;
          }

          // Redirigir a la página de registro exitoso con los datos
          window.location.href = `registro-exitoso.html?nombre=${encodeURIComponent(firstName + " " + lastName)}&cedula=${encodeURIComponent(idNumber)}`;
        });