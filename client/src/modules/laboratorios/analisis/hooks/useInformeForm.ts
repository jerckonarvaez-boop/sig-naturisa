import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hoyISO } from '@/utils/fechas';
import { aNumero, camposDelTipo, nombreTipo, RUTA_SECCION, siguienteCodigo } from '../logic/laboratorio';
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

  useEffect(() => {
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
          tipo: seccion.tipos[0].id,
          codigo: siguienteCodigo(seccion.prefijo, anteriores.map((i) => i.codigo)),
          fechaEmision: hoyISO(),
          fechaMuestra: hoyISO(),
          sucursal: '',
          matriz: seccion.matrices[0] ?? '',
          muestreadoPor: '',
          tecnico: anteriores[0]?.tecnico ?? '',
          observaciones: '',
          muestras: [muestraVacia()],
        });
      } catch (e) {
        if (vigente) setMensaje({ texto: (e as Error).message, error: true });
      }
    })();
    return () => {
      vigente = false;
    };
  }, [seccion, informeId]);

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

  async function guardar() {
    if (!seccion || !form) return;
    const tipo = seccion.tipos.find((t) => t.id === form.tipo);
    if (tipo?.unaMuestra && form.muestras.length !== 1) {
      setMensaje({ texto: `El tipo "${tipo.nombre}" lleva una sola muestra: quite las demás.`, error: true });
      return;
    }
    const campos = camposDelTipo(seccion, form.tipo);
    const datos: InformeDatos = {
      ...form,
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

  return { form, guardando, mensaje, cambiar, agregarMuestra, quitarMuestra, renombrarMuestra, cambiarValor, guardar, eliminar };
}
