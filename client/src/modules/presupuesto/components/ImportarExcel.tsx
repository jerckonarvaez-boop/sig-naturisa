import { useRef, useState } from 'react';
import { FileSpreadsheet, LoaderCircle } from 'lucide-react';
import { importarPresupuesto } from '../services/presupuesto.api';
import { leerExcelPresupuesto } from '../logic/leerExcel';
import { miles } from '../formato';

interface ImportarExcelProps {
  onImportado: (mensaje: string) => void;
  onError: (mensaje: string) => void;
}

/** Botón que lee el Excel del presupuesto y reemplaza los datos guardados. */
export function ImportarExcel({ onImportado, onError }: ImportarExcelProps) {
  const input = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);

  async function importar(archivo: File | undefined) {
    if (!archivo) return;
    setImportando(true);
    try {
      const datos = await leerExcelPresupuesto(archivo);
      await importarPresupuesto(datos);
      onImportado(`Listo: se importaron ${miles(datos.gastos.length)} registros de «${archivo.name}».`);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setImportando(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={importando}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-progress disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500"
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
