# asistencia-app

Sistema de gestión de asistencia y permisos (salidas al baño) para instituciones
educativas. Monorepo con frontend React (PWA) y dos servicios backend independientes
sobre Node.js/Express y MongoDB.

## Arquitectura

```
asistencia-app/
├── frontend/            # React + Vite, PWA
├── service-attendance/  # Servicio A: gestión operativa (puerto 4001)
├── service-reports/     # Servicio B: reportes, estadísticas y permisos (puerto 4002)
├── docker-compose.yml   # MongoDB local para desarrollo
└── README.md
```

- **Servicio A (`service-attendance`)**: autenticación, usuarios, roles, grupos,
  asociación maestro/alumno, marcación de asistencia (carnet y biometría/simulación),
  consulta de asistencia.
- **Servicio B (`service-reports`)**: solicitud y gestión de permisos para ir al baño,
  reportes y estadísticas de asistencia y permisos. Consume datos de Servicio A vía HTTP
  y genera sus propios resultados (no reenvía solicitudes).
- Cada servicio tiene su propio proyecto Node.js, `package.json`, dependencias y base de
  datos MongoDB independiente (`asistencia_attendance` y `asistencia_reports`).

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

`JWT_SECRET` debe ser **el mismo valor** en `.env` de `service-attendance` y de
`service-reports`, ya que ambos verifican el mismo token sin llamarse entre sí para auth.

El carnet es **obligatorio** para alumnos (no aplica a maestro/coordinador): 7 dígitos,
los primeros 4 son el año de inscripción y los últimos 3 el identificador (ej. `2024047`).
La asistencia registra entrada y salida por separado (un máximo de una de cada por día
por alumno), cada una con fecha, hora, alumno, grupo y método (`carnet` o `biometric`).

Usuarios de prueba creados por el seed (contraseña `changeme123` para todos):

| Rol | Email |
| --- | --- |
| coordinador | coordinadora@example.com |
| maestro | maestro@example.com |
| alumno | alumno1@example.com / alumno2@example.com |

### 3. Servicio B — service-reports (puerto 4002)

```bash
cd service-reports
npm install
cp .env.example .env
npm run dev
```

### 4. Frontend (puerto 5173)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Flujo de ramas y sprints

El desarrollo se divide en 3 sprints, cada uno en su propia rama, integrado a `main`
mediante Pull Request al finalizar:

- `sprint-1`: base del monorepo, ambos servicios y frontend arrancando, primer endpoint
  de cada servicio, primera pantalla del frontend consumiendo la API.
- `sprint-2`: autenticación/autorización, gestión de usuarios/grupos, marcación de
  asistencia por carnet y flujo biométrico (o simulación), gestión inicial de permisos,
  comunicación entre servicios.
- `sprint-3`: reportes, estadísticas, historial, control completo de roles, mejoras
  visuales y PWA, README final.

## Biometría (WebAuthn)

La marcación biométrica usa WebAuthn real (`@simplewebauthn/server` y
`@simplewebauthn/browser`), no una simulación: el alumno enrola el autenticador de su
propio equipo (Windows Hello, huella, etc.) desde su panel ("Registrar biometría") y
luego puede marcar asistencia con él ("Marcar con biometría"). Solo se guarda el ID de
credencial y la llave pública en MongoDB — nunca datos biométricos crudos. Funciona en
`http://localhost` sin necesidad de HTTPS. El diálogo del autenticador es del sistema
operativo/navegador, así que ese paso debe probarse en un navegador real (Chrome/Edge)
con un lector de huellas o Windows Hello configurado.

## Estado actual

Sprint 2 en desarrollo.
