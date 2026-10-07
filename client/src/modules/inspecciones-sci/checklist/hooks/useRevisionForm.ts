import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hoyISO } from '@/utils/fechas';
import { agruparPorSeccion, contar } from '../logic/calculo';
import { actualizarRevision, crearRevision, eliminarRevision, listarRevisiones, obtenerPlantilla, obtenerRevision } from '../services/checklist.api';
import { RESPUESTA_VACIA, type ItemChecklist, type RespuestaEditable, type Revision } from '../types';

export const RUTA_LISTA = '/inspecciones-sci/checklist';

/** Datos generales de la revisión (encabezado del formulario) */
export interface DatosRevision {
  fecha: string;
  sucursal: string;
  responsable: string;
  observaciones: string;
}

export type Mensaje = { texto: string; error?: boolean } | null;

/**
 * Estado y acciones del formulario de una revisión del check list: carga la plantilla
 * (y la revisión si se edita), calcula el cumplimiento en vivo, guarda y elimina.
 */
export function useRevisionForm(revisionId: number | null) {
  const navigate = useNavigate();
  const [plantilla, setPlantilla] = useState<ItemChecklist[]>([]);
  const [datos, setDatos] = useState<DatosRevision>({ fecha: hoyISO(), sucursal: '', responsable: '', observaciones: '' });
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaEditable>>({});
  const [sucursales, setSucursales] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje>(null);

  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const [items, revisiones, revision] = await Promise.all([
          obtenerPlantilla(),
          listarRevisiones(),
          revisionId ? obtenerRevision(revisionId) : Promise.resolve(null),
        ]);
        if (!vigente) return;
        setPlantilla(items);
        setSucursales([...new Set(revisiones.map((r) => r.sucursal))].sort((a, b) => a.localeCompare(b, 'es')));
        if (revision) {
          setDatos({
            fecha: revision.fecha,
            sucursal: revision.sucursal,
            responsable: revision.responsable,
            observaciones: revision.observaciones,
          });
          setRespuestas(aEditables(revision));
        }
      } catch (e) {
        if (vigente) setMensaje({ texto: (e as Error).message, error: true });
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [revisionId]);

  const secciones = useMemo(() => agruparPorSeccion(plantilla), [plantilla]);
  const conteoGeneral = contar(plantilla.map((i) => respuestas[i.id]?.respuesta ?? null));
  const conteoPorArea = secciones.map((s) => ({
    seccion: s.seccion,
    conteo: contar(s.items.map((i) => respuestas[i.id]?.respuesta ?? null)),
  }));

  const cambiarDatos = (cambio: Partial<DatosRevision>) => setDatos((d) => ({ ...d, ...cambio }));

  const cambiarRespuesta = (itemId: number, cambio: Partial<RespuestaEditable>) =>
    setRespuestas((r) => {
      const previa: RespuestaEditable = r[itemId] ?? RESPUESTA_VACIA;
      return { ...r, [itemId]: { ...previa, ...cambio } };
    });

  async function guardar() {
    if (!datos.sucursal.trim()) {
      setMensaje({ texto: 'Indique la sucursal antes de guardar.', error: true });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    const cuerpo = {
      ...datos,
      respuestas: plantilla.map((i) => ({
        itemId: i.id,
        respuesta: respuestas[i.id]?.respuesta ?? null,
        observacion: respuestas[i.id]?.observacion ?? '',
        fotos: respuestas[i.id]?.respuesta === 'NO' ? respuestas[i.id].fotos : [],
      })),
    };
    try {
      if (revisionId) {
        // Las fotos recién tomadas pasan a ser fotos guardadas (con id)
        setRespuestas(aEditables(await actualizarRevision(revisionId, cuerpo)));
        setMensaje({ texto: 'Cambios guardados.' });
      } else {
        const nueva = await crearRevision(cuerpo);
        navigate(`${RUTA_LISTA}/${nueva.id}`, { replace: true });
        setMensaje({ texto: 'Revisión guardada.' });
      }
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!revisionId || !window.confirm('¿Eliminar esta revisión? Esta acción no se puede deshacer.')) return;
    try {
      await eliminarRevision(revisionId);
      navigate(RUTA_LISTA);
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    }
  }

  return {
    datos,
    cambiarDatos,
    respuestas,
    cambiarRespuesta,
    sucursales,
    secciones,
    conteoGeneral,
    conteoPorArea,
    cargando,
    guardando,
    mensaje,
    guardar,
    eliminar,
  };
}

/** Respuestas de una revisión guardada, en el formato que edita el formulario */
function aEditables(revision: Revision): Record<number, RespuestaEditable> {
  return Object.fromEntries(
    revision.respuestas.map((r) => [r.itemId, { respuesta: r.respuesta, observacion: r.observacion, fotos: r.fotos.map((id) => ({ id })) }]),
  );
}
