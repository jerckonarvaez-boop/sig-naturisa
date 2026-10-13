# SIG · Naturisa

Sistema Integrado de Gestión (Calidad, Ambiente y Laboratorios). DEMO / MVP.

## Ejecutar

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000/api/health

Requiere Node 24 o superior. Base de datos: libSQL (compatible con SQLite) mediante `@libsql/client`.

## Arquitectura

Monorepo con dos aplicaciones (npm workspaces). Cada módulo funcional tiene su carpeta tanto
en el frontend como en el backend, y dentro de ella separa interfaz, datos y lógica.

```
sig-naturisa/
├── client/src/                     FRONTEND (React + Vite + TypeScript + Tailwind)
│   ├── main.tsx · App.tsx          Arranque y composición: tema → sesión → control de acceso → rutas
│   ├── routes/                     AppRoutes (rutas generadas del registro) · NotFoundPage
│   ├── config/                     app.ts (nombre, logo) · modules.ts (REGISTRO de módulos → menú y rutas)
│   │                               developmentPlan.ts (fases del Dashboard)
│   ├── constants/                  Valores fijos compartidos (meses, días)
│   ├── context/                    AuthContext (estado de sesión) · ThemeContext (claro/oscuro)
│   ├── services/                   ÚNICO lugar que habla con el exterior
│   │   ├── api/                    client.ts (fetch, cookie, sesión vencida) · health.ts
│   │   ├── auth/                   auth.service.ts (estado, login, logout)
│   │   └── storage/                preferencias.ts (localStorage) · imagenes.ts (reducir fotos)
│   ├── hooks/                      Hooks genéricos (useElementWidth)
│   ├── components/                 Componentes visuales reutilizables, sin lógica de negocio
│   │   ├── layout/                 AppLayout, Header, Sidebar, Logo, AbrirEnMovil
│   │   ├── ui/                     Card, PageHeader, Modal, StatusBadge, ModulePlaceholder, botones
│   │   ├── forms/                  Campo + estilo de controles
│   │   ├── tables/                 Tabla + estilo de encabezado
│   │   └── charts/                 BarList, BudgetBars, ColumnChart, Gauge, Tooltip
│   ├── modules/                    Un módulo funcional por carpeta
│   │   ├── auth/                   LoginPage · ControlAcceso (quién puede ver la app)
│   │   ├── dashboard/
│   │   ├── eventos/                Calendario compartido (Auditorías, SCI y Dashboard)
│   │   ├── auditorias/             asc y bap
│   │   ├── laboratorios/
│   │   ├── inspecciones-sci/       calendario + checklist/
│   │   ├── gestion-desechos/
│   │   └── presupuesto/
│   ├── utils/                      Funciones puras: fechas, numeros, texto, csv, excel
│   └── styles/index.css            Tailwind, colores corporativos y de gráficos
└── server/                         BACKEND (Node + Express + TypeScript + SQLite)
    ├── migrations/                 Archivos .sql que se aplican en orden al iniciar
    └── src/
        ├── index.ts · app.ts       Arranque y montaje de Express
        ├── config/env.ts           Variables de entorno
        ├── db/database.ts          Conexión SQLite, migraciones y transacciones
        ├── middleware/             requiereSesion (único control de acceso) · errores
        ├── storage/evidencias.ts   Reglas de archivos/fotos (formato, tamaño)
        ├── utils/validacion.ts     texto(), esFecha(), esUnoDe()
        └── modules/
            ├── index.ts            REGISTRO de módulos de la API (/api/<ruta>)
            └── <modulo>/           routes → controller → validator + service → types
```

### Estructura de un módulo

| Frontend `client/src/modules/<modulo>/` | Para qué |
|---|---|
| `meta.ts` · `index.ts` | Nombre, ruta, ícono, submenús · registro (meta + página) |
| `<Modulo>Routes.tsx` | Rutas internas (solo si tiene subpáginas) |
| `pages/` | Páginas: solo componen hooks y componentes |
| `components/` | Piezas visuales propias del módulo |
| `hooks/` | Estado y carga/guardado de datos |
| `services/` | Llamadas a la API del módulo |
| `logic/` | Cálculos y reglas de negocio (funciones puras, sin JSX) |
| `types.ts` | Tipos de datos |

| Backend `server/src/modules/<modulo>/` | Para qué |
|---|---|
| `<modulo>.routes.ts` | Tabla de rutas (método + URL → controlador) |
| `<modulo>.controller.ts` | Recibe la petición y responde (códigos HTTP) |
| `<modulo>.validator.ts` | Valida y limpia los datos de entrada |
| `<modulo>.service.ts` | Lógica y consultas SQL |
| `<modulo>.types.ts` | Tipos (deben coincidir con los del frontend) |

Reglas: los componentes no llaman a la API (usan hooks → services); la lógica de negocio va en
`logic/`; los estilos repetidos se toman de `components/` (botones, campos, tablas); las constantes
se definen una sola vez en `constants/` o `config/`.

## Agregar o modificar un módulo

1. Frontend: crea `client/src/modules/<modulo>/` con `meta.ts`, `pages/` e `index.ts`
   (copia `laboratorios/` como plantilla) y regístralo en `client/src/config/modules.ts`.
   El menú y la ruta se crean solos.
2. Backend (si necesita datos): añade la migración `server/migrations/00X_<modulo>.sql`, crea
   `server/src/modules/<modulo>/` con routes, controller, validator, service y types, y regístralo
   en `server/src/modules/index.ts`. Queda protegido con sesión automáticamente.
3. Frontend: las llamadas en `services/<modulo>.api.ts` y la carga de datos en `hooks/`.

Para mostrar un módulo en el menú como "PRÓXIMAMENTE", usa `status: 'proximamente'` en su `meta.ts`.

### Subsecciones (submenú)

Un módulo puede tener subsecciones (ver `modules/auditorias/`):

1. Decláralas en `children` dentro de su `meta.ts`. Así aparecen como submenú desplegable.
2. Crea la página de cada subsección en `pages/` y añade su ruta en `<Modulo>Routes.tsx`
   (ej. `AuditoriasRoutes.tsx`).

### Permisos y roles

Hoy cualquier usuario corporativo válido tiene acceso completo. El control está centralizado en dos
puntos, que es donde se agregarán los roles cuando se definan: `client/src/modules/auth/ControlAcceso.tsx`
(interfaz) y `server/src/middleware/requiereSesion.ts` (API; deja el usuario en `res.locals.usuario`).

## Personalizar

- **Logo:** coloca la imagen en `client/public/` y pon su ruta en `logoUrl` de `client/src/config/app.ts`.
- **Colores:** variables `--color-brand-*` en `client/src/styles/index.css`.
- **Base de datos:** en el PC, archivo SQLite `server/data/sig.db` (configurable con `DB_PATH`); en la web
  publicada, Turso (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`). Ver *Publicación*.

## Módulo Presupuesto

Replica el dashboard `Dashboard_Presupuesto_SIG.html` dentro de la plataforma.

- **Origen de los datos:** Excel *Control de presupuesto SIG*, con las tablas `Consulta2` (gastos),
  `PresupuestoTipo` (presupuesto por área) y `PresuestoArea` (presupuesto por sub-área).
- **Actualizar:** en el Excel use *Datos ▸ Actualizar todo* y guarde. Luego, en la plataforma,
  pulse **Importar Excel** en el módulo Presupuesto. Cada importación reemplaza los datos anteriores.
- **Dónde se guarda:** tablas `presupuesto_*` de la base de datos (migración `002_presupuesto.sql`).
- **API:** `GET /api/presupuesto` (datos) y `POST /api/presupuesto/importar` (reemplazo).
- **Datos iniciales:** si el servidor arranca con el presupuesto vacío (base nueva), carga el último
  Excel importado en el PC desde `server/semillas/presupuesto.sig` (cifrado con AES-256, porque el
  repositorio es público; clave `SEMILLA_CLAVE`, igual en `server/.env` y en Render). Nunca reemplaza
  datos existentes. Para regenerarlo: importe el Excel en la versión local y ejecute `npm run semilla -w server`.
  En la web, lo normal es importar el Excel nuevo directamente con el botón **Importar Excel**.
- **Código:** `client/src/modules/presupuesto/`. Cálculos en `logic/logica.ts` y `logic/agregaciones.ts`
  (datos de cada gráfico), mapeo de columnas del Excel en `logic/leerExcel.ts`, estado de los filtros
  en `hooks/useTablero.ts` y la página en `pages/PresupuestoPage.tsx`.

## Informes de laboratorio (Agua, Suelo, Patologías en fresco)

Registro de los informes de ensayo con el mismo formato del Excel: parámetros en filas y una columna por
muestra (piscina, precría…).

| Sección | Código | Tipos de informe |
|---|---|---|
| Análisis de Agua (`/laboratorios/agua`) | AA-AAAA-NNN | Tablas combinables (una, dos o las tres): Fitoplancton · Químico · Bacteriológico |
| Análisis de Suelo (`/laboratorios/suelo`) | AS-AAAA-NNN | Materia orgánica (humedad, pH seco, % MO) |
| Patologías en fresco (`/laboratorios/patologias`) | AF-AAAA-NNN | Combinables: Patología en fresco · Bacteriología (formato de una o varias muestras según cuántas se agreguen) |

- **Definición única:** parámetros, unidades, grupos, tipos y referencias están en
  `server/src/modules/laboratorio/laboratorio.secciones.ts`; la interfaz la pide a `GET /api/laboratorio/secciones`
  y dibuja el formulario. Para agregar un parámetro o una sección basta con editar ese archivo.
- **Agua, tablas combinables** (`combinable: true`): el tipo se guarda como la combinación marcada, ej.
  `fitoplancton+quimico`; cada parámetro aparece si su `soloTipos` coincide con alguna de las tablas. Sin la tabla
  química, salinidad/pH/alcalinidad salen en la tabla de fitoplancton (formato del informe básico). Las tablas
  impresas se numeran según las que lleve el informe (migración `009_laboratorio_agua_combinable.sql` convirtió
  los tipos anteriores). Patologías funciona igual (`fresco+bacteriologia`, migración `010`).
- **Ayudas:** valores de agua fuera de referencia (pH 7–8, alcalinidad 100–140, amonio 0,1–1,0, fosfato 0,6–1,5,
  Vibrios máx. 1000; Ca, Mg y K frente a factor × salinidad de la muestra) se marcan ▲ alto / ▼ bajo; en patología
  cada grado muestra su nivel (ausencia, bajo, medio, alto, muy alto); el total de fitoplancton se calcula solo.
- **Indicador en el informe impreso** (y en el PDF del correo): la misma regla (`estadoReferencia` en
  `analisis/logic/laboratorio.ts`, con los `min`/`max`/`factorSalinidad` de la definición) pinta la celda en rojo ▲
  si supera la referencia o en azul ▼ si no llega, con leyenda junto a los valores referenciales.
- **Identificación de la muestra:** lista validada de centros de costo del presupuesto + clientes del laboratorio
  (`CLIENTES_LABORATORIO`, hoy Kamaclusa y Pesjoya).
- **Código:** se sugiere el siguiente número del año (también entiende rangos como "AF-2026-128 al 133").
- **Imprimir:** sale el informe con el diseño oficial de cada formato (igual al Excel: encabezado, tablas, leyendas,
  valores referenciales, firma y pie), en `analisis/components/reporte/`. Patología con más de 6 muestras sale en
  horizontal para que quepa en una hoja.
- **Enviar por correo:** genera el PDF del informe (la misma vista de impresión, con `html-to-image` + `jspdf`) y
  descarga un `.eml` con el PDF adjunto y `X-Unsent: 1`; al abrirlo, Outlook (escritorio) lo muestra como borrador
  listo para enviar. El texto predeterminado (asunto y mensaje, con `{codigo}`, `{identificacion}`, `{seccion}`,
  `{fecha}`) se edita desde la misma ventana y se guarda en la tabla `configuracion`; los destinatarios se recuerdan
  por centro de costo en `lab_destinatario` (migración `008_laboratorio_correo.sql`). Funciones genéricas en
  `client/src/services/documentos/` (`pdf.ts`, `correo.ts`).
- **API:** `GET/POST /api/laboratorio/informes` (`?seccion=agua|suelo|patologia`), `GET/PUT/DELETE
  /api/laboratorio/informes/:id`. **Base de datos:** `lab_informe` y `lab_muestra` (valores en JSON),
  migración `007_laboratorio.sql`. **Código:** `client/src/modules/laboratorios/analisis/`.

## Oxigenómetros (Laboratorios de análisis)

Registro de las partes de oxigenómetros que repara el propio personal (sin costo) en lugar de comprarlas nuevas.

- **Ruta:** Laboratorios de análisis ▸ Oxigenómetros (`/laboratorios/oxigenometros`).
- **Ahorro** de cada reparación = precio de la parte nueva × cantidad. Solo cuenta si el estado es *Reparado*.
- **Partes:** lista validada fija (`PARTES` en `oxigenometros/config.ts`; para agregar una, se añade ahí).
  El precio de la parte nueva se escribe a mano.
- **Tablero:** partes reparadas, ahorro total, ahorro promedio por parte, ahorro por mes y por tipo de parte,
  filtrable por año.
- **API:** CRUD en `/api/oxigenometros/reparaciones`. **Base de datos:** tabla `oxigenometro_reparacion`
  (migración `006_oxigenometros.sql`). **Código:** `client/src/modules/laboratorios/oxigenometros/` y
  `server/src/modules/oxigenometros/`.

## Centros de costo (lista validada)

`GET /api/presupuesto/catalogo` devuelve las sucursales / centros de costo del presupuesto. En la interfaz:
`hooks/useCatalogo.ts` y `components/forms/SelectCentroCosto.tsx` (sobre `SelectLista.tsx`, lista validada
genérica), que se usa en el calendario de eventos, el
check list SCI y Oxigenómetros. Si un registro antiguo tiene un centro que ya no está en el presupuesto, se
conserva y se marca. Sin presupuesto importado, el campo permite escribir para no bloquear el formulario.

## Calendario de eventos (Auditorías ASC/BAP e Inspecciones SCI)

- **Dónde aparece:** en Certificación ASC, Certificación BAP e Inspecciones SCI (cada uno con su
  calendario), en Auditorías (calendario conjunto ASC + BAP) y en el Dashboard (tarjeta "Próximas fechas").
- **Datos de cada evento:** tipo, título, fecha de inicio/fin, sucursal, responsable, estado
  (programado, realizado, reprogramado, cancelado) y observaciones. Un evento programado cuya fecha
  ya pasó se muestra como **vencido**.
- **Código:** `client/src/modules/eventos/` (reglas en `logic/eventos.ts`, estado en `hooks/useCalendario.ts`). Para usarlo en otro módulo:
  `<CalendarioEventos tipos={['mi-tipo']} />`, después de añadir el tipo en `config.ts` (cliente)
  y en `eventos.types.ts` (servidor).
- **API:** `GET /api/eventos?tipo=...`, `POST /api/eventos`, `PUT /api/eventos/:id`, `DELETE /api/eventos/:id`.
- **Base de datos:** tabla `evento` (migración `003_eventos.sql`).

## Check list de Buenas Prácticas (Inspecciones SCI)

SCI = Subsecretaría de Calidad e Inocuidad. Formulario de revisión de áreas previa a la inspección,
basado en *Check List-Buenas Prácticas-Ago01-2022.xlsx* (43 requisitos en 5 áreas, respuestas SI / NO / N/A).

- **Ruta:** Inspecciones SCI ▸ Check list Buenas Prácticas (`/inspecciones-sci/checklist`).
- **Cumplimiento:** igual que la hoja "Cumplimiento" del Excel: SI ÷ (SI + NO); los N/A no cuentan.
  Colores: ≥ 80 % alto, ≥ 50 % medio, < 50 % bajo (umbrales en `checklist/logic/calculo.ts`).
- **Plantilla:** tabla `checklist_bp_item` (migración `004_checklist_bp.sql`). Cada respuesta guarda una
  copia del texto del requisito, así el historial no cambia si se modifica la plantilla.
- **Fotos de evidencia:** solo en requisitos marcados **NO**, hasta 4 por requisito. En celular: "Tomar foto"
  (abre la cámara trasera) o "Galería"; en el PC: "Agregar foto".
  El navegador las reduce a JPEG de máx. 1600 px antes de enviarlas (`services/storage/imagenes.ts`); se guardan en
  `checklist_bp_foto` (migración `005`) y se borran con su revisión o si la respuesta deja de ser NO.
- **API:** `GET /api/checklist-bp/plantilla`, CRUD en `/api/checklist-bp/revisiones` (cada respuesta
  lleva `fotos`: `{ id }` las guardadas, `{ datos: "data:image/jpeg;base64,…" }` las nuevas) y
  `GET /api/checklist-bp/fotos/:id`.
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

- Formato (igual que el portal): `POST { userName, password, codeApplication, includeUserInfo: true }`.
  `codeApplication` es por defecto el del Portal de Compras (`AUTH_APP_CODE`); si TI registra uno
  propio para el SIG, basta con cambiar esa variable. El nombre mostrado sale de `data.usuario.firstNames/lastNames`.

- Usuario: solo minúsculas y números (se convierte automáticamente). Contraseña: de 6 a 128 caracteres.
- Cuentas con verificación en dos pasos o con cambio de contraseña pendiente reciben un aviso y no ingresan.
- Tras 10 intentos fallidos desde la misma IP, se bloquea el ingreso durante 15 minutos.
- Solo `/api/health` es público; el resto de la API exige sesión.
- **Desarrollo:** `AUTH_DISABLED=true` en `server/.env` desactiva el inicio de sesión.
- **Código:** servidor en `server/src/modules/auth/` (sesion, limiteIntentos, auth.service) y
  `server/src/middleware/requiereSesion.ts`; cliente en `client/src/services/auth/`, `client/src/context/AuthContext.tsx`
  y `client/src/modules/auth/` (LoginPage, ControlAcceso).

## Publicación (Render)

En producción, un solo servicio entrega la web y la API: `npm run build` y luego `npm start`.
El archivo `render.yaml` define el despliegue y Render vuelve a publicar con cada push a `main`.

1. En [render.com](https://render.com) inicie sesión con su cuenta de GitHub.
2. Pulse **New ▸ Blueprint** y elija el repositorio `sig-naturisa`.
3. Pulse **Apply**. Render compila y publica la app en `https://sig-naturisa.onrender.com` (o similar).

**Datos (gratis y permanentes):** el plan gratuito de Render borra su disco al dormirse o publicar, por
eso la web guarda todo en **Turso** (base de datos libSQL en la nube, plan gratuito, región Oregon como
Render). En Render: `TURSO_DATABASE_URL` (en `render.yaml`) y `TURSO_AUTH_TOKEN` (se escribe a mano en
*Environment*; nunca en GitHub). Sin el token, el servidor usa una base local temporal y avisa en el
registro. En el PC se deja vacío para trabajar con `server/data/sig.db` sin tocar los datos reales.
Las migraciones (`server/migrations`) se aplican solas en Turso al arrancar.

**Apertura rápida (plan gratuito):** Render duerme el servicio tras 15 minutos sin visitas y luego
tarda ~1 minuto en abrir. La acción de GitHub `.github/workflows/mantener-activa.yml` consulta
`/api/health` cada 5 minutos de 06:00 a 18:59 (hora de Ecuador), de lunes a sábado, para que no se
duerma en horario laboral sin pasar las 750 horas gratuitas al mes. Se puede ejecutar a mano desde la
pestaña *Actions* de GitHub. GitHub desactiva las tareas programadas si el repositorio pasa 60 días sin cambios.
