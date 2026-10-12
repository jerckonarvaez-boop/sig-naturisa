-- Laboratorio de análisis: informes de Análisis de Agua (AA), Análisis de Suelo (AS) y Patologías en fresco (AF).
-- Los parámetros de cada sección están definidos en server/src/modules/laboratorio/laboratorio.secciones.ts;
-- los valores de cada muestra se guardan como JSON para poder agregar parámetros sin cambiar la base de datos.
CREATE TABLE lab_informe (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  seccion        TEXT NOT NULL,                -- agua | suelo | patologia
  tipo           TEXT NOT NULL,                -- tipo de informe dentro de la sección
  codigo         TEXT NOT NULL,                -- ej. AA-2026-008
  fecha_emision  TEXT NOT NULL,                -- AAAA-MM-DD
  fecha_muestra  TEXT NOT NULL DEFAULT '',     -- análisis (agua) / muestreo (suelo) / recepción (patología)
  sucursal       TEXT NOT NULL DEFAULT '',     -- identificación de la muestra: centro de costo o cliente
  matriz         TEXT NOT NULL DEFAULT '',     -- ej. Agua, Suelo de piscinas, Camarones juveniles
  muestreado_por TEXT NOT NULL DEFAULT '',
  analisis       TEXT NOT NULL DEFAULT '',     -- análisis solicitado
  tecnico        TEXT NOT NULL DEFAULT '',
  observaciones  TEXT NOT NULL DEFAULT '',
  creado_en      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_lab_informe_seccion ON lab_informe (seccion, fecha_emision);

-- Muestras de cada informe (piscina, precría...) con sus resultados
CREATE TABLE lab_muestra (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  informe_id INTEGER NOT NULL REFERENCES lab_informe (id) ON DELETE CASCADE,
  orden      INTEGER NOT NULL,
  nombre     TEXT NOT NULL,                    -- ej. PS-79, Pre-105, 99
  valores    TEXT NOT NULL DEFAULT '{}'        -- JSON { clave del parámetro: número o texto }
);

CREATE INDEX idx_lab_muestra_informe ON lab_muestra (informe_id, orden);
