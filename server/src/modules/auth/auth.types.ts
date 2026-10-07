/** Usuario con sesión iniciada (lo que se guarda en la cookie de sesión) */
export interface Usuario {
  username: string;
  nombre: string;
}

/** Resultado de validar usuario y contraseña contra el servicio corporativo */
export type ResultadoValidacion = { ok: true; usuario: Usuario } | { ok: false; status: number; error: string };
