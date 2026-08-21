import { NextResponse } from "next/server";
import { supabaseDelServidor } from "@/lib/supabase.ts";
import { hoy } from "@/lib/ahora.ts";

/**
 * Recordatorio de las 17:00, una hora antes del cierre.
 *
 * Le llega sólo a quien todavía no cargó: es el único mail que manda la app, y
 * mandarle a quien ya jugó es la forma más rápida de que la gente lo marque
 * como spam.
 */
export async function GET(request: Request) {
  const esperado = process.env.CRON_SECRET;
  if (esperado && request.headers.get("authorization") !== `Bearer ${esperado}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const supabase = supabaseDelServidor();
  const fecha = hoy();

  const { data: ronda } = await supabase
    .from("rondas")
    .select("id")
    .eq("fecha", fecha)
    .is("anulacion_en", null)
    .eq("simulada", false)
    .maybeSingle();

  if (!ronda) return NextResponse.json({ enviados: 0, motivo: "hoy no hay ronda" });

  const [{ data: jugadores }, { data: predicciones }] = await Promise.all([
    supabase.auth.admin.listUsers(),
    supabase.from("predicciones").select("jugador_id").eq("ronda_id", ronda.id),
  ]);

  const yaJugaron = new Set((predicciones ?? []).map((p) => p.jugador_id as string));
  const faltan = (jugadores?.users ?? []).filter((u) => u.email && !yaJugaron.has(u.id));

  const clave = process.env.RESEND_API_KEY;
  if (!clave) return NextResponse.json({ enviados: 0, faltan: faltan.length, motivo: "sin RESEND_API_KEY" });

  const sitio = process.env.NEXT_PUBLIC_SITIO ?? "";
  let enviados = 0;

  for (const usuario of faltan) {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${clave}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_DESDE ?? "arranca@example.com",
        to: usuario.email,
        subject: "¿A qué hora arranca hoy?",
        text:
          `Todavía no cargaste tu predicción de hoy.\n\n` +
          `Cierra a las 18:00, dentro de una hora.\n\n${sitio}\n`,
      }),
    });
    if (respuesta.ok) enviados += 1;
  }

  return NextResponse.json({ enviados, faltan: faltan.length });
}
