import { useMemo, useState } from 'react';
import { hoyISO } from '@/utils/fechas';
import type { Pestana } from '../config';
import { agruparEventos, sugerenciasDe } from '../logic/eventos';
import type { Evento, EventoDatos, TipoEvento } from '../types';
import { useEventos } from './useEventos';

export type Vista = 'mes' | 'lista';

/** Estado del calendario: datos, mes visible, vista, pestaña y ventanas abiertas. */
export function useCalendario(tipos: TipoEvento[]) {
  const { eventos, cargando, error, guardar, eliminar } = useEventos(tipos);
  const hoy = new Date();
  const [vista, setVista] = useState<Vista>('mes');
  const [pestana, setPestana] = useState<Pestana>('proximos');
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [formulario, setFormulario] = useState<{ evento?: Evento; inicial?: Partial<EventoDatos> } | null>(null);
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null);

  const grupos = useMemo(() => agruparEventos(eventos), [eventos]);
  const sugerencias = useMemo(() => sugerenciasDe(eventos), [eventos]);

  const moverMes = (delta: number) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };
  const irAHoy = () => {
    setAnio(hoy.getFullYear());
    setMes(hoy.getMonth());
  };

  /** Abre el formulario para un evento nuevo (en el día indicado o hoy) */
  const nuevo = (fechaInicio?: string) => setFormulario({ inicial: { fechaInicio: fechaInicio ?? hoyISO() } });
  const editar = (evento: Evento) => {
    setDiaAbierto(null);
    setFormulario({ evento });
  };

  /** Desde el panel lateral: abre la lista en la pestaña con más pendientes */
  const verTodosEnLista = () => {
    setVista('lista');
    setPestana(grupos.vencidos.length > 3 ? 'vencidos' : 'proximos');
  };

  return {
    eventos,
    cargando,
    error,
    guardar,
    eliminar,
    grupos,
    sugerencias,
    vista,
    setVista,
    pestana,
    setPestana,
    anio,
    mes,
    moverMes,
    irAHoy,
    formulario,
    cerrarFormulario: () => setFormulario(null),
    diaAbierto,
    setDiaAbierto,
    nuevo,
    editar,
    verTodosEnLista,
  };
}
