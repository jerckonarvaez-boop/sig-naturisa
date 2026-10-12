-- Laboratorios de análisis ▸ Oxigenómetros: reparación de partes y ahorro frente a comprar una parte nueva.
-- Las reparaciones las hace el propio personal (sin costo), así que el ahorro = precio_nuevo x cantidad
-- (solo si la parte quedó reparada). El precio se toma del presupuesto (última compra del ítem).
CREATE TABLE oxigenometro_reparacion (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha            TEXT NOT NULL,                     -- AAAA-MM-DD
  parte            TEXT NOT NULL,                     -- ej. Sonda / sensor, Cable, Medidor
  cantidad         INTEGER NOT NULL DEFAULT 1,
  equipo           TEXT NOT NULL DEFAULT '',          -- modelo o serie del oxigenómetro
  sucursal         TEXT NOT NULL DEFAULT '',          -- sucursal / centro de costo (lista del presupuesto)
  trabajo          TEXT NOT NULL DEFAULT '',          -- qué se hizo
  precio_nuevo     REAL NOT NULL DEFAULT 0,           -- precio unitario de comprar la parte nueva
  estado           TEXT NOT NULL DEFAULT 'reparado',  -- reparado | en-reparacion | no-reparable
  responsable      TEXT NOT NULL DEFAULT '',
  observaciones    TEXT NOT NULL DEFAULT '',
  creado_en        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  actualizado_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_oxigenometro_reparacion_fecha ON oxigenometro_reparacion (fecha);
