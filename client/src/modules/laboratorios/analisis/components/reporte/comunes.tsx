// Piezas comunes del informe de laboratorio: encabezado, ficha de datos, títulos de sección, firma y pie.
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ESTADOS_REFERENCIA } from '../../logic/laboratorio';
import type { InformeVista } from '../../logic/reporte';

export const LOGO = '/logo-naturisa-color.png';

const DIRECCION = ['Instalaciones: Camaronera Naturisa - Isla Josefina - Sector las Exclusas', 'Oficina: Colombia 101 y la Ría - Teléfono 6005360', 'Guayaquil-Ecuador'];

/** Encabezado: logo a la izquierda; "Laboratorio de análisis · Informe de resultados" y el código a la derecha */
export function Encabezado({ informe }: { informe: InformeVista }) {
  return (
    <>
      <div className="rep-encabezado">
        <img src={LOGO} alt="Naturisa" className="rep-logo" />
        <div className="rep-encabezado-titulo">
          <div className="rep-sobretitulo">Laboratorio de análisis</div>
          <div className="rep-titulo">Informe de resultados</div>
          <div className="rep-codigo">{informe.codigo}</div>
        </div>
      </div>
      <div className="rep-franja" />
    </>
  );
}

/** Ficha de datos del informe: etiqueta pequeña arriba y valor en negrita (el primero, destacado en azul) */
export function Ficha({ datos }: { datos: [string, ReactNode][] }) {
  const visibles = datos.filter(([, valor]) => valor !== '' && valor != null);
  return (
    <div className="rep-ficha" style={{ gridTemplateColumns: ['1.6fr', ...Array(Math.max(Math.min(visibles.length, 4) - 1, 0)).fill('1fr')].join(' ') }}>
      {visibles.map(([etiqueta, valor], i) => (
        <div key={etiqueta} className={i === 0 ? 'rep-ficha-principal' : ''}>
          <div className="rep-ficha-etiqueta">{etiqueta}</div>
          <div className="rep-ficha-valor">{valor}</div>
        </div>
      ))}
    </div>
  );
}

/** Título de una sección: número en un círculo, nombre, ícono y (a la derecha) la unidad o una nota */
export function Seccion({ numero, titulo, icono: Icono, nota }: { numero: number; titulo: string; icono: LucideIcon; nota?: string }) {
  return (
    <div className="rep-seccion">
      <span className="rep-numero">{numero}</span>
      <span className="rep-seccion-titulo">{titulo}</span>
      <Icono size={22} strokeWidth={1.75} className="rep-seccion-icono" aria-hidden="true" />
      {nota && <span className="rep-seccion-nota">{nota}</span>}
    </div>
  );
}

/** Leyenda de los indicadores ▲ / ▼ (solo si el informe tiene valores fuera de referencia) */
export function LeyendaReferencia() {
  return (
    <div className="rep-indicador">
      {(['alto', 'bajo'] as const).map((e) => (
        <span key={e}>
          <span className={`rep-muestra-color rep-${e}`}>{ESTADOS_REFERENCIA[e].flecha}</span> {ESTADOS_REFERENCIA[e].texto}
        </span>
      ))}
    </div>
  );
}

/** Métodos de análisis: "Nombre: descripción" por renglón */
export function Metodos({ lineas }: { lineas: [string, string][] }) {
  if (!lineas.length) return null;
  return (
    <div className="rep-bloque">
      <div className="rep-subtitulo">Métodos de análisis</div>
      {lineas.map(([nombre, texto]) => (
        <div key={nombre}>
          <b>{nombre}:</b> {texto}
        </div>
      ))}
    </div>
  );
}

export function Observaciones({ texto }: { texto: string }) {
  if (!texto) return null;
  return (
    <div className="rep-bloque">
      <div className="rep-subtitulo">Observaciones</div>
      <div>{texto}</div>
    </div>
  );
}

export function Firma({ tecnico, empresa = 'Naturisa' }: { tecnico: string; empresa?: string }) {
  return (
    <div className="rep-firma">
      <div className="rep-negrita">{tecnico || ' '}</div>
      <div className="rep-firma-cargo">Técnico de laboratorio</div>
      <div className="rep-firma-empresa">{empresa}</div>
    </div>
  );
}

export function Pie({ aviso }: { aviso: string }) {
  return (
    <div className="rep-pie">
      <div>{aviso}</div>
      {DIRECCION.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );
}

export const LEYENDA_FITOPLANCTON = [
  ['+', 'Significa que se ha encontrado presencia del organismo, en una cantidad baja.'],
  ['++', 'Significa que se ha encontrado presencia del organismo en una cantidad media.'],
  ['+++', 'Significa que se ha encontrado presencia del organismo en una cantidad alta.'],
  ['-', 'No se encontró'],
];
