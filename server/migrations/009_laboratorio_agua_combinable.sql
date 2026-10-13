-- Análisis de Agua: el tipo pasa a ser la combinación de tablas que lleva el informe
-- (fitoplancton, químico y/o bacteriológico), guardada como "fitoplancton+quimico+bacteriologia".
-- En el SET, ambos CASE leen el tipo anterior de la fila.
UPDATE lab_informe SET
  tipo = CASE tipo
    WHEN 'completo' THEN 'fitoplancton+quimico+bacteriologia'
    WHEN 'quimicos' THEN 'fitoplancton+quimico'
    WHEN 'basico' THEN 'fitoplancton'
    ELSE tipo
  END,
  analisis = CASE tipo
    WHEN 'completo' THEN 'Fitoplancton + Químico + Bacteriológico'
    WHEN 'quimicos' THEN 'Fitoplancton + Químico'
    WHEN 'basico' THEN 'Fitoplancton'
    ELSE analisis
  END
WHERE seccion = 'agua';
