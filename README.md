# Budaner Automotores

Web de la concesionaria (catálogo digital) con **panel de administración**, armada con la misma
estructura y tecnologías que **TopLevel**: Node + Express 5 + EJS + MySQL (Sequelize), sesiones con
express-session + bcrypt, subida de fotos con multer, CSS y JS separados por página.

## Cómo arrancarla

```bash
npm install          # solo la primera vez
npm run db:instalar  # crea la base, el stock inicial y el administrador (BORRA lo que haya)
npm run dev          # con nodemon (se reinicia al guardar)
npm start            # producción
npm run celular      # muestra la dirección para abrirla desde el celular (mismo Wi-Fi)
```

- Web: `http://localhost:3000`
- Panel: `http://localhost:3000/admin` → se entra con `ADMIN_USUARIO` y `ADMIN_PASSWORD` del `.env` (usuario y contraseña, no email).
  La contraseña después se cambia desde el panel (Ajustes) y deja de depender del `.env`.

Antes de instalar en otro lado: copiá `.env.example` como `.env` y completá `SESSION_SECRET`,
los datos de MySQL (`DB_*`) y el primer administrador (`ADMIN_*`).

## Qué se maneja desde el panel

| Sección | Qué hace |
|---|---|
| **Resumen** | Cuántos autos hay en la web, destacados, ocultos y consultas nuevas. |
| **Vehículos** | Alta, edición y baja. Hasta 10 fotos por unidad (se elige la principal). Interruptores para **mostrar/ocultar** en la web (reservado, vendido) y para **destacar** en el carrusel. |
| **Consultas** | Lo que la gente manda con "Consultar con asesor". Estado nueva / contactada / cerrada, botón de WhatsApp y llamada. |
| **Clientes** | Fotos de las entregas con nombre y vehículo. Salen al final del inicio en "Nuestros clientes" (si no hay ninguna, la sección no aparece). |
| **Ajustes** | WhatsApp de los asesores, horarios, ciudad, Instagram, **video de fondo** y foto de la portada, y cambio de contraseña. |

## Estructura

```
database/
  schema.sql              tablas (usuarios, vehiculos, vehiculo_imagenes, consultas, clientes, ajustes)
  instalar.js             npm run db:instalar
  semilla-vehiculos.js    stock inicial (los 8 autos de la página original)
src/
  app.js                  servidor Express (sesión, base de datos, rutas)
  routes/                 index.Routes.js (web) · admin.Routes.js (panel)
  controllers/            web, acceso al panel y una por sección del panel
  services/               vehículos, consultas, clientes, ajustes, usuarios
  model/database/         config + modelos Sequelize + actualizar.js (crea tablas nuevas al arrancar)
  middlewares/            soloAdmin, soloInvitados, subirImagenes (multer)
  validations/            express-validator de cada formulario
  helpers/                datos de la concesionaria, formatos, íconos SVG, red local
  views/                  inicio, error, admin/* y partials/*
public/
  css/                    base, inicio, error, admin, admin-*
  js/                     base, inicio, admin, admin-*
  img/vehiculos/          fotos del stock inicial
  img/subidas/            fotos y videos subidos desde el panel (no van al repositorio)
  video/portada.mp4       video de fondo de la portada
```

## Adaptación a pantallas

Mobile first, sin scroll horizontal, en la web y en el panel:
- **Celular**: menú lateral, 1 vehículo por fila, carruseles con el dedo, campos de 16px (sin zoom en
  iPhone). En el panel el menú se desliza y el botón "Guardar" queda fijo abajo.
- **Tablet (≥ 768px)**: 2 por fila, filtros en una fila.
- **PC (≥ 1024px)**: menú completo arriba, 3 por fila.

## Seguridad

- Contraseñas guardadas con bcrypt; sesión nueva al entrar; cookie `httpOnly` + `sameSite=lax`.
- Máximo 5 intentos fallidos de login por IP cada 15 minutos.
- Solo se aceptan fotos JPG/PNG/WEBP (5 MB) y videos MP4/WEBM (40 MB); al borrar o reemplazar se
  eliminan los archivos del disco.
