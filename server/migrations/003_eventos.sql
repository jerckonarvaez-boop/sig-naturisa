-- Calendario de eventos (auditorías, inspecciones...), compartido entre módulos.
-- El campo "tipo" indica a qué módulo pertenece cada evento.

CREATE TABLE evento (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo            TEXT NOT NULL,   -- auditoria-asc | auditoria-bap | inspeccion-sci
  titulo          TEXT NOT NULL,
  fecha_inicio    TEXT NOT NULL,   -- AAAA-MM-DD
  fecha_fin       TEXT,            -- AAAA-MM-DD (opcional, eventos de varios días)
  sucursal        TEXT NOT NULL DEFAULT '',
  responsable     TEXT NOT NULL DEFAULT '',
  estado          TEXT NOT NULL DEFAULT 'programado', -- programado | realizado | reprogramado | cancelado
  observaciones   TEXT NOT NULL DEFAULT '',
  creado_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  actualizado_en  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_evento_tipo_fecha ON evento (tipo, fecha_inicio);
