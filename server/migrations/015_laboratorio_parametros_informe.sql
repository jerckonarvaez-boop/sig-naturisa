-- Parámetros químicos que lleva cada informe de Análisis de Agua (se quitan o agregan al hacer el informe).
-- JSON con las claves en el orden en que salen, ej. ["amonio","fosfato","silice"]. NULL en los informes
-- anteriores: llevan los parámetros vigentes en Configuración (y los quitados que tengan valor).
ALTER TABLE lab_informe ADD COLUMN parametros TEXT;
