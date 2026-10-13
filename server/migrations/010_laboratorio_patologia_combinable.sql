-- Patologías en fresco: el tipo pasa a ser la combinación marcada (patología en fresco y/o bacteriología),
-- guardada como "fresco+bacteriologia". Una o varias muestras ya no es un tipo: depende de cuántas se agreguen.
-- En el SET, ambos CASE leen el tipo anterior de la fila.
UPDATE lab_informe SET
  tipo = CASE
    WHEN tipo IN ('una-bact', 'varias-bact') THEN 'fresco+bacteriologia'
    WHEN tipo IN ('una', 'varias') THEN 'fresco'
    ELSE tipo
  END,
  analisis = CASE
    WHEN tipo IN ('una-bact', 'varias-bact') THEN 'Patología + Bacteriología'
    WHEN tipo IN ('una', 'varias') THEN 'Patología'
    ELSE analisis
  END
WHERE seccion = 'patologia';
