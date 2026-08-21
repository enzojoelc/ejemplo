import { redirect } from "next/navigation";
import { supabaseDelJugador } from "./supabase.ts";

export interface Jugador {
  id: string;
  nombre: string;
  esAdmin: boolean;
}

export async function jugadorActual(): Promise<Jugador | null> {
  const supabase = await supabaseDelJugador();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) return null;

  const { data } = await supabase
    .from("jugadores")
    .select("id, nombre, es_admin")
    .eq("id", sesion.user.id)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, nombre: data.nombre, esAdmin: data.es_admin };
}

/** Para las pantallas del juego: sin sesión no hay nada que ver. */
export async function exigirJugador(): Promise<Jugador> {
  const jugador = await jugadorActual();
  if (!jugador) redirect("/entrar");
  return jugador;
}
