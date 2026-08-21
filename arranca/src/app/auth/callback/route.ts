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

  const supabase = await supabaseDelJugador();

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo ?? "magiclink" })
      : { data: { user: null }, error: new Error("El link no trae ningún dato de acceso.") };

  if (error || !data.user) {
    return NextResponse.redirect(new URL(`/entrar?fallo=${motivo(error)}`, url.origin));
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

/** Un motivo corto en la URL: sin esto, un link vencido y uno mal configurado se ven igual. */
function motivo(error: unknown): string {
  const texto = error instanceof Error ? error.message.toLowerCase() : "";
  if (texto.includes("expired")) return "vencido";
  if (texto.includes("invalid") || texto.includes("used")) return "usado";
  return "desconocido";
}
