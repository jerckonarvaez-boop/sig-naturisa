-- Laboratorios de análisis ▸ Oxigenómetros: reparación de partes y ahorro frente a comprar una parte nueva.
-- Cada fila es una parte reparada. Ahorro = (precio_nuevo - costo_reparacion) x cantidad (solo si está reparada).
CREATE TABLE oxigenometro_reparacion (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha            TEXT NOT NULL,                     -- AAAA-MM-DD
  parte            TEXT NOT NULL,                     -- ej. Sonda / sensor, Cable, Medidor
  cantidad         INTEGER NOT NULL DEFAULT 1,
  equipo           TEXT NOT NULL DEFAULT '',          -- modelo o serie del oxigenómetro
  sucursal         TEXT NOT NULL DEFAULT '',
  trabajo          TEXT NOT NULL DEFAULT '',          -- qué se hizo
  costo_reparacion REAL NOT NULL DEFAULT 0,           -- costo unitario de reparar (repuestos + mano de obra)
  precio_nuevo     REAL NOT NULL DEFAULT 0,           -- precio unitario de comprar la parte nueva
  estado           TEXT NOT NULL DEFAULT 'reparado',  -- reparado | en-reparacion | no-reparable
  responsable      TEXT NOT NULL DEFAULT '',
  observaciones    TEXT NOT NULL DEFAULT '',
  creado_en        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  actualizado_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_oxigenometro_reparacion_fecha ON oxigenometro_reparacion (fecha);
