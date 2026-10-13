-- Configuración general editable desde la plataforma (clave → valor). Primer uso: plantilla del correo
-- con que se envían los informes de laboratorio.
CREATE TABLE configuracion (
  clave          TEXT PRIMARY KEY,
  valor          TEXT NOT NULL,
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Últimos destinatarios usados para enviar informes de cada centro de costo / cliente
CREATE TABLE lab_destinatario (
  sucursal       TEXT PRIMARY KEY,
  para           TEXT NOT NULL DEFAULT '',
  cc             TEXT NOT NULL DEFAULT '',
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
