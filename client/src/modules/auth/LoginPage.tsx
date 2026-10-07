import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { APP_CONFIG } from '@/config/app';

interface LoginPageProps {
  onIngresar: (username: string, password: string) => Promise<void>;
  errorInicial?: string;
}

/** Pantalla de inicio de sesión con las credenciales corporativas de Naturisa. */
export function LoginPage({ onIngresar, errorInicial }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(errorInicial ?? null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await onIngresar(username.trim().toLowerCase(), password);
    } catch (err) {
      setError((err as Error).message);
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 to-brand-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-white">
          <Logo />
          <p className="mt-3 text-lg font-bold">{APP_CONFIG.name}</p>
          <p className="text-sm text-white/70">{APP_CONFIG.subtitle}</p>
        </div>

        <form onSubmit={enviar} className="rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <h1 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <LockKeyhole size={18} className="text-brand-500" /> Iniciar sesión
          </h1>
          <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">Use su usuario y contraseña corporativos de Naturisa.</p>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Usuario</span>
            <input
              required
              autoFocus
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. jperez"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Contraseña</span>
            <span className="relative block">
              <input
                required
                type={verClave ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-10 pl-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={() => setVerClave((v) => !v)}
                aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
              >
                {verClave ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500"
          >
            {enviando && <LoaderCircle size={16} className="animate-spin" />}
            {enviando ? 'Validando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
