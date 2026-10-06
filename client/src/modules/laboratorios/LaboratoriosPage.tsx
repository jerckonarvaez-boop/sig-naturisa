import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { meta } from './meta';

// Página principal del módulo. Se reemplazará cuando definamos su contenido.
export function LaboratoriosPage() {
  return <ModulePlaceholder title={meta.label} description={meta.description} />;
}
