import { useRef } from 'react';
import { FileSpreadsheet, LoaderCircle } from 'lucide-react';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { miles } from '@/utils/numeros';
import { useImportarPresupuesto } from '../hooks/useImportarPresupuesto';

interface ImportarExcelProps {
  onImportado: (mensaje: string) => void;
  onError: (mensaje: string) => void;
}

/** Botón que lee el Excel del presupuesto y reemplaza los datos guardados. */
export function ImportarExcel({ onImportado, onError }: ImportarExcelProps) {
  const input = useRef<HTMLInputElement>(null);
  const { importando, importar: importarArchivo } = useImportarPresupuesto();

  async function importar(archivo: File | undefined) {
    if (!archivo) return;
    try {
      const registros = await importarArchivo(archivo);
      onImportado(`Listo: se importaron ${miles(registros)} registros de «${archivo.name}».`);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      if (input.current) input.current.value = '';
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={importando}
        className={`${BOTON_PRIMARIO} inline-flex items-center gap-2 py-2 shadow-sm disabled:cursor-progress`}
      >
        {importando ? <LoaderCircle size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
        {importando ? 'Importando…' : 'Importar Excel'}
      </button>
      <input
        ref={input}
        type="file"
        accept=".xlsx,.xlsm"
        hidden
        onChange={(e) => importar(e.target.files?.[0])}
      />
    </>
  );
}
