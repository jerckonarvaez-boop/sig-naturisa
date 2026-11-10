import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hoyISO } from '@/utils/fechas';
import { aNumero, camposDelTipo, nombreTipo, partesDelTipo, quimicosDelInforme, RUTA_SECCION, siguienteCodigo, tipoInicial, tipoUnaMuestra } from '../logic/laboratorio';
import { actualizarInforme, crearInforme, eliminarInforme, listarInformes, obtenerInforme } from '../services/laboratorio.api';
import type { Informe, InformeDatos, SeccionLab } from '../types';

/** Los valores se editan como texto (permite dejar vacío o escribir "-") y se convierten al guardar */
export interface MuestraForm {
  nombre: string;
  valores: Record<string, string>;
}

export interface InformeForm {
  tipo: string;
  codigo: string;
  fechaEmision: string;
  fechaMuestra: string;
  sucursal: string;
  matriz: string;
  muestreadoPor: string;
  tecnico: string;
  observaciones: string;
  /** Parámetros químicos elegidos para este informe (null = los vigentes en Configuración) */
  parametros: string[] | null;
  muestras: MuestraForm[];
}

export type Mensaje = { texto: string; error?: boolean } | null;

const muestraVacia = (): MuestraForm => ({ nombre: '', valores: {} });

function aFormulario(i: Informe): InformeForm {
  return {
    tipo: i.tipo,
    codigo: i.codigo,
    fechaEmision: i.fechaEmision,
    fechaMuestra: i.fechaMuestra,
    sucursal: i.sucursal,
    matriz: i.matriz,
    muestreadoPor: i.muestreadoPor,
    tecnico: i.tecnico,
    observaciones: i.observaciones,
    parametros: i.parametros ?? null,
    muestras: i.muestras.map((m) => ({
      nombre: m.nombre,
      valores: Object.fromEntries(Object.entries(m.valores).map(([k, v]) => [k, v == null ? '' : String(v)])),
    })),
  };
}

/** Estado y acciones del formulario de un informe de laboratorio (nuevo o existente). */
export function useInformeForm(seccion: SeccionLab | null, informeId: number | null) {
  const navigate = useNavigate();
  const [form, setForm] = useState<InformeForm | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  // La definición puede volver a pedirse (al crear un parámetro desde el informe): eso no debe recargar el formulario
  const seccionActual = useRef(seccion);
  seccionActual.current = seccion;
  const seccionId = seccion?.id;

  useEffect(() => {
    const seccion = seccionActual.current;
    if (!seccion) return;
    let vigente = true;
    setForm(null);
    (async () => {
      try {
        if (informeId) {
          const informe = await obtenerInforme(informeId);
          if (vigente) setForm(aFormulario(informe));
          return;
        }
        // Nuevo: código siguiente y el último técnico registrado
        const anteriores = await listarInformes(seccion.id);
        if (!vigente) return;
        setForm({
          tipo: tipoInicial(seccion),
          codigo: siguienteCodigo(seccion.prefijo, anteriores.map((i) => i.codigo)),
          fechaEmision: hoyISO(),
          fechaMuestra: hoyISO(),
          sucursal: '',
          matriz: seccion.matrices[0] ?? '',
          muestreadoPor: '',
          tecnico: anteriores[0]?.tecnico ?? '',
          observaciones: '',
          // Los parámetros químicos vigentes en Configuración; luego se quitan o agregan en el informe
          parametros: seccion.campos.some((c) => c.grupo === 'quimica')
            ? seccion.campos.filter((c) => c.grupo === 'quimica' && !c.oculto).map((c) => c.clave)
            : null,
          muestras: [muestraVacia()],
        });
      } catch (e) {
        if (vigente) setMensaje({ texto: (e as Error).message, error: true });
      }
    })();
    return () => {
      vigente = false;
    };
  }, [seccionId, informeId]);

  const actualizar = (cambio: (f: InformeForm) => InformeForm) => setForm((f) => (f ? cambio(f) : f));

  const cambiar = <K extends keyof Omit<InformeForm, 'muestras'>>(campo: K, valor: InformeForm[K]) =>
    actualizar((f) => ({ ...f, [campo]: valor }));

  const agregarMuestra = () => actualizar((f) => ({ ...f, muestras: [...f.muestras, muestraVacia()] }));
  const quitarMuestra = (i: number) => actualizar((f) => ({ ...f, muestras: f.muestras.filter((_, j) => j !== i) }));
  const renombrarMuestra = (i: number, nombre: string) =>
    actualizar((f) => ({ ...f, muestras: f.muestras.map((m, j) => (j === i ? { ...m, nombre } : m)) }));
  const cambiarValor = (i: number, clave: string, valor: string) =>
    actualizar((f) => ({
      ...f,
      muestras: f.muestras.map((m, j) => (j === i ? { ...m, valores: { ...m.valores, [clave]: valor } } : m)),
    }));

  /** Claves de los parámetros químicos que lleva ahora el informe */
  const quimicosActuales = (f: InformeForm) => (seccion ? quimicosDelInforme(seccion.campos, f.parametros, f.muestras).map((c) => c.clave) : []);

  /** Quita un parámetro químico de este informe (y borra sus valores) */
  const quitarParametro = (clave: string) =>
    actualizar((f) => ({
      ...f,
      parametros: quimicosActuales(f).filter((c) => c !== clave),
      muestras: f.muestras.map((m) => ({ ...m, valores: Object.fromEntries(Object.entries(m.valores).filter(([k]) => k !== clave)) })),
    }));

  /** Agrega un parámetro químico al final de la tabla de este informe */
  const agregarParametro = (clave: string) =>
    actualizar((f) => ({ ...f, parametros: [...quimicosActuales(f).filter((c) => c !== clave), clave] }));

  async function guardar() {
    if (!seccion || !form) return;
    const unaMuestra = tipoUnaMuestra(seccion, form.tipo);
    if (unaMuestra && form.muestras.length !== 1) {
      setMensaje({ texto: `El tipo "${unaMuestra.nombre}" lleva una sola muestra: quite las demás.`, error: true });
      return;
    }
    // Con análisis químico se guarda qué parámetros lleva; los demás químicos no se guardan
    const conQuimico = partesDelTipo(form.tipo).includes('quimico') && seccion.campos.some((c) => c.grupo === 'quimica');
    const parametros = conQuimico ? quimicosActuales(form) : null;
    const campos = camposDelTipo(seccion, form.tipo).filter((c) => c.grupo !== 'quimica' || parametros?.includes(c.clave));
    const datos: InformeDatos = {
      ...form,
      parametros,
      seccion: seccion.id,
      analisis: nombreTipo(seccion, form.tipo),
      muestras: form.muestras.map((m) => ({
        nombre: m.nombre.trim(),
        valores: Object.fromEntries(
          campos
            .map((c) => [c.clave, c.tipo === 'numero' ? aNumero(m.valores[c.clave] ?? '') : (m.valores[c.clave] ?? '').trim() || null] as const)
            .filter(([, v]) => v !== null),
        ),
      })),
    };
    setGuardando(true);
    setMensaje(null);
    try {
      if (informeId) {
        setForm(aFormulario(await actualizarInforme(informeId, datos)));
        setMensaje({ texto: 'Cambios guardados.' });
      } else {
        const nuevo = await crearInforme(datos);
        navigate(`${RUTA_SECCION[seccion.id]}/${nuevo.id}`, { replace: true });
        setMensaje({ texto: 'Informe guardado.' });
      }
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!seccion || !informeId || !window.confirm('¿Eliminar este informe? Esta acción no se puede deshacer.')) return;
    try {
      await eliminarInforme(informeId);
      navigate(RUTA_SECCION[seccion.id]);
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    }
  }

  return {
    form,
    guardando,
    mensaje,
    cambiar,
    agregarMuestra,
    quitarMuestra,
    renombrarMuestra,
    cambiarValor,
    quitarParametro,
    agregarParametro,
    guardar,
    eliminar,
  };
}
