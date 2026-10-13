import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Mail, Printer, Save, Trash2 } from 'lucide-react';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCatalogo } from '@/hooks/useCatalogo';
import { EditorMuestras } from '../components/EditorMuestras';
import { EnviarCorreoModal } from '../components/EnviarCorreoModal';
import { ReporteOficial } from '../components/reporte/ReporteOficial';
import { EncabezadoInforme } from '../components/EncabezadoInforme';
import { useDefinicion } from '../hooks/useDefinicion';
import { useInformeForm } from '../hooks/useInformeForm';
import { RUTA_SECCION } from '../logic/laboratorio';
import { aVista, horizontal } from '../logic/reporte';
import type { SeccionId } from '../types';

/** Registrar o editar un informe de laboratorio con el formato de la sección. */
export function InformePage({ seccionId }: { seccionId: SeccionId }) {
  const { id } = useParams();
  const informeId = id ? Number(id) : null;
  const { definicion, error } = useDefinicion();
  const { centrosCosto } = useCatalogo();
  const seccion = definicion?.secciones[seccionId] ?? null;
  const f = useInformeForm(seccion, informeId);
  const reporte = useRef<HTMLDivElement>(null);
  const [enviando, setEnviando] = useState(false);

  // Identificación de la muestra: centros de costo del presupuesto + clientes del laboratorio
  const identificaciones = useMemo(
    () => [...new Set([...centrosCosto, ...(definicion?.clientes ?? [])])].sort((a, b) => a.localeCompare(b, 'es')),
    [centrosCosto, definicion],
  );

  if (error) return <Card className="py-12 text-center text-red-600">No se pudo cargar el formato: {error}</Card>;
  if (!seccion || !f.form) {
    return (
      <Card className={`py-12 text-center ${f.mensaje?.error ? 'text-red-600' : 'text-slate-500'}`}>
        {f.mensaje?.error ? f.mensaje.texto : 'Cargando informe…'}
      </Card>
    );
  }

  const acciones = (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {informeId && (
        <button
          type="button"
          onClick={f.eliminar}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <Trash2 size={15} /> Eliminar
        </button>
      )}
      <button
        type="button"
        onClick={() => setEnviando(true)}
        disabled={!informeId}
        title={informeId ? 'Crear un borrador de Outlook con el informe en PDF' : 'Guarde el informe antes de enviarlo'}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <Mail size={15} /> Enviar por correo
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <Printer size={15} /> Imprimir
      </button>
      <button type="button" onClick={f.guardar} disabled={f.guardando} className={`${BOTON_PRIMARIO} inline-flex items-center gap-2 py-2`}>
        <Save size={15} /> {f.guardando ? 'Guardando…' : 'Guardar informe'}
      </button>
    </div>
  );

  const vista = aVista(seccion, f.form);

  return (
    <>
      {/* Al imprimir solo sale el informe con el formato oficial */}
      <div className="print:hidden">
        <PageHeader
          title={informeId ? `${f.form.codigo} · ${f.form.sucursal}` : `Nuevo informe · ${seccion.nombre}`}
          subtitle={seccion.nombre}
          breadcrumb={{ label: seccion.nombre, to: RUTA_SECCION[seccion.id] }}
          actions={acciones}
        />

        {f.mensaje && (
          <p
            role="status"
            className={`mb-4 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold print:hidden ${
              f.mensaje.error
                ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
            }`}
          >
            {!f.mensaje.error && <CheckCircle2 size={15} />}
            {f.mensaje.texto}
          </p>
        )}

        <div className="flex flex-col gap-4">
          <EncabezadoInforme seccion={seccion} form={f.form} identificaciones={identificaciones} onCambiar={f.cambiar} />
          <EditorMuestras
            seccion={seccion}
            tipo={f.form.tipo}
            muestras={f.form.muestras}
            onAgregar={f.agregarMuestra}
            onQuitar={f.quitarMuestra}
            onRenombrar={f.renombrarMuestra}
            onValor={f.cambiarValor}
          />
          {seccion.metodos.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <b>Métodos:</b> {seccion.metodos.join(' ')}
            </p>
          )}
        </div>
      </div>

      <ReporteOficial ref={reporte} seccion={seccion} informe={vista} />

      {enviando && (
        <EnviarCorreoModal
          seccion={seccion}
          codigo={f.form.codigo}
          sucursal={f.form.sucursal}
          fechaEmision={f.form.fechaEmision}
          reporte={reporte}
          orientacion={horizontal(seccion, vista) ? 'horizontal' : 'vertical'}
          onCerrar={() => setEnviando(false)}
        />
      )}
    </>
  );
}
