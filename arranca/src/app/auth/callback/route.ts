import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseDelJugador, supabaseDelServidor } from "@/lib/supabase.ts";

/**
 * Vuelta de Google. Abre la sesión y, la primera vez, crea la ficha del
 * jugador: ahí es donde se exige el código de invitación, no antes. Tener
 * cuenta de Google no alcanza para entrar a la liga.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorDeGoogle = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (errorDeGoogle || !code) {
    return NextResponse.redirect(fallo(url.origin, "google", errorDeGoogle));
  }

  const supabase = await supabaseDelJugador();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(fallo(url.origin, "sesion", error?.message ?? null));
  }

  const servidor = supabaseDelServidor();
  const { data: yaEsta } = await servidor
    .from("jugadores")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!yaEsta) {
    const galleta = await cookies();
    const invitacion = galleta.get("invitacion")?.value;

    if (!invitacion || invitacion !== process.env.CODIGO_INVITACION) {
      // Entró a Google pero no tiene invitación: se cierra la sesión para que
      // no quede a medio camino, con cuenta pero sin ficha.
      await supabase.auth.signOut();
      return NextResponse.redirect(fallo(url.origin, "sin_invitacion", null));
    }

    const { error: alta } = await servidor.from("jugadores").insert({
      id: data.user.id,
      nombre: nombreDe(data.user.user_metadata, data.user.email),
    });

    if (alta) return NextResponse.redirect(fallo(url.origin, "alta", alta.message));
    galleta.delete("invitacion");
  }

  return NextResponse.redirect(new URL("/", url.origin));
}

/** El nombre sale del perfil de Google: es el que van a ver los demás en la tabla. */
function nombreDe(metadatos: Record<string, unknown>, email: string | undefined): string {
  const completo =
    (metadatos.full_name as string | undefined) ??
    (metadatos.name as string | undefined) ??
    (metadatos.given_name as string | undefined);

  const primero = completo?.trim().split(/\s+/)[0];
  return (primero || email?.split("@")[0] || "Jugador").slice(0, 24);
}

function fallo(origen: string, motivo: string, detalle: string | null): URL {
  const destino = new URL("/entrar", origen);
  destino.searchParams.set("fallo", motivo);
  if (detalle) destino.searchParams.set("detalle", detalle.slice(0, 160));
  return destino;
}
