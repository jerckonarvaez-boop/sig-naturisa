-- Monitoreo de agua: encabezado y textos propios del informe PGC-025 de cada camaronera, y los logos.
-- Los logos se guardan en la base (no en el repositorio, que es público).

ALTER TABLE monitoreo_sitio ADD COLUMN titulo_encabezado TEXT NOT NULL DEFAULT '';  -- "NATURISA S.A. – ISLA JOSEFINA"
ALTER TABLE monitoreo_sitio ADD COLUMN logos TEXT NOT NULL DEFAULT '[]';            -- JSON [id de monitoreo_logo] (0 a 2)
ALTER TABLE monitoreo_sitio ADD COLUMN logo_texto TEXT NOT NULL DEFAULT '';         -- en lugar de logo: "RIO NILO S.A."
ALTER TABLE monitoreo_sitio ADD COLUMN textos TEXT NOT NULL DEFAULT '{}';           -- JSON: introduccion, objetivo, alcance, resumen, conclusion, tabla

CREATE TABLE monitoreo_logo (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre     TEXT NOT NULL,
  tipo       TEXT NOT NULL,              -- image/png, image/jpeg o image/webp
  tamano     INTEGER NOT NULL,
  datos      BLOB NOT NULL,
  creado_en  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
