# 🅿️ "Punto Park U"

**Estacionamiento fácil y sencillo para tu tranquilidad.**

Aplicación web para la gestión inteligente de un parqueadero en Bogotá, Colombia. Permite a los usuarios registrarse, reservar espacios en tiempo real, y a los administradores monitorear y gestionar todo el sistema desde un panel central.

---

## ✨ Funcionalidades actuales

- **Landing page** con información del servicio, tarifas, disponibilidad en vivo y ubicación
- **Registro de usuarios** con nombre, cédula y credenciales de acceso
- **Inicio de sesión** con validación de usuarios registrados y hardcodeados
- **Panel de usuario** con vista de inicio, vehículos, reservas y ubicación
- **Panel de administrador** con dashboard, reportes, exportación a PDF/Excel y gestión de tarifas
- **Diseño responsive** con modo oscuro

---

## 🛠️ Stack tecnológico actual

| Capa | Tecnología |
|------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript vanilla |
| **Estilos** | Variables CSS, flexbox, grid, glassmorphism |
| **Fuentes** | Manrope, Space Grotesk, Material Symbols |
| **Almacenamiento** | localStorage (temporal, sin backend) |
| **Deployment** | Vercel (planeado) |

---

## 🚀 Próximos pasos

Migración completa a **React + Next.js** con backend en **Node.js**, base de datos **PostgreSQL** e implementación del sistema de IA propietario **Flux AI** (visión computacional, asignación inteligente y analítica predictiva).

> Ver [`plan-flux-ai.txt`](./plan-flux-ai.txt) para el plan detallado de implementación de IA.

---

## 📁 Estructura del proyecto

```
Punto-Park-U-Web/
├── index.html                 # Landing page principal
├── Styles.css                 # Estilos globales
├── Login/                     # Módulo de autenticación
│   ├── Login.html / .js / .css
│   └── Pantalla Usuario/      # Panel del usuario
├── Registro/                  # Registro de usuarios
│   ├── Registro.html / .js / .css
│   ├── Registro-exitoso/
│   └── Pantalla-error/
├── Administrador/             # Panel de administración
│   ├── Admi.html
│   └── Panel/
│       ├── PanelAdmi.html
│       ├── panel.css / panel.js / modules.js
│       └── ...
├── Images/                    # Recursos gráficos
├── plan-flux-ai.txt           # Plan de IA propietaria
└── README.md
```

---

## 👥 Autores

- **Alexander Medina** — Desarrollo fullstack
- **Miguel Palacio** — Desarrollo fullstack

---

## 📄 Licencia

Todos los derechos reservados © "Punto Park U"
