import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { AvisosModal } from '@/modules/eventos/components/AvisosModal';
import { CalendarioEventos } from '@/modules/eventos/components/CalendarioEventos';
import { TIPOS, TODOS_LOS_TIPOS } from '@/modules/eventos/config';
import type { TipoEvento } from '@/modules/eventos/types';
import { meta } from '../meta';

const CHIP = 'rounded-full px-3 py-1 text-xs font-semibold transition';
const CHIP_ACTIVO = 'bg-brand-900 text-white dark:bg-sky-600';
const CHIP_INACTIVO = 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';

/**
 * Calendario general: todos los eventos de la plataforma con filtro por tipo (?tipo=a,b en la URL,
 * así los módulos enlazan a su parte) y la configuración de los avisos por correo.
 */
export function CalendarioPage() {
  const [params, setParams] = useSearchParams();
  const [avisos, setAvisos] = useState(false);

  const filtro = (params.get('tipo') ?? '').split(',').filter((t): t is TipoEvento => t in TIPOS);
  const tipos = filtro.length ? filtro : TODOS_LOS_TIPOS;

  /** Marca o desmarca un tipo; sin ninguno (o con todos) se muestra todo */
  const alternar = (tipo: TipoEvento) => {
    const nuevo = TODOS_LOS_TIPOS.filter((t) => (t === tipo ? !filtro.includes(t) : filtro.includes(t)));
    setParams(nuevo.length && nuevo.length < TODOS_LOS_TIPOS.length ? { tipo: nuevo.join(',') } : {}, { replace: true });
  };

  return (
    <>
      <PageHeader
        title={meta.label}
        subtitle={meta.description}
        actions={
          <button
            type="button"
            onClick={() => setAvisos(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <BellRing size={16} /> Avisos por correo
          </button>
        }
      />

      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por tipo de evento">
        <button type="button" aria-pressed={!filtro.length} onClick={() => setParams({}, { replace: true })} className={`${CHIP} ${filtro.length ? CHIP_INACTIVO : CHIP_ACTIVO}`}>
          Todos
        </button>
        {TODOS_LOS_TIPOS.map((t) => {
          const activo = filtro.includes(t);
          return (
            <button key={t} type="button" aria-pressed={activo} onClick={() => alternar(t)} className={`${CHIP} ${activo ? CHIP_ACTIVO : CHIP_INACTIVO}`}>
              {TIPOS[t].label}
            </button>
          );
        })}
      </div>

      <CalendarioEventos tipos={tipos} titulo={filtro.length === 1 ? TIPOS[filtro[0]].label : 'Calendario general'} />

      {avisos && <AvisosModal onCerrar={() => setAvisos(false)} />}
    </>
  );
}
