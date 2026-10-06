-- Check list de Buenas Prácticas (revisión previa a la inspección SCI).
-- Plantilla cargada desde 'Check List-Buenas Prácticas-Ago01-2022.xlsx' (43 requisitos, 5 áreas).

-- Requisitos del check list (plantilla)
CREATE TABLE checklist_bp_item (
  id            INTEGER PRIMARY KEY,
  seccion       TEXT NOT NULL,
  seccion_orden INTEGER NOT NULL,
  numero        INTEGER NOT NULL,
  requerimiento TEXT NOT NULL,
  activo        INTEGER NOT NULL DEFAULT 1   -- 0 = ya no se usa en revisiones nuevas
);

-- Cada revisión realizada a una sucursal
CREATE TABLE checklist_bp_revision (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha          TEXT NOT NULL,              -- AAAA-MM-DD
  sucursal       TEXT NOT NULL,
  responsable    TEXT NOT NULL DEFAULT '',
  observaciones  TEXT NOT NULL DEFAULT '',
  creado_en      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Respuestas de cada revisión. Guarda una copia del texto del requisito para que
-- el historial no cambie si la plantilla se modifica en el futuro.
CREATE TABLE checklist_bp_respuesta (
  revision_id   INTEGER NOT NULL REFERENCES checklist_bp_revision (id) ON DELETE CASCADE,
  item_id       INTEGER NOT NULL REFERENCES checklist_bp_item (id),
  seccion       TEXT NOT NULL,
  numero        INTEGER NOT NULL,
  requerimiento TEXT NOT NULL,
  respuesta     TEXT CHECK (respuesta IN ('SI', 'NO', 'N/A')),  -- NULL = sin responder
  observacion   TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (revision_id, item_id)
);

CREATE INDEX idx_checklist_bp_revision_fecha ON checklist_bp_revision (fecha);

INSERT INTO checklist_bp_item (id, seccion, seccion_orden, numero, requerimiento) VALUES
  (1, 'Bodega de balanceado', 1, 1, 'Los sacos de balanceado o pallets no deben estar pegados en la pared, separado por lo menos 20 cm de la pared y entre pallets.'),
  (2, 'Bodega de balanceado', 1, 2, 'Deben tener las fichas técnicas del balanceado'),
  (3, 'Bodega de balanceado', 1, 3, 'La bodega de balanceado debe estar cerrada, no tener huecos en las paredes o rejillas que permitan el ingreso de pájaros.'),
  (4, 'Bodega de balanceado', 1, 4, 'Señalética de Prohibido Fumar, comer o beber y Prohibido escupir.'),
  (5, 'Bodega de balanceado', 1, 5, 'En la bodega no debe de haber balanceado regado'),
  (6, 'Bodega de balanceado', 1, 6, 'Alrededor de la Bodega de Balanceado deben estar las trampas de control de plagas.'),
  (7, 'Bodega de balanceado', 1, 7, 'Dentro de la bodega de balanceado no debe de haber trampas de control de plagas de sebo, si pueden haber mecánicas.'),
  (8, 'Bodega de balanceado', 1, 8, 'En la bodega de balanceado solo se debe el balanceado e insumos de producción, más no, productos químicos.'),
  (9, 'Bodega de balanceado', 1, 9, 'Los animales domésticos no deben estar dentro de la bodega de balanceado.'),
  (10, 'Bodega de fertilizantes o químicos', 2, 10, 'Bodega de Químicos se debe de colocar las Hojas de seguridad de los productos químicos'),
  (11, 'Bodega de fertilizantes o químicos', 2, 11, 'Colocar en la Bodega de Químicos una botella de agua que se usará para Lavado de Ojos.'),
  (12, 'Bodega de fertilizantes o químicos', 2, 12, 'Colocar los sacos de los productos en Pallet y que no estén pegados a la pared o entre pallets'),
  (13, 'Bodega de fertilizantes o químicos', 2, 13, 'Colocar señalética de prevención en las bodegas (Prohibido Escupir, No fumar, comer o beber)'),
  (14, 'Bodega de fertilizantes o químicos', 2, 14, 'Los productos químicos líquidos (Peróxido, Diluyente, pinturas, Formol, etc.) deben de estar dentro de un cubeto de contención.'),
  (15, 'Comedor y cocina', 3, 15, 'Los tachos de basura con desperdicios de comida deben estar tapados.'),
  (16, 'Comedor y cocina', 3, 16, 'Dentro de la cocina o cerca de los alimentos, no deben estar los productos de limpieza, sino colocados dentro de una bodega o alejados del área.'),
  (17, 'Comedor y cocina', 3, 17, 'En el comedor debe de haber señalética de Prohibido Fumar.'),
  (18, 'Comedor y cocina', 3, 18, 'El comedor debe estar limpio libre de moscas.'),
  (19, 'Comedor y cocina', 3, 19, 'Alrededor de la cocina y comedor deben estar las trampas del control de plagas'),
  (20, 'Comedor y cocina', 3, 20, 'Los cilindros de GLP deben de estar colocados dentro de su bodega.'),
  (21, 'Bodega de lubricantes, desechos peligrosos, taller de mantenimiento y estación de bombeo', 4, 21, 'Se debe de colocar un tacho con arena, escoba y pala que sea utilizado para los derrames producidos.'),
  (22, 'Bodega de lubricantes, desechos peligrosos, taller de mantenimiento y estación de bombeo', 4, 22, 'Colocar la señalética respectiva como: Prohibido Fumar, comer o beber, Uso Obligartorio de EPP, Líquido Inflamable, Rombo NFPA.'),
  (23, 'Bodega de lubricantes, desechos peligrosos, taller de mantenimiento y estación de bombeo', 4, 23, 'Todos los hidrocarburos (Aceite, Combustible, Grasa, etc.) debe de estar dentro de un cubeto de contención.'),
  (24, 'Bodega de lubricantes, desechos peligrosos, taller de mantenimiento y estación de bombeo', 4, 24, 'Para los motores de la estación de bombeo que son de combustible debajo deben poseer bandeja como cubeto para los derrames de aceite'),
  (25, 'Bodega de lubricantes, desechos peligrosos, taller de mantenimiento y estación de bombeo', 4, 25, 'Guardaprotectora en el cardán de los motores de bombeo.'),
  (26, 'Bodega de lubricantes, desechos peligrosos, taller de mantenimiento y estación de bombeo', 4, 26, 'En los talleres no debe haber bandejas, cucharas, botellas de bebidas.'),
  (27, 'Bodega de lubricantes, desechos peligrosos, taller de mantenimiento y estación de bombeo', 4, 27, 'Los recipientes que son usados para aceite, resina, gasolina, deben tener su rótulado, quitado la etiqueta original del envase y dentro de un cubeto de contención.'),
  (28, 'Bodega de lubricantes, desechos peligrosos, taller de mantenimiento y estación de bombeo', 4, 28, 'No debe de haber derrames de combustible en el suelo.'),
  (29, 'Otras generalidades', 5, 29, 'Limpieza del campamento'),
  (30, 'Otras generalidades', 5, 30, 'Los extintores deben de estar vigentes'),
  (31, 'Otras generalidades', 5, 31, 'Los tachos utilizados como depósito de desperdicios, deben de estar tapados.'),
  (32, 'Otras generalidades', 5, 32, 'Los registros al día. (limpieza, Insumos, Desechos, cisterna de agua, escapes, etc.)'),
  (33, 'Otras generalidades', 5, 33, 'La pirotecnia debe de estar almacenado en un lugar fresco y separado de los productos químicos o hidrocarburos.'),
  (34, 'Otras generalidades', 5, 34, 'La cisterna de agua debe de estar cerrada que no permita el ingreso de insectos y/o animales.'),
  (35, 'Otras generalidades', 5, 35, 'Los tanques de oxígeno deben de estar amarrados fijos para evitar caídas.'),
  (36, 'Otras generalidades', 5, 36, 'Los baños deben estar limpios y en el lavabo señalética de Lavado de Manos.'),
  (37, 'Otras generalidades', 5, 37, 'En la cartelera se debe colocar las políticas de la empresa.'),
  (38, 'Otras generalidades', 5, 38, 'El campamento debe de haber Botiquín de primeros auxilios, que los medicamentos estén vigentes y exista un detallado del uso de dicho fármaco.'),
  (39, 'Otras generalidades', 5, 39, 'RGC-029 Registro de Control de escapes debe estar al día, se llena semanalmente, y que dice "No se encontró escapes por piscina xxx y se limpió filtros y mallas.'),
  (40, 'Otras generalidades', 5, 40, 'RGC-011 Registro Neutralización Agua de Cosecha debe estar al día, se llena de acuerdo a pescas y raleos, y llevar información de ph - Producto Aplicado -'),
  (41, 'Otras generalidades', 5, 41, 'RGC-017 Registro de Medición Saturación Oxígeno, Este registro se llena 2 veces/mes en el punto fijado de la salida del agua. Registrar el % Saturación de Oxígeno.'),
  (42, 'Otras generalidades', 5, 42, 'Los equipos de proteccion personal se deben almacenar dentro de una funda hermetica que no permita el ingreso de bacterias y hongos.'),
  (43, 'Otras generalidades', 5, 43, 'Los centros de acopio temporal de Aceite usados, que se puedan utilizar en las diferentes areas como mantenimiento, deben poseer lo siguiente: cubeto de contenga 110% del liquido total, este debe de ser de concreto, pintado de amarillo y negro con inclinacion de 45° a la derecha, Señaletica de NFPA, prohibido fumar, etc.');
