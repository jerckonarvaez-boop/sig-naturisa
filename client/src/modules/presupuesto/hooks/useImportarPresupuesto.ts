import { useState } from 'react';
import { leerExcelPresupuesto } from '../logic/leerExcel';
import { importarPresupuesto } from '../services/presupuesto.api';

/** Lee el Excel del presupuesto en el navegador y reemplaza los datos guardados en el servidor. */
export function useImportarPresupuesto() {
  const [importando, setImportando] = useState(false);

  /** Devuelve cuántos registros de gasto se importaron */
  const importar = async (archivo: File): Promise<number> => {
    setImportando(true);
    try {
      const datos = await leerExcelPresupuesto(archivo);
      await importarPresupuesto(datos);
      return datos.gastos.length;
    } finally {
      setImportando(false);
    }
  };

  return { importando, importar };
}
