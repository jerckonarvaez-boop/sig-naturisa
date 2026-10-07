import { Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { fechaCorta } from '@/utils/fechas';
import { cubreDia } from '../logic/eventos';
import type { Evento } from '../types';
import { EventoChip } from './EventoChip';

interface ModalDiaProps {
  dia: string;
  eventos: Evento[];
  mostrarTipo: boolean;
  onEvento: (evento: Evento) => void;
  onNuevo: (dia: string) => void;
  onCerrar: () => void;
}

/** Todos los eventos de un día (cuando no caben en la celda del mes). */
export function ModalDia({ dia, eventos, mostrarTipo, onEvento, onNuevo, onCerrar }: ModalDiaProps) {
  return (
    <Modal titulo={`Eventos del ${fechaCorta(dia)}`} onCerrar={onCerrar}>
      <div className="flex flex-col gap-1">
        {eventos
          .filter((e) => cubreDia(e, dia))
          .map((e) => (
            <EventoChip key={e.id} evento={e} mostrarTipo={mostrarTipo} onClick={onEvento} />
          ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onCerrar();
          onNuevo(dia);
        }}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline"
      >
        <Plus size={14} /> Nuevo evento este día
      </button>
    </Modal>
  );
}
