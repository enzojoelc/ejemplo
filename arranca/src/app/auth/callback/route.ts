import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseDelJugador, supabaseDelServidor } from "@/lib/supabase.ts";

/**
 * Vuelta del link del correo. Además de abrir la sesión, crea la ficha del
 * jugador la primera vez: el nombre viaja en los metadatos del alta.
 *
 * Acepta las dos formas en que Supabase puede devolver al usuario —el código
 * de intercambio y el token del correo— porque cuál de las dos llega depende
 * de la plantilla del mail, que se edita desde el panel y no desde acá.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;

  // Supabase también puede devolver el error directamente en la dirección.
  const errorDeSupabase =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");

  const supabase = await supabaseDelJugador();

  const { data, error } = errorDeSupabase
    ? { data: { user: null }, error: new Error(errorDeSupabase) }
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo ?? "magiclink" })
        : { data: { user: null }, error: null };

  if (error || !data.user) {
    // El detalle viaja en la dirección para que el jugador pueda leerlo y
    // pasarlo: sin esto, todos los fallos distintos se ven exactamente igual.
    const destino = new URL("/entrar", url.origin);
    destino.searchParams.set("fallo", motivo(error, code, tokenHash));
    destino.searchParams.set("via", code ? "codigo" : tokenHash ? "token" : "nada");
    if (error?.message) destino.searchParams.set("detalle", error.message.slice(0, 160));
    return NextResponse.redirect(destino);
  }

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

function motivo(error: unknown, code: string | null, tokenHash: string | null): string {
  if (!error && !code && !tokenHash) return "sin_datos";

  const texto = error instanceof Error ? error.message.toLowerCase() : "";
  if (texto.includes("expired")) return "vencido";
  if (texto.includes("code verifier") || texto.includes("code challenge")) return "otro_navegador";
  if (texto.includes("invalid") || texto.includes("used")) return "usado";
  return "desconocido";
}
