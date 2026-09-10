# asistencia-app

Sistema de gestión de asistencia y permisos (salidas al baño) para instituciones
educativas. Monorepo con frontend React (PWA) y dos servicios backend independientes
sobre Node.js/Express y MongoDB, con autenticación JWT y control de acceso por rol
(coordinador, maestro, alumno).

## Arquitectura

```
asistencia-app/
├── frontend/            # React + Vite, PWA
├── service-attendance/  # Servicio A: gestión operativa (puerto 4001)
├── service-reports/     # Servicio B: reportes, estadísticas y permisos (puerto 4002)
├── docker-compose.yml   # MongoDB local para desarrollo
└── README.md
```

- **Servicio A (`service-attendance`)**: autenticación (JWT), usuarios, roles, grupos,
  asociación maestro/alumno, marcación de asistencia (carnet y biometría real vía
  WebAuthn), consulta de asistencia por rol.
- **Servicio B (`service-reports`)**: solicitud y gestión de permisos para ir al baño,
  reportes y estadísticas de asistencia y permisos. Consume datos de Servicio A vía HTTP
  (nunca accede a su base de datos directamente) y **procesa esa información para generar
  resultados propios** — puntualidad, ausencias, duración/frecuencia de permisos — en vez
  de solo reenviar lo que recibe.
- Cada servicio es un proyecto Node.js independiente: su propio `package.json`,
  dependencias, puerto y base de datos MongoDB (`asistencia_attendance` y
  `asistencia_reports`).

### Stack

React 19, Vite, React Router, Zustand, Axios, `vite-plugin-pwa` · Node.js, Express 5,
Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `zod`, `@simplewebauthn/server` ·
`@simplewebauthn/browser` · MongoDB · Docker Compose · Git/GitHub.

## Requisitos

- Node.js 18+
- MongoDB (local o vía `docker-compose up -d`)

## Cómo levantar el proyecto

### 1. MongoDB

```bash
docker-compose up -d
```

o usar una instancia local/Atlas y ajustar `MONGO_URI` en cada `.env`.

### 2. Servicio A — service-attendance (puerto 4001)

```bash
cd service-attendance
npm install
cp .env.example .env
npm run seed   # crea datos de ejemplo (coordinador, maestro, grupo, alumnos)
npm run dev
```

### 3. Servicio B — service-reports (puerto 4002)

```bash
cd service-reports
npm install
cp .env.example .env
npm run dev
```

`JWT_SECRET` debe ser **el mismo valor** en el `.env` de ambos servicios: cada uno
verifica el token de forma independiente, sin llamarse entre sí para autenticar.

### 4. Frontend (puerto 5173)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abre `http://localhost:5173`. El navegador debe ofrecer instalar la app como PWA (ícono
de instalación en la barra de direcciones, o "Agregar a pantalla de inicio" en móvil).

### Variables de entorno relevantes

| Variable | Servicio | Descripción |
| --- | --- | --- |
| `JWT_SECRET` | ambos | Debe ser idéntico en los dos `.env` |
| `ATTENDANCE_SERVICE_URL` | reports | URL de Servicio A para las llamadas HTTP internas |
| `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGIN` | attendance | Dominio/origen esperado por WebAuthn (`localhost` en desarrollo) |
| `ATTENDANCE_ENTRY_TIME` / `ATTENDANCE_GRACE_MINUTES` | reports | Hora de entrada y margen de tolerancia para el reporte de puntualidad (por defecto `07:00` + `15` min) |

## Usuarios y reglas de negocio

El carnet es **obligatorio** para alumnos (no aplica a maestro/coordinador): 7 dígitos,
los primeros 4 son el año de inscripción y los últimos 3 el identificador (ej.
`2024047`). Un alumno solo puede pertenecer a **un grupo a la vez** (invariante
estructural: `User.groupId`, no un arreglo que se pueda desincronizar).

Los formularios de alta piden nombre y apellido por separado, y son distintos por rol:
el de alumno pide carnet y **no** pide email (se autogenera: primera letra del nombre +
apellido + `-` + carnet, ej. `Juan Pérez` con carnet `2024048` →
`jperez-2024048@example.com`); maestro y coordinador ingresan su email manualmente.

Usuarios de prueba creados por el seed (contraseña `changeme123` para todos):

| Rol | Email |
| --- | --- |
| coordinador | coordinadora@example.com |
| maestro | maestro@example.com |
| alumno | calumno-2024001@example.com / malumna-2024002@example.com |

### Roles y permisos

| Acción | Coordinador | Maestro | Alumno |
| --- | --- | --- | --- |
| Gestionar usuarios (alta/baja) | ✅ | ❌ | ❌ |
| Gestionar grupos y asignar alumnos | ✅ | ❌ | ❌ |
| Consultar todos los grupos/asistencia | ✅ | Solo los suyos | Solo el propio |
| Marcar asistencia (carnet/biometría) | — | — | ✅ (solo la propia) |
| Solicitar permiso | ❌ | ❌ | ✅ |
| Autorizar/rechazar permiso | ✅ | Solo de sus grupos | ❌ |
| Iniciar/finalizar su propio permiso | ❌ | ❌ | ✅ |
| Reportes y estadísticas | ✅ | Solo de sus grupos | ❌ |

## Referencia de API

**service-attendance** (`:4001`) — `POST /auth/login` · `GET/POST /users`,
`PUT /users/:id` · `GET/POST /groups`, `PUT /groups/:id`, `GET /groups/:id` ·
`POST /attendance/card`, `POST /attendance/biometric`,
`POST /attendance/biometric/simulate`, `GET /attendance`,
`GET /attendance/student/:id`, `GET /attendance/group/:id` ·
`POST /webauthn/register/options`, `POST /webauthn/register/verify`,
`POST /webauthn/attendance/options`.

**service-reports** (`:4002`) — `GET/POST /permissions`,
`PATCH /permissions/:id/{authorize,reject,start,finish}` ·
`GET /reports/attendance`, `GET /reports/attendance/student/:id`,
`GET /reports/attendance/group/:id`, `GET /reports/permissions` ·
`GET /statistics/summary`, `GET /statistics/punctuality`, `GET /statistics/absences`.

Todos los endpoints (salvo `/health` y `/auth/login`) requieren
`Authorization: Bearer <token>`.

## Biometría (WebAuthn real + simulación)

La marcación biométrica usa WebAuthn real (`@simplewebauthn/server` y
`@simplewebauthn/browser`): el alumno enrola el autenticador de su propio equipo
(Windows Hello, Touch ID en Mac, huella en Android — es un estándar multiplataforma, no
exclusivo de Windows) desde su panel ("Registrar biometría") y luego marca asistencia
con él ("Marcar con biometría"). Solo se guarda el ID de credencial y la llave pública en
MongoDB — **nunca** datos biométricos crudos. Funciona en `http://localhost` sin HTTPS;
para probarlo desde otro dispositivo en red (no `localhost`) hace falta HTTPS y ajustar
`WEBAUTHN_RP_ID`/`WEBAUTHN_ORIGIN`, ya que WebAuthn exige un origen seguro.

Como alternativa para equipos sin autenticador de plataforma disponible, cada alumno
tiene un botón "Simular entrada/salida" que registra la asistencia con método
`biometric` sin verificar una aserción criptográfica real — técnicamente justificado
para poder demostrar el flujo completo en cualquier entorno.

## Flujo de ramas y sprints

Monorepo con un PR por sprint hacia `main`, revisado e integrado al finalizar cada uno:

- **`sprint-1`**: base del monorepo, ambos servicios y frontend arrancando, primer
  endpoint de cada servicio, primera pantalla del frontend consumiendo la API.
- **`sprint-2`**: autenticación JWT y roles, gestión de usuarios/grupos, marcación de
  asistencia por carnet y biometría real, ciclo completo de permisos, comunicación HTTP
  real entre servicios.
- **`sprint-3`**: reportes y estadísticas (puntualidad, ausencias, permisos), repaso de
  control de roles y manejo de errores, rediseño visual, íconos PWA, README final.

## Estado actual

Proyecto completo — los 3 sprints están integrados en `main` y la aplicación es
funcional de punta a punta: autenticación por rol, asistencia por carnet/biometría,
permisos, reportes/estadísticas y PWA instalable.
