# SIG · Naturisa

Sistema Integrado de Gestión (Calidad, Ambiente y Laboratorios). DEMO / MVP.

## Ejecutar

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000/api/health

Requiere Node 24 o superior (usa el SQLite integrado en Node, `node:sqlite`).

## Estructura

```
sig-naturisa/
├── client/                     Frontend (React + Vite + TypeScript + Tailwind)
│   └── src/
│       ├── config/             app.ts (nombre, logo, usuario demo)
│       │                       modules.ts (registro de módulos → menú y rutas)
│       │                       developmentPlan.ts (fases del Dashboard)
│       ├── layout/             Header, Sidebar, AppLayout
│       ├── components/         Componentes reutilizables (Card, StatusBadge...)
│       │   └── charts/         Gráficos reutilizables (barras, columnas, medidor, tooltip)
│       ├── modules/            Un módulo por carpeta
│       │   ├── auditorias/     (subsecciones: certificacion-asc, certificacion-bap)
│       │   ├── laboratorios/
│       │   ├── inspecciones-sci/
│       │   ├── gestion-desechos/
│       │   └── presupuesto/
│       ├── features/           Funciones compartidas entre varios módulos
│       │   └── eventos/        Calendario de auditorías e inspecciones
│       ├── pages/              Dashboard y páginas generales
│       ├── services/api.ts     Cliente HTTP hacia el backend
│       ├── utils/excel.ts      Lector de Excel (.xlsx) en el navegador, sin librerías
│       └── context/            Tema claro/oscuro
└── server/                     Backend (Node + Express + TypeScript)
    ├── migrations/             Archivos .sql que se aplican en orden al iniciar
    └── src/
        ├── config/env.ts       Variables de entorno
        ├── db/database.ts      Conexión SQLite y ejecutor de migraciones
        ├── modules/            Rutas de la API, una carpeta por módulo
        └── shared/             Middlewares comunes
```

## Agregar o modificar un módulo

1. Crea la carpeta `client/src/modules/<modulo>/` con `meta.ts`, la página y `index.ts`
   (copia uno existente como plantilla).
2. Regístralo en `client/src/config/modules.ts`. El menú y la ruta se crean solos.
3. Si necesita datos: añade una migración `server/migrations/00X_<modulo>.sql`
   y sus rutas en `server/src/modules/<modulo>/`, registradas en `server/src/app.ts`.

Para mostrar un módulo en el menú como "PRÓXIMAMENTE", usa `status: 'proximamente'` en su `meta.ts`.

### Subsecciones (submenú)

Un módulo puede tener subsecciones (ver `modules/auditorias/`):

1. Decláralas en `children` dentro de su `meta.ts`. Así aparecen como submenú desplegable.
2. Crea la página de cada subsección en su propia carpeta y añade su ruta en la página
   principal del módulo (ej. `AuditoriasPage.tsx`).

## Personalizar

- **Logo:** coloca la imagen en `client/public/` y pon su ruta en `logoUrl` de `client/src/config/app.ts`.
- **Colores:** variables `--color-brand-*` en `client/src/index.css`.
- **Base de datos:** SQLite en `server/data/sig.db` (configurable con `DB_PATH` en `server/.env`).

## Módulo Presupuesto

Replica el dashboard `Dashboard_Presupuesto_SIG.html` dentro de la plataforma.

- **Origen de los datos:** Excel *Control de presupuesto SIG*, con las tablas `Consulta2` (gastos),
  `PresupuestoTipo` (presupuesto por área) y `PresuestoArea` (presupuesto por sub-área).
- **Actualizar:** en el Excel use *Datos ▸ Actualizar todo* y guarde. Luego, en la plataforma,
  pulse **Importar Excel** en el módulo Presupuesto. Cada importación reemplaza los datos anteriores.
- **Dónde se guarda:** tablas `presupuesto_*` de la base de datos (migración `002_presupuesto.sql`).
- **API:** `GET /api/presupuesto` (datos) y `POST /api/presupuesto/importar` (reemplazo).
- **Código:** `client/src/modules/presupuesto/`. Los cálculos están en `logica.ts`,
  el mapeo de columnas del Excel en `excel.ts` y la página en `PresupuestoPage.tsx`.

## Calendario de eventos (Auditorías ASC/BAP e Inspecciones SCI)

- **Dónde aparece:** en Certificación ASC, Certificación BAP e Inspecciones SCI (cada uno con su
  calendario), en Auditorías (calendario conjunto ASC + BAP) y en el Dashboard (tarjeta "Próximas fechas").
- **Datos de cada evento:** tipo, título, fecha de inicio/fin, sucursal, responsable, estado
  (programado, realizado, reprogramado, cancelado) y observaciones. Un evento programado cuya fecha
  ya pasó se muestra como **vencido**.
- **Código:** `client/src/features/eventos/`. Para usarlo en otro módulo:
  `<CalendarioEventos tipos={['mi-tipo']} />`, después de añadir el tipo en `config.ts` (cliente)
  y en `eventos.types.ts` (servidor).
- **API:** `GET /api/eventos?tipo=...`, `POST /api/eventos`, `PUT /api/eventos/:id`, `DELETE /api/eventos/:id`.
- **Base de datos:** tabla `evento` (migración `003_eventos.sql`).

## Check list de Buenas Prácticas (Inspecciones SCI)

SCI = Subsecretaría de Calidad e Inocuidad. Formulario de revisión de áreas previa a la inspección,
basado en *Check List-Buenas Prácticas-Ago01-2022.xlsx* (43 requisitos en 5 áreas, respuestas SI / NO / N/A).

- **Ruta:** Inspecciones SCI ▸ Check list Buenas Prácticas (`/inspecciones-sci/checklist`).
- **Cumplimiento:** igual que la hoja "Cumplimiento" del Excel: SI ÷ (SI + NO); los N/A no cuentan.
  Colores: ≥ 80 % alto, ≥ 50 % medio, < 50 % bajo (umbrales en `checklist/calculo.ts`).
- **Plantilla:** tabla `checklist_bp_item` (migración `004_checklist_bp.sql`). Cada respuesta guarda una
  copia del texto del requisito, así el historial no cambia si se modifica la plantilla.
- **API:** `GET /api/checklist-bp/plantilla` y CRUD en `/api/checklist-bp/revisiones`.
- **Código:** `client/src/modules/inspecciones-sci/checklist/`.

## Uso en móvil (iOS y Android)

La plataforma es una **PWA** (aplicación web instalable): el mismo código funciona en el PC y en el móvil.

1. Inicie la app en el PC (`npm run dev` o el acceso directo). La web escucha también en la red local.
2. En el PC pulse **Abrir en el móvil** (encabezado) y escanee el código QR con el teléfono.
   El teléfono debe estar en la **misma red Wi-Fi** que el PC.
3. Instálela en la pantalla de inicio:
   - **iPhone (Safari):** Compartir ▸ *Agregar a pantalla de inicio*.
   - **Android (Chrome):** ⋮ ▸ *Agregar a la pantalla principal*.

**Requisito de red:** el Firewall de Windows debe permitir conexiones entrantes al puerto 5173.
Requiere permisos de administrador; en un equipo corporativo, coordínelo con TI.

**Archivos PWA:** `client/public/manifest.webmanifest` e íconos en `client/public/icons/`.

**App nativa (tiendas):** el siguiente paso sería envolver este mismo código con Capacitor.
Android se puede compilar en Windows (Android Studio); iOS requiere un Mac con Xcode y una cuenta Apple Developer.

## Inicio de sesión

Todos los usuarios ingresan con sus **credenciales corporativas de Naturisa**, que se validan contra
el servicio de seguridad del portal (`AUTH_URL`). La plataforma no guarda contraseñas: las reenvía por
HTTPS y, si son correctas, crea una sesión propia (cookie firmada, válida 7 días).

- Usuario: solo minúsculas y números (se convierte automáticamente). Contraseña: de 6 a 128 caracteres.
- Cuentas con verificación en dos pasos o con cambio de contraseña pendiente reciben un aviso y no ingresan.
- Tras 10 intentos fallidos desde la misma IP, se bloquea el ingreso durante 15 minutos.
- Solo `/api/health` es público; el resto de la API exige sesión.
- **Desarrollo:** `AUTH_DISABLED=true` en `server/.env` desactiva el inicio de sesión.
- **Código:** `server/src/modules/auth/auth.ts`, `client/src/context/AuthContext.tsx` y `client/src/pages/LoginPage.tsx`.

## Publicación (Render)

En producción, un solo servicio entrega la web y la API: `npm run build` y luego `npm start`.
El archivo `render.yaml` define el despliegue y Render vuelve a publicar con cada push a `main`.

1. En [render.com](https://render.com) inicie sesión con su cuenta de GitHub.
2. Pulse **New ▸ Blueprint** y elija el repositorio `sig-naturisa`.
3. Pulse **Apply**. Render compila y publica la app en `https://sig-naturisa.onrender.com` (o similar).

**Datos:** con el plan gratuito, la base de datos se **borra en cada despliegue o reinicio**, y el
servicio se duerme tras unos minutos sin uso. Para conservar los datos, en `render.yaml` cambie
`plan: free` por `starter` y descomente `disk` y `DB_PATH`. Es de pago.
