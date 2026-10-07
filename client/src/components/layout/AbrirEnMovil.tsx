import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone } from 'lucide-react';
import { apiGet } from '@/services/api/client';
import { Modal } from '../ui/Modal';

/** Botón del encabezado: muestra un código QR para abrir la plataforma en el móvil. */
export function AbrirEnMovil() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-white/10 md:inline-flex"
        title="Abrir en el móvil"
      >
        <Smartphone size={17} /> Abrir en el móvil
      </button>
      {abierto && <ModalQR onCerrar={() => setAbierto(false)} />}
    </>
  );
}

function ModalQR({ onCerrar }: { onCerrar: () => void }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [url, setUrl] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si ya se abrió desde otra dirección (no localhost), se usa esa
    const actual = window.location.hostname === 'localhost' ? null : window.location.origin;
    apiGet<{ urls: string[] }>('/health/red')
      .then(({ urls }) => {
        const lista = actual ? [actual, ...urls.filter((u) => u !== actual)] : urls;
        setUrls(lista);
        setUrl(lista[0] ?? null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (url) QRCode.toDataURL(url, { width: 220, margin: 1 }).then(setQr);
  }, [url]);

  return (
    <Modal titulo="Abrir en el móvil" onCerrar={onCerrar}>
      {error ? (
        <p className="text-sm text-red-600">No se pudo obtener la dirección de red: {error}</p>
      ) : !url ? (
        <p className="text-sm text-slate-500">Este equipo no está conectado a ninguna red.</p>
      ) : (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          {qr && <img src={qr} alt={`Código QR de ${url}`} className="h-52 w-52 rounded-lg bg-white p-1" />}
          <div className="text-sm">
            <p className="mb-1 font-semibold">Escanee el código con la cámara del móvil</p>
            {urls.length > 1 ? (
              <select value={url} onChange={(e) => setUrl(e.target.value)} className="mb-2 rounded border border-slate-300 px-2 py-1 font-mono text-xs dark:border-slate-700 dark:bg-slate-950">
                {urls.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            ) : (
              <p className="mb-2 font-mono text-xs break-all text-brand-500">{url}</p>
            )}
            <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-300">
              <li>El móvil debe estar en la <b>misma red Wi-Fi</b> que este equipo.</li>
              <li>
                <b>iPhone:</b> en Safari pulse Compartir ▸ <i>Agregar a pantalla de inicio</i>.
              </li>
              <li>
                <b>Android:</b> en Chrome pulse ⋮ ▸ <i>Agregar a la pantalla principal</i>.
              </li>
              <li>Si no abre, el firewall de este equipo o de la red está bloqueando el acceso.</li>
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}
