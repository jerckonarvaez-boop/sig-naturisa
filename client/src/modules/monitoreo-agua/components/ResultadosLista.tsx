import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, FileUp, Plus } from 'lucide-react';
import { FILA_ENCABEZADO, Tabla } from '@/components/tables/Tabla';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fechaCorta } from '@/utils/fechas';
import { useMonitoreo } from '../hooks/useMonitoreo';
import { aniosDe, incumplimientos, parametroDe } from '../logic/monitoreo';
import { RESULTADOS_AGUA, type PuntoMonitoreo } from '../meta';
import { urlPdf } from '../services/monitoreo.api';
import { SelectorAnio } from './SelectorAnio';

/** Resultados de los laboratorios de un punto (afluente o efluente). Clic en una fila para abrirlo. */
export function ResultadosLista({ punto }: { punto: PuntoMonitoreo }) {
  const { definicion, sitios, resultados, error, cargando } = useMonitoreo(punto);
  const navigate = useNavigate();
  const anios = useMemo(() => aniosDe(resultados ?? []), [resultados]);
  const [anioElegido, setAnio] = useState<number | null | undefined>(undefined);
  const anio = anioElegido !== undefined ? anioElegido : (anios[0] ?? null);
  const delAnio = (resultados ?? []).filter((r) => anio === null || r.fechaMuestreo.startsWith(String(anio)));
  const nombreSitio = (id: number) => sitios?.find((s) => s.id === id)?.nombre ?? `#${id}`;
  const rutaNuevo = `${RESULTADOS_AGUA.path}/${punto}/nuevo`;
  const archivo = useRef<HTMLInputElement>(null);

  // El PDF elegido viaja al formulario nuevo, que lo lee y llena los datos
  const botonNuevo = (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to={rutaNuevo}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <Plus size={16} /> Registrar a mano
      </Link>
      <button type="button" onClick={() => archivo.current?.click()} className={`${BOTON_PRIMARIO} inline-flex items-center gap-1.5 py-2`}>
        <FileUp size={16} /> Subir PDF del laboratorio
      </button>
      <input
        ref={archivo}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(e) => {
          const pdf = e.target.files?.[0];
          if (pdf) navigate(rutaNuevo, { state: { pdf } });
        }}
      />
    </div>
  );

  if (error) return <Card className="py-10 text-center text-red-600">No se pudieron cargar los resultados: {error}</Card>;
  if (cargando || !definicion) return <Card className="py-10 text-center text-slate-500">Cargando…</Card>;

  if (!resultados?.length) {
    return (
      <Card className="flex flex-col items-center py-14 text-center">
        <FileText size={40} className="text-brand-500" />
        <p className="mt-3 text-lg font-semibold">Aún no hay resultados del {punto}</p>
        <p className="mt-1 mb-4 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Suba el PDF que envía el laboratorio: el código, las fechas, las camaroneras y los parámetros se llenan solos y usted
          solo revisa y guarda.
        </p>
        {botonNuevo}
      </Card>
    );
  }

  return (
    <Card
      compact
      title={`${delAnio.length} ${delAnio.length === 1 ? 'resultado' : 'resultados'}`}
      subtitle="Pulse una fila para abrirla"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SelectorAnio anios={anios} anio={anio} onCambiar={setAnio} />
          {botonNuevo}
        </div>
      }
    >
      <Tabla anchoMinimo="min-w-[900px]">
        <thead>
          <tr className={FILA_ENCABEZADO}>
            <th className="px-3 py-2 font-semibold">Muestreo</th>
            <th className="px-3 py-2 font-semibold">Informe del laboratorio</th>
            <th className="px-3 py-2 font-semibold">Punto de muestreo</th>
            <th className="px-3 py-2 font-semibold">Camaroneras / instalaciones</th>
            <th className="px-3 py-2 font-semibold">{punto === 'efluente' ? 'Límites (AM 097a)' : 'Parámetros'}</th>
            <th className="px-3 py-2 font-semibold">PDF</th>
          </tr>
        </thead>
        <tbody>
          {delAnio.map((r) => {
            const abrir = () => navigate(`${RESULTADOS_AGUA.path}/${punto}/${r.id}`);
            const fuera = incumplimientos(r, definicion);
            return (
              <tr
                key={r.id}
                tabIndex={0}
                onClick={abrir}
                onKeyDown={(e) => e.key === 'Enter' && abrir()}
                className="cursor-pointer border-t border-slate-100 align-top hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <td className="px-3 py-2 whitespace-nowrap">{fechaCorta(r.fechaMuestreo)}</td>
                <td className="px-3 py-2">
                  <span className="font-medium whitespace-nowrap">{r.codigo || '—'}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{r.laboratorio}</span>
                </td>
                <td className="px-3 py-2">{r.locacion || '—'}</td>
                <td className="px-3 py-2">
                  <span className="block max-w-72">{r.sitios.map(nombreSitio).join(' · ')}</span>
                </td>
                <td className="px-3 py-2">
                  {punto === 'efluente' ? (
                    fuera.length ? (
                      <span title={fuera.map((f) => parametroDe(definicion, f.clave)?.nombre).join(', ')}>
                        <StatusBadge tone="danger" label={`Supera ${fuera.length}`} />
                      </span>
                    ) : (
                      <StatusBadge tone="success" label="Cumple" />
                    )
                  ) : (
                    <span className="tabular-nums">{r.valores.filter((v) => v.valor).length}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {r.pdf ? (
                    <a
                      href={urlPdf(r.id)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline"
                    >
                      <FileText size={14} /> Ver
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Tabla>
    </Card>
  );
}
