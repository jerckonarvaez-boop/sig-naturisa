import { useEffect, useState } from 'react';
import { listarEventos } from '@/modules/eventos/services/eventos.api';
import type { Evento } from '@/modules/eventos/types';
import { listarRevisiones } from '@/modules/inspecciones-sci/checklist/services/checklist.api';
import type { Revision } from '@/modules/inspecciones-sci/checklist/types';
import { listarInformes } from '@/modules/laboratorios/analisis/services/laboratorio.api';
import type { InformeResumen } from '@/modules/laboratorios/analisis/types';
import { listarReparaciones } from '@/modules/laboratorios/oxigenometros/services/oxigenometros.api';
import type { Reparacion } from '@/modules/laboratorios/oxigenometros/types';
import { listarResultados, obtenerDefinicion } from '@/modules/monitoreo-agua/services/monitoreo.api';
import type { DefinicionMonitoreo, Resultado } from '@/modules/monitoreo-agua/types';
import { obtenerPresupuesto } from '@/modules/presupuesto/services/presupuesto.api';
import type { PresupuestoData } from '@/modules/presupuesto/types';

/** Datos de una sección: undefined mientras carga; error si no se pudo leer (las demás siguen) */
export interface Fuente<T> {
  datos?: T;
  error?: string;
}

export interface DatosTablero {
  presupuesto: Fuente<PresupuestoData>;
  informes: Fuente<InformeResumen[]>;
  reparaciones: Fuente<Reparacion[]>;
  monitoreo: Fuente<{ resultados: Resultado[]; definicion: DefinicionMonitoreo }>;
  revisiones: Fuente<Revision[]>;
  eventos: Fuente<Evento[]>;
}

const fuente = async <T>(p: Promise<T>): Promise<Fuente<T>> => {
  try {
    return { datos: await p };
  } catch (e) {
    return { error: (e as Error).message };
  }
};

/** Carga a la vez los datos de todas las secciones para los gráficos del Dashboard */
export function useDatosTablero() {
  const [datos, setDatos] = useState<DatosTablero | null>(null);

  useEffect(() => {
    let vigente = true;
    (async () => {
      const [presupuesto, informes, reparaciones, monitoreo, revisiones, eventos] = await Promise.all([
        fuente(obtenerPresupuesto()),
        fuente(Promise.all([listarInformes('agua'), listarInformes('suelo'), listarInformes('patologia')]).then((l) => l.flat())),
        fuente(listarReparaciones()),
        fuente(Promise.all([listarResultados(), obtenerDefinicion()]).then(([resultados, definicion]) => ({ resultados, definicion }))),
        fuente(listarRevisiones()),
        fuente(listarEventos()),
      ]);
      if (vigente) setDatos({ presupuesto, informes, reparaciones, monitoreo, revisiones, eventos });
    })();
    return () => {
      vigente = false;
    };
  }, []);

  return datos;
}
