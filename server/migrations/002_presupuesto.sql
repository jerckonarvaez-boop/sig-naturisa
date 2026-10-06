-- Módulo Presupuesto: datos importados del Excel "Control de presupuesto SIG".
-- Cada importación reemplaza por completo el contenido de estas tablas.

-- Gastos (tabla Consulta2 del Excel)
CREATE TABLE presupuesto_gasto (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_solped    TEXT,            -- AAAA-MM-DD
  area            TEXT NOT NULL,
  subarea         TEXT,
  cluster         TEXT,
  sucursal        TEXT,
  nota_general    TEXT,
  item            TEXT,
  nota_posicion   TEXT,
  estado          TEXT,
  solped          TEXT,
  proveedor       TEXT,
  cantidad        REAL NOT NULL DEFAULT 0,
  precio_unitario REAL NOT NULL DEFAULT 0,
  total           REAL NOT NULL DEFAULT 0,
  oc_erp          TEXT,
  fecha_oc        TEXT             -- AAAA-MM-DD
);

CREATE INDEX idx_presupuesto_gasto_fecha ON presupuesto_gasto (fecha_solped);
CREATE INDEX idx_presupuesto_gasto_area ON presupuesto_gasto (area);

-- Presupuesto anual por área (tabla PresupuestoTipo del Excel)
CREATE TABLE presupuesto_area (
  area  TEXT PRIMARY KEY,
  monto REAL NOT NULL
);

-- Presupuesto anual por sub-área (tabla PresuestoArea del Excel)
CREATE TABLE presupuesto_subarea (
  area     TEXT NOT NULL,
  subarea  TEXT NOT NULL,
  monto    REAL NOT NULL,
  PRIMARY KEY (area, subarea)
);

-- Historial de importaciones
CREATE TABLE presupuesto_importacion (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  archivo       TEXT NOT NULL,
  registros     INTEGER NOT NULL,
  importado_en  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
