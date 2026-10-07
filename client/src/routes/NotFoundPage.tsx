import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';

export function NotFoundPage() {
  return (
    <Card className="py-16 text-center">
      <p className="text-lg font-semibold">Página no encontrada</p>
      <Link to="/" className="mt-3 inline-block text-sm font-medium text-brand-500 hover:underline">
        Volver al Dashboard
      </Link>
    </Card>
  );
}
