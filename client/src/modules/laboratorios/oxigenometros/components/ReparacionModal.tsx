import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Modal } from '@/components/ui/Modal';
import { hoyISO } from '@/utils/fechas';
import { dinero, porcentaje } from '@/utils/numeros';
import { ESTADOS, ESTADOS_ORDEN } from '../config';
import type { SugerenciasReparacion } from '../logic/ahorro';
import type { EstadoReparacion, Reparacion, ReparacionDatos } from '../types';

interface ReparacionModalProps {
  /** Reparación a editar; si no se indica, se registra una nueva */
  reparacion?: Reparacion;
  sugerencias: SugerenciasReparacion;
  onGuardar: (datos: ReparacionDatos, id?: number) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
  onCerrar: () => void;
}

/** Los montos se editan como texto para permitir dejar el campo vacío mientras se escribe */
type Formulario = Omit<ReparacionDatos, 'cantidad' | 'costoReparacion' | 'precioNuevo'> & {
  cantidad: string;
  costoReparacion: string;
  precioNuevo: string;
};

const numero = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(',', '.')));

/** Formulario para registrar o editar la reparación de una parte de oxigenómetro. */
export function ReparacionModal({ reparacion, sugerencias, onGuardar, onEliminar, onCerrar }: ReparacionModalProps) {
  const [datos, setDatos] = useState<Formulario>(() => ({
    fecha: reparacion?.fecha ?? hoyISO(),
    parte: reparacion?.parte ?? '',
    cantidad: String(reparacion?.cantidad ?? 1),
    equipo: reparacion?.equipo ?? '',
    sucursal: reparacion?.sucursal ?? '',
    trabajo: reparacion?.trabajo ?? '',
    costoReparacion: reparacion ? String(reparacion.costoReparacion) : '',
    precioNuevo: reparacion ? String(reparacion.precioNuevo) : '',
    estado: reparacion?.estado ?? 'reparado',
    responsable: reparacion?.responsable ?? '',
    observaciones: reparacion?.observaciones ?? '',
  }));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => setDatos((d) => ({ ...d, [campo]: valor }));

  /** Al elegir una parte ya registrada, propone sus últimos precios si aún no se han escrito */
  const cambiarParte = (parte: string) =>
    setDatos((d) => {
      const previo = sugerencias.ultimoPrecio.get(parte.trim().toLowerCase());
      if (!previo || d.precioNuevo || d.costoReparacion) return { ...d, parte };
      return { ...d, parte, precioNuevo: String(previo.precioNuevo), costoReparacion: String(previo.costoReparacion) };
    });

  const cantidad = numero(datos.cantidad);
  const costo = numero(datos.costoReparacion);
  const nuevo = numero(datos.precioNuevo);
  const ahorro = (nuevo - costo) * cantidad;
  const calculable = [cantidad, costo, nuevo].every(Number.isFinite);

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

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!calculable) {
      setError('Complete la cantidad, el costo de la reparación y el precio de la parte nueva.');
      return;
    }
    ejecutar(() => onGuardar({ ...datos, cantidad, costoReparacion: costo, precioNuevo: nuevo }, reparacion?.id));
  }

  function borrar() {
    if (reparacion && window.confirm(`¿Eliminar la reparación de "${reparacion.parte}"? Esta acción no se puede deshacer.`)) {
      ejecutar(() => onEliminar(reparacion.id));
    }
  }

  return (
    <Modal
      titulo={reparacion ? 'Editar reparación' : 'Registrar reparación'}
      onCerrar={onCerrar}
      ancho="lg"
      pie={
        <>
          {reparacion && (
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
          <button type="submit" form="form-reparacion" disabled={guardando} className={`${BOTON_PRIMARIO} py-2`}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="form-reparacion" onSubmit={enviar} className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Parte reparada *">
          <input
            required
            autoFocus
            list="partes-oxigenometro"
            maxLength={120}
            value={datos.parte}
            onChange={(e) => cambiarParte(e.target.value)}
            placeholder="Ej. Sonda / sensor"
            className={CLASE_CONTROL}
          />
          <Sugerencias id="partes-oxigenometro" valores={sugerencias.partes} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Cantidad *">
            <input type="number" required min={1} max={1000} step={1} value={datos.cantidad} onChange={(e) => cambiar('cantidad', e.target.value)} className={CLASE_CONTROL} />
          </Campo>
          <Campo etiqueta="Fecha *">
            <input type="date" required value={datos.fecha} onChange={(e) => cambiar('fecha', e.target.value)} className={CLASE_CONTROL} />
          </Campo>
        </div>

        <Campo etiqueta="Costo de reparar (USD por unidad) *">
          <input
            type="number"
            required
            min={0}
            step="0.01"
            inputMode="decimal"
            value={datos.costoReparacion}
            onChange={(e) => cambiar('costoReparacion', e.target.value)}
            placeholder="Repuestos + mano de obra"
            className={CLASE_CONTROL}
          />
        </Campo>
        <Campo etiqueta="Precio de la parte nueva (USD por unidad) *">
          <input
            type="number"
            required
            min={0}
            step="0.01"
            inputMode="decimal"
            value={datos.precioNuevo}
            onChange={(e) => cambiar('precioNuevo', e.target.value)}
            placeholder="Lo que costaría comprarla"
            className={CLASE_CONTROL}
          />
        </Campo>

        {/* Ahorro calculado en vivo */}
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm sm:col-span-2 dark:bg-slate-800/50">
          {!calculable ? (
            <span className="text-slate-500 dark:text-slate-400">El ahorro se calcula al completar cantidad y montos.</span>
          ) : datos.estado !== 'reparado' ? (
            <span className="text-slate-500 dark:text-slate-400">
              El ahorro ({dinero(ahorro, 2)}) se contará cuando la parte quede <b>reparada</b>.
            </span>
          ) : (
            <span>
              Ahorro: <b className={ahorro < 0 ? 'text-red-600 dark:text-red-400' : ''}>{dinero(ahorro, 2)}</b>
              {nuevo > 0 && ` · ${porcentaje(ahorro / (nuevo * cantidad))} menos que comprar nueva`}
              {ahorro < 0 && ' (reparar costó más que comprar nueva)'}
            </span>
          )}
        </div>

        <Campo etiqueta="Estado">
          <select value={datos.estado} onChange={(e) => cambiar('estado', e.target.value as EstadoReparacion)} className={CLASE_CONTROL}>
            {ESTADOS_ORDEN.map((e) => (
              <option key={e} value={e}>
                {ESTADOS[e].label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Equipo (modelo / serie)">
          <input list="equipos-oxigenometro" maxLength={120} value={datos.equipo} onChange={(e) => cambiar('equipo', e.target.value)} placeholder="Ej. YSI ProODO · 21A100123" className={CLASE_CONTROL} />
          <Sugerencias id="equipos-oxigenometro" valores={sugerencias.equipos} />
        </Campo>
        <Campo etiqueta="Sucursal / finca">
          <input list="sucursales-oxigenometro" maxLength={120} value={datos.sucursal} onChange={(e) => cambiar('sucursal', e.target.value)} className={CLASE_CONTROL} />
          <Sugerencias id="sucursales-oxigenometro" valores={sugerencias.sucursales} />
        </Campo>
        <Campo etiqueta="Responsable">
          <input list="responsables-oxigenometro" maxLength={120} value={datos.responsable} onChange={(e) => cambiar('responsable', e.target.value)} className={CLASE_CONTROL} />
          <Sugerencias id="responsables-oxigenometro" valores={sugerencias.responsables} />
        </Campo>

        <Campo etiqueta="Trabajo realizado" className="sm:col-span-2">
          <textarea
            rows={2}
            maxLength={1000}
            value={datos.trabajo}
            onChange={(e) => cambiar('trabajo', e.target.value)}
            placeholder="Ej. Cambio de conector y soldadura del cable"
            className={CLASE_CONTROL}
          />
        </Campo>
        <Campo etiqueta="Observaciones" className="sm:col-span-2">
          <textarea rows={2} maxLength={2000} value={datos.observaciones} onChange={(e) => cambiar('observaciones', e.target.value)} className={CLASE_CONTROL} />
        </Campo>

        {error && <p className="text-sm text-red-600 sm:col-span-2 dark:text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}

function Sugerencias({ id, valores }: { id: string; valores: string[] }) {
  return (
    <datalist id={id}>
      {valores.map((v) => (
        <option key={v} value={v} />
      ))}
    </datalist>
  );
}
