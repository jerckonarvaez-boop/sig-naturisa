-- Monitoreo de agua: camaroneras e instalaciones (ficha técnica de los informes), resultados de los laboratorios
-- externos (afluente / efluente) y el PDF original de cada resultado.

-- Camaroneras, laboratorios de larvas y empacadoras que reciben el informe de monitoreo (PGC-025)
CREATE TABLE monitoreo_sitio (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  numero              INTEGER NOT NULL DEFAULT 0,             -- orden de los informes (1-PGC-025, 2-PGC-025…)
  nombre              TEXT NOT NULL,                          -- como se nombra en el informe: "Naturisa S.A. – Isla Josefina"
  tipo                TEXT NOT NULL DEFAULT 'camaronera',     -- camaronera | larvas (define los parámetros del efluente)
  lugar               TEXT NOT NULL DEFAULT '',               -- "la Isla Josefina" (Objetivo: "… ubicado en <lugar>")
  entidad             TEXT NOT NULL DEFAULT '',               -- ficha técnica: entidad promotora del proyecto
  representante       TEXT NOT NULL DEFAULT '',
  ruc                 TEXT NOT NULL DEFAULT '',
  tipo_proyecto       TEXT NOT NULL DEFAULT '',
  oficina             TEXT NOT NULL DEFAULT '',
  ubicacion           TEXT NOT NULL DEFAULT '',
  coordenadas_titulo  TEXT NOT NULL DEFAULT '',
  coordenadas         TEXT NOT NULL DEFAULT '[]',             -- JSON [{ punto, norte, este }]
  superficie          TEXT NOT NULL DEFAULT '',
  activo              INTEGER NOT NULL DEFAULT 1,
  creado_en           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  actualizado_en      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Un informe de resultados de un laboratorio externo (ej. ELICROM WGE-0000-000-26)
CREATE TABLE monitoreo_resultado (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  punto             TEXT NOT NULL,                  -- afluente | efluente
  laboratorio       TEXT NOT NULL DEFAULT '',
  codigo            TEXT NOT NULL DEFAULT '',       -- código del informe del laboratorio
  fecha_muestreo    TEXT NOT NULL,                  -- AAAA-MM-DD
  fecha_emision     TEXT NOT NULL DEFAULT '',
  locacion          TEXT NOT NULL DEFAULT '',       -- punto de muestreo según el laboratorio: "Golfomar/Servitron – Drenaje Piscina 1"
  norte             TEXT NOT NULL DEFAULT '',       -- coordenadas UTM del muestreo
  este              TEXT NOT NULL DEFAULT '',
  metodo            TEXT NOT NULL DEFAULT 'Simple', -- tipo de muestreo
  muestreo_tercero  INTEGER NOT NULL DEFAULT 0,     -- 1 si tomó la muestra el laboratorio
  valores           TEXT NOT NULL DEFAULT '[]',     -- JSON [{ clave, valor }] en el orden del informe
  observaciones     TEXT NOT NULL DEFAULT '',
  creado_en         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  actualizado_en    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_monitoreo_resultado_fecha ON monitoreo_resultado (punto, fecha_muestreo);

-- Sitios que cubre cada resultado (un mismo drenaje puede servir a varias camaroneras)
CREATE TABLE monitoreo_resultado_sitio (
  resultado_id  INTEGER NOT NULL REFERENCES monitoreo_resultado (id),
  sitio_id      INTEGER NOT NULL REFERENCES monitoreo_sitio (id),
  PRIMARY KEY (resultado_id, sitio_id)
);

CREATE INDEX idx_monitoreo_resultado_sitio_sitio ON monitoreo_resultado_sitio (sitio_id);

-- PDF original del laboratorio (uno por resultado)
CREATE TABLE monitoreo_resultado_pdf (
  resultado_id  INTEGER PRIMARY KEY REFERENCES monitoreo_resultado (id),
  nombre        TEXT NOT NULL,
  tamano        INTEGER NOT NULL,
  datos         BLOB NOT NULL,
  creado_en     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
