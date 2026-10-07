import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getHealth } from '@/services/api/client';

type ConnectionState = 'verificando' | 'conectado' | 'desconectado';

const BADGES: Record<ConnectionState, { label: string; tone: 'success' | 'danger' | 'neutral' }> = {
  verificando: { label: 'Verificando', tone: 'neutral' },
  conectado: { label: 'Conectado', tone: 'success' },
  desconectado: { label: 'Desconectado', tone: 'danger' },
};

export function SystemStatusCard() {
  const [api, setApi] = useState<ConnectionState>('verificando');
  const [database, setDatabase] = useState<ConnectionState>('verificando');

  useEffect(() => {
    getHealth()
      .then((health) => {
        setApi('conectado');
        setDatabase(health.database === 'ok' ? 'conectado' : 'desconectado');
      })
      .catch(() => {
        setApi('desconectado');
        setDatabase('desconectado');
      });
  }, []);

  const rows = [
    { label: 'API', state: api },
    { label: 'Base de datos', state: database },
  ];

  return (
    <Card title="Estado del sistema">
      <ul className="space-y-3">
        {rows.map(({ label, state }) => (
          <li key={label} className="flex items-center justify-between text-sm">
            <span>{label}</span>
            <StatusBadge {...BADGES[state]} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
