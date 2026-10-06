-- Migración inicial: tabla de parámetros generales del sistema.
-- Las tablas de cada módulo (auditorías, laboratorios, etc.) se agregarán
-- en migraciones posteriores, a medida que definamos su contenido.

CREATE TABLE IF NOT EXISTS parametros (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

INSERT OR IGNORE INTO parametros (clave, valor) VALUES ('version_esquema', '1');
