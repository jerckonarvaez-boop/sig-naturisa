-- Calendario general: aviso por correo antes de cada evento.
-- avisar = 1 → se avisa por correo; aviso_enviado_en = cuándo se envió (NULL = pendiente).
-- Los tipos nuevos (capacitación, mantenimiento, vencimiento, otro) no requieren cambios: "tipo" es texto.
ALTER TABLE evento ADD COLUMN avisar INTEGER NOT NULL DEFAULT 1;
ALTER TABLE evento ADD COLUMN aviso_enviado_en TEXT;
