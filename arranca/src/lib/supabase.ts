import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const url = () => requerir("NEXT_PUBLIC_SUPABASE_URL");
const anon = () => requerir("NEXT_PUBLIC_SUPABASE_ANON_KEY");

function requerir(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}.`);
  return valor;
}

/** Cliente con la sesión del jugador. Todo lo que lee pasa por las políticas de la base. */
export async function supabaseDelJugador() {
  const store = await cookies();
  return createServerClient(url(), anon(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (nuevas) => {
        try {
          for (const { name, value, options } of nuevas) store.set(name, value, options);
        } catch {
          // Un Server Component no puede escribir cookies; el middleware las refresca.
        }
      },
    },
  });
}

/**
 * Cliente con permisos totales, sólo para las escrituras sobre la ronda
 * (cargar el horario, confirmar, objetar, corregir). Las reglas del juego se
 * aplican en el servidor antes de escribir: la base no puede expresarlas todas.
 */
export function supabaseDelServidor() {
  return createClient(url(), requerir("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
