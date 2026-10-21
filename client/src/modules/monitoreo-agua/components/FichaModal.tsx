import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Modal } from '@/components/ui/Modal';
import type { Coordenada, Sitio, SitioDatos, TipoSitio } from '../types';

interface FichaModalProps {
  /** Ficha a editar; si no se indica, se crea una nueva */
  sitio?: Sitio;
  /** Número sugerido para una ficha nueva */
  siguienteNumero: number;
  onGuardar: (datos: SitioDatos, id?: number) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
  onCerrar: () => void;
}

/** Coordenadas como texto, una por línea: "1; 9700000; 600000" */
const aTexto = (cs: Coordenada[]) => cs.map((c) => [c.punto, c.norte, c.este].join('; ')).join('\n');

function deTexto(t: string): Coordenada[] {
  return t
    .split('\n')
    .map((l) => l.split(/[;\t]/).map((x) => x.trim()))
    .filter((p) => p.some(Boolean))
    .map((p, i) => (p.length >= 3 ? { punto: p[0] || String(i + 1), norte: p[1], este: p[2] } : { punto: String(i + 1), norte: p[0] ?? '', este: p[1] ?? '' }));
}

const OFICINA = 'Las oficinas administrativas del proyecto están ubicadas en las calles Colombia 101 y La Ría, Cantón Guayaquil, Provincia Guayas.';

/** Ficha técnica de una camaronera o instalación (lo que sale en el informe de monitoreo PGC-025). */
export function FichaModal({ sitio, siguienteNumero, onGuardar, onEliminar, onCerrar }: FichaModalProps) {
  const [datos, setDatos] = useState<Omit<SitioDatos, 'coordenadas'>>(() => ({
    numero: sitio?.numero ?? siguienteNumero,
    nombre: sitio?.nombre ?? '',
    tipo: sitio?.tipo ?? 'camaronera',
    lugar: sitio?.lugar ?? '',
    entidad: sitio?.entidad ?? '',
    representante: sitio?.representante ?? '',
    ruc: sitio?.ruc ?? '',
    tipoProyecto: sitio?.tipoProyecto ?? 'Acuacultura (Camaronera)',
    oficina: sitio?.oficina ?? OFICINA,
    ubicacion: sitio?.ubicacion ?? '',
    coordenadasTitulo: sitio?.coordenadasTitulo ?? '',
    superficie: sitio?.superficie ?? '',
    activo: sitio?.activo ?? true,
  }));
  const [coordenadas, setCoordenadas] = useState(() => aTexto(sitio?.coordenadas ?? []));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = <K extends keyof typeof datos>(campo: K, valor: (typeof datos)[K]) => setDatos((d) => ({ ...d, [campo]: valor }));

  async function ejecutar(accion: () => Promise<void>) {
    setGuardando(true);
    setError(null);
    try {
      await accion();
      onCerrar();
    } catch (e) {
      setError((e as Error).message);
      setGuardando(false);
    }
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    ejecutar(() => onGuardar({ ...datos, coordenadas: deTexto(coordenadas) }, sitio?.id));
  };

  const borrar = () => {
    if (sitio && window.confirm(`¿Eliminar la ficha de "${sitio.nombre}"?`)) ejecutar(() => onEliminar(sitio.id));
  };

  const area = (campo: 'entidad' | 'oficina' | 'ubicacion' | 'superficie', etiqueta: string, filas = 2) => (
    <Campo etiqueta={etiqueta} className="sm:col-span-2">
      <textarea rows={filas} maxLength={1000} value={datos[campo]} onChange={(e) => cambiar(campo, e.target.value)} className={CLASE_CONTROL} />
    </Campo>
  );

  return (
    <Modal
      titulo={sitio ? `Ficha técnica · ${sitio.nombre}` : 'Nueva camaronera o instalación'}
      onCerrar={onCerrar}
      ancho="lg"
      cerrarAlPulsarFuera={false}
      pie={
        <>
          {sitio && !sitio.resultados && (
            <button
              type="button"
              onClick={borrar}
              disabled={guardando}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 size={15} /> Eliminar
            </button>
          )}
          <button
            type="button"
            onClick={onCerrar}
            className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button type="submit" form="form-ficha" disabled={guardando} className={`${BOTON_PRIMARIO} py-2`}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="form-ficha" onSubmit={enviar} className="grid gap-3 sm:grid-cols-2">
        <div className="grid grid-cols-[5rem_1fr] gap-3 sm:col-span-2">
          <Campo etiqueta="N.º informe">
            <input type="number" min={0} max={999} required value={datos.numero} onChange={(e) => cambiar('numero', Number(e.target.value))} className={CLASE_CONTROL} />
          </Campo>
          <Campo etiqueta="Nombre en el informe *">
            <input required maxLength={200} value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} placeholder="Ej. Naturisa S.A. – Isla Josefina" className={CLASE_CONTROL} />
          </Campo>
        </div>
        <Campo etiqueta="Tipo (define los parámetros del efluente)">
          <select value={datos.tipo} onChange={(e) => cambiar('tipo', e.target.value as TipoSitio)} className={CLASE_CONTROL}>
            <option value="camaronera">Camaronera / empacadora (4 parámetros)</option>
            <option value="larvas">Laboratorio de larvas (14 parámetros)</option>
          </select>
        </Campo>
        <Campo etiqueta="Ubicado en (para el Objetivo)">
          <input maxLength={300} value={datos.lugar} onChange={(e) => cambiar('lugar', e.target.value)} placeholder="Ej. la Isla Josefina" className={CLASE_CONTROL} />
        </Campo>

        <p className="mt-1 text-xs font-semibold tracking-wide text-slate-500 uppercase sm:col-span-2">Ficha técnica del proyecto</p>
        {area('entidad', 'Nombre de la entidad promotora del proyecto', 1)}
        <Campo etiqueta="Representante legal">
          <input maxLength={200} value={datos.representante} onChange={(e) => cambiar('representante', e.target.value)} className={CLASE_CONTROL} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="RUC">
            <input maxLength={20} inputMode="numeric" value={datos.ruc} onChange={(e) => cambiar('ruc', e.target.value)} className={CLASE_CONTROL} />
          </Campo>
          <Campo etiqueta="Tipo de proyecto">
            <input maxLength={200} value={datos.tipoProyecto} onChange={(e) => cambiar('tipoProyecto', e.target.value)} className={CLASE_CONTROL} />
          </Campo>
        </div>
        {area('oficina', 'Ubicación de la oficina administrativa')}
        {area('ubicacion', 'Ubicación geográfica del proyecto', 3)}
        <Campo etiqueta="Título de la tabla de coordenadas" className="sm:col-span-2">
          <input maxLength={200} value={datos.coordenadasTitulo} onChange={(e) => cambiar('coordenadasTitulo', e.target.value)} placeholder="Ej. Naturisa – Isla Josefina" className={CLASE_CONTROL} />
        </Campo>
        <Campo etiqueta="Coordenadas UTM (una por línea: punto; latitud N; longitud E)" className="sm:col-span-2">
          <textarea rows={5} value={coordenadas} onChange={(e) => setCoordenadas(e.target.value)} placeholder={'1; 9700000; 600000\n2; 9700100; 600100'} className={`${CLASE_CONTROL} font-mono text-xs`} />
        </Campo>
        {area('superficie', 'Superficie del proyecto')}

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={datos.activo} onChange={(e) => cambiar('activo', e.target.checked)} className="size-4" />
          Activa (aparece para elegir en los resultados nuevos)
        </label>

        {error && <p className="text-sm text-red-600 sm:col-span-2 dark:text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
