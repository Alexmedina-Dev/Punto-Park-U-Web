 // Menú hamburguesa
      const menuToggle = document.getElementById("menuToggle");
      const navContainer = document.getElementById("navContainer");

      menuToggle.addEventListener("click", function () {
        this.classList.toggle("active");
        navContainer.classList.toggle("active");
      });

      // Cerrar menú al hacer clic en un enlace
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", function () {
          menuToggle.classList.remove("active");
          navContainer.classList.remove("active");
        });
      });

      // Smooth scroll para enlaces internos (Corregido para Sticky Nav)
      document
        .querySelectorAll('.nav-container a[href^="#"]')
        .forEach((anchor) => {
          anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href");
            const targetElement = document.querySelector(targetId);
            const mainNav = document.querySelector(".main-nav");

            if (targetElement && mainNav) {
              const navHeight = mainNav.offsetHeight; // Altura del menú fijo
              const targetPosition =
                targetElement.getBoundingClientRect().top + window.pageYOffset;

              // Ajustar la posición para dejar visible el elemento con un pequeño margen
              const offsetPosition = targetPosition - navHeight - 15; // 15px de margen extra

              window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
              });

              // Cierra el menú en móvil si está activo
              if (window.innerWidth <= 768) {
                menuToggle.classList.remove("active");
                navContainer.classList.remove("active");
              }
            }
          });
        });

      // Botón "Volver Arriba"
      const scrollTop = document.getElementById("scrollTop");

      window.addEventListener("scroll", function () {
        if (window.pageYOffset > 300) {
          scrollTop.classList.add("show");
        } else {
          scrollTop.classList.remove("show");
        }
      });

      scrollTop.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });

      // Cargar precios desde localStorage
      window.onload = function () {
        try {
          const savedPrices = JSON.parse(localStorage.getItem("parkingPrices"));
          const savedSchedule = JSON.parse(
            localStorage.getItem("parkingSchedule"),
          );

          if (savedPrices) {
            const pricingCards = document.querySelectorAll(".pricing-card");

            // Precios Carros (índice 0)
            if (pricingCards.length > 0 && savedPrices.car) {
              const carPrices =
                pricingCards[0].querySelectorAll(".price-value");
              if (carPrices.length === 3) {
                carPrices[0].textContent =
                  "$" + parseInt(savedPrices.car.hour || 3000).toLocaleString();
                carPrices[1].textContent =
                  "$" + parseInt(savedPrices.car.day || 15000).toLocaleString();
                carPrices[2].textContent =
                  "$" +
                  parseInt(savedPrices.car.month || 250000).toLocaleString();
              }
            }

            // Precios Motos (índice 1)
            if (pricingCards.length > 1 && savedPrices.moto) {
              const motoPrices =
                pricingCards[1].querySelectorAll(".price-value");
              if (motoPrices.length === 3) {
                motoPrices[0].textContent =
                  "$" +
                  parseInt(savedPrices.moto.hour || 1500).toLocaleString();
                motoPrices[1].textContent =
                  "$" + parseInt(savedPrices.moto.day || 8000).toLocaleString();
                motoPrices[2].textContent =
                  "$" +
                  parseInt(savedPrices.moto.month || 120000).toLocaleString();
              }
            }
          }

          if (savedSchedule) {
            const scheduleText = document.querySelector(
              ".info-box:nth-child(2) p",
            );
            if (scheduleText && savedSchedule.weekday && savedSchedule.sunday) {
              scheduleText.innerHTML = `Lunes a Sábado<br>${formatTime(
                savedSchedule.weekday.open || "07:00",
              )} - ${formatTime(
                savedSchedule.weekday.close || "19:00",
              )}<br><br>Domingo<br>${formatTime(
                savedSchedule.sunday.open || "09:00",
              )} - ${formatTime(savedSchedule.sunday.close || "17:00")}`;
            }
          }
        } catch (error) {
          console.error("Error al cargar datos desde localStorage:", error);
        }
      };

      function formatTime(time) {
        if (!time || !time.includes(":")) {
          return "N/A";
        }
        const [hour, minute] = time.split(":");
        const h = parseInt(hour);
        const ampm = h >= 12 ? "p.m." : "a.m.";
        let displayHour = h % 12;
        if (displayHour === 0) displayHour = 12;

        return `${displayHour}:${minute} ${ampm}`;
      }