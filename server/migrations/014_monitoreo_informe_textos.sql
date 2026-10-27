-- Monitoreo de agua: textos del informe PGC-025 corregidos a mano para un resultado y una camaronera.
-- Solo guarda los textos que se cambiaron; los demás siguen siendo los de la ficha (o los automáticos).

CREATE TABLE monitoreo_informe (
  resultado_id    INTEGER NOT NULL REFERENCES monitoreo_resultado (id),
  sitio_id        INTEGER NOT NULL REFERENCES monitoreo_sitio (id),
  textos          TEXT NOT NULL DEFAULT '{}',   -- JSON: intro1, intro2, objetivo, alcance, resumen, conclusion, tabla, anexo
  actualizado_en  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (resultado_id, sitio_id)
);
