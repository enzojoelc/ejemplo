import { NextResponse } from "next/server";
import { supabaseDelJugador, supabaseDelServidor } from "@/lib/supabase.ts";

/**
 * Vuelta del link mágico. Además de abrir la sesión, crea la ficha del jugador
 * la primera vez: el nombre viaja en los metadatos del alta.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/entrar", url.origin));

  const supabase = await supabaseDelJugador();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) return NextResponse.redirect(new URL("/entrar", url.origin));

  const servidor = supabaseDelServidor();
  const nombre = (data.user.user_metadata?.nombre as string | undefined)?.trim();
  await servidor
    .from("jugadores")
    .upsert(
      { id: data.user.id, nombre: nombre || data.user.email?.split("@")[0] || "Jugador" },
      { onConflict: "id", ignoreDuplicates: true },
    );

  return NextResponse.redirect(new URL("/", url.origin));
}
