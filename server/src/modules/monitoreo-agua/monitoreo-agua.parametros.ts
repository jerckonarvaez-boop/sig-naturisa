// Parámetros que se pueden registrar en los resultados de monitoreo de agua, con su límite máximo permisible.
// Límites: Acuerdo Ministerial 097a, Anexo 1 (Recurso Agua), Tabla 10 – Límites de descarga a un cuerpo de agua
// marina, columna (A) descargas en zona de rompientes. Los parámetros sin límite en la tabla llevan '---'.

export interface ParametroMonitoreo {
  clave: string;
  /** Nombre como sale en el informe */
  nombre: string;
  unidad: string;
  /** Límite como se escribe en el informe: "200", "6-9", "<35", "Ausencia", "---" */
  limite: string;
  /** Para evaluar el resultado (si no hay, no se evalúa) */
  max?: number;
  min?: number;
  /** El límite excluye el valor máximo (temperatura < 35) */
  maxExclusivo?: boolean;
  /** Resultado de texto que cumple (material flotante: "Ausencia") */
  textoCumple?: string;
}

export const PARAMETROS_MONITOREO: ParametroMonitoreo[] = [
  { clave: 'dbo5', nombre: 'Demanda Bioquímica de Oxígeno (DBO5)', unidad: 'mg/l', limite: '200', max: 200 },
  { clave: 'dqo', nombre: 'Demanda Química de Oxígeno (DQO)', unidad: 'mg/l', limite: '400', max: 400 },
  { clave: 'sulfuros', nombre: 'Sulfuros', unidad: 'mg/l', limite: '0,5', max: 0.5 },
  { clave: 'sst', nombre: 'Sólidos Suspendidos Totales (SST)', unidad: 'mg/l', limite: '250', max: 250 },
  { clave: 'ph', nombre: 'Potencial de Hidrógeno (pH)', unidad: 'U de pH', limite: '6-9', min: 6, max: 9 },
  { clave: 'nitrogeno_total', nombre: 'Nitrógeno Total', unidad: 'mg/l', limite: '40', max: 40 },
  { clave: 'fosforo_total', nombre: 'Fósforo Total', unidad: 'mg/l', limite: '---' },
  { clave: 'coliformes_fecales', nombre: 'Coliformes Fecales', unidad: 'NMP/100 ml', limite: '2000', max: 2000 },
  { clave: 'aceites_grasas', nombre: 'Aceites y Grasas', unidad: 'mg/l', limite: '30', max: 30 },
  { clave: 'tph', nombre: 'Hidrocarburos Totales de Petróleo (TPH)', unidad: 'mg/l', limite: '20', max: 20 },
  { clave: 'tensoactivos', nombre: 'Tensoactivos', unidad: 'mg/l', limite: '0,5', max: 0.5 },
  { clave: 'cloro_total', nombre: 'Cloro Total', unidad: 'mg/l', limite: '---' },
  { clave: 'oxigeno_disuelto', nombre: 'Oxígeno Disuelto', unidad: 'mg/l', limite: '---' },
  { clave: 'material_flotante', nombre: 'Material Flotante', unidad: '---', limite: 'Ausencia', textoCumple: 'ausencia' },
  { clave: 'temperatura', nombre: 'Temperatura', unidad: '°C', limite: '<35', max: 35, maxExclusivo: true },
  { clave: 'arsenico', nombre: 'Arsénico total', unidad: 'mg/l', limite: '0,5', max: 0.5 },
  { clave: 'aluminio', nombre: 'Aluminio', unidad: 'mg/l', limite: '5', max: 5 },
  { clave: 'cianuro', nombre: 'Cianuro total', unidad: 'mg/l', limite: '0,2', max: 0.2 },
  { clave: 'cinc', nombre: 'Cinc', unidad: 'mg/l', limite: '10', max: 10 },
  { clave: 'cobre', nombre: 'Cobre', unidad: 'mg/l', limite: '1', max: 1 },
  { clave: 'cobalto', nombre: 'Cobalto', unidad: 'mg/l', limite: '0,5', max: 0.5 },
  { clave: 'cromo_hexavalente', nombre: 'Cromo hexavalente', unidad: 'mg/l', limite: '0,5', max: 0.5 },
  { clave: 'fenoles', nombre: 'Compuestos fenólicos', unidad: 'mg/l', limite: '0,2', max: 0.2 },
  { clave: 'mercurio', nombre: 'Mercurio total', unidad: 'mg/l', limite: '0,01', max: 0.01 },
  { clave: 'organoclorados', nombre: 'Compuestos organoclorados', unidad: 'µg/l', limite: '50', max: 50 },
  { clave: 'organofosforados', nombre: 'Compuestos organofosforados', unidad: 'µg/l', limite: '100', max: 100 },
  { clave: 'carbamatos', nombre: 'Carbamatos', unidad: 'mg/l', limite: '0,25', max: 0.25 },
  { clave: 'color', nombre: 'Color', unidad: 'unidades de color', limite: 'Inapreciable en dilución 1/20' },
];

export const CLAVES_PARAMETROS = PARAMETROS_MONITOREO.map((p) => p.clave);

/** Parámetros con los que se abre un resultado nuevo, según el punto y el tipo de sitio */
export const PARAMETROS_PREDETERMINADOS = {
  /** Efluente de camaroneras y empacadoras (informe PGC-025) */
  camaronera: ['dbo5', 'sulfuros', 'sst', 'ph'],
  /** Efluente de laboratorios de larvas (informe PGC-025 de LQ1 a LQ4) */
  larvas: [
    'coliformes_fecales', 'aceites_grasas', 'dbo5', 'dqo', 'tph', 'tensoactivos', 'cloro_total', 'nitrogeno_total',
    'oxigeno_disuelto', 'ph', 'sulfuros', 'material_flotante', 'sst', 'temperatura',
  ],
  /** Afluente (calidad de agua ASC: Apéndice X) */
  afluente: ['nitrogeno_total', 'dbo5', 'sst', 'fosforo_total', 'ph'],
};
