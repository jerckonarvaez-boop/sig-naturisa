-- Fotos de evidencia de los requisitos marcados como NO en el check list de Buenas Prácticas.
-- Se guardan ya reducidas (JPEG) por el navegador; se borran junto con su revisión.
CREATE TABLE checklist_bp_foto (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  revision_id INTEGER NOT NULL REFERENCES checklist_bp_revision (id) ON DELETE CASCADE,
  item_id     INTEGER NOT NULL REFERENCES checklist_bp_item (id),
  tipo        TEXT NOT NULL,              -- image/jpeg, image/png o image/webp
  datos       BLOB NOT NULL,
  creado_en   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_checklist_bp_foto_revision ON checklist_bp_foto (revision_id, item_id);
