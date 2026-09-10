import { createClient } from "@supabase/supabase-js";
import { hoy } from "@/lib/ahora.ts";
import { Encabezado } from "@/componentes/Encabezado.tsx";

export const dynamic = "force-dynamic";

interface Chequeo {
  nombre: string;
  ok: boolean;
  detalle: string;
  arreglo?: string;
}

/**
 * Diagnóstico de la instalación.
 *
 * Existe porque durante la puesta en marcha todo falla igual —una pantalla que
 * no anda— y la causa puede estar en tres lugares distintos. Esta página dice
 * cuál de los tres, sin pedirle a nadie que lea registros ni pregunte.
 */
export default async function Estado() {
  const chequeos: Chequeo[] = [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const servicio = process.env.SUPABASE_SERVICE_ROLE_KEY;

  chequeos.push({
    nombre: "Variables de Supabase",
    ok: Boolean(url && anon && servicio),
    detalle: [
      url ? "URL ✓" : "falta URL",
      anon ? "clave anon ✓" : "falta clave anon",
      servicio ? "clave de servicio ✓" : "falta clave de servicio",
    ].join(" · "),
    arreglo: "Vercel → Settings → Environment Variables, y volver a desplegar.",
  });

  chequeos.push({
    nombre: "Código de invitación",
    ok: Boolean(process.env.CODIGO_INVITACION),
    detalle: process.env.CODIGO_INVITACION ? "configurado" : "sin configurar: nadie puede entrar",
    arreglo: "Agregar CODIGO_INVITACION en Vercel.",
  });

  chequeos.push({
    nombre: "Admin por correo",
    ok: Boolean(process.env.ADMIN_EMAIL),
    detalle: process.env.ADMIN_EMAIL
      ? "configurado"
      : "opcional: sin esto hay que marcar el admin con SQL",
    arreglo: "Agregar ADMIN_EMAIL en Vercel con tu correo.",
  });

  if (url && servicio) {
    // Esta página es la que se mira cuando nada anda: si la base no contesta
    // tiene que decirlo, no caerse con ella.
    try {
    const supabase = createClient(url, servicio, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: errorTablas, count: jugadores } = await supabase
      .from("jugadores")
      .select("id", { count: "exact", head: true });

    chequeos.push({
      nombre: "Tablas creadas",
      ok: !errorTablas,
      detalle: errorTablas ? errorTablas.message : "el esquema está aplicado",
      arreglo: "Correr supabase/schema.sql en el SQL Editor de Supabase.",
    });

    if (!errorTablas) {
      const { count: rondas } = await supabase
        .from("rondas")
        .select("id", { count: "exact", head: true });

      const { data: laDeHoy } = await supabase
        .from("rondas")
        .select("fecha")
        .eq("fecha", hoy())
        .maybeSingle();

      const { data: proxima } = await supabase
        .from("rondas")
        .select("fecha")
        .gte("fecha", hoy())
        .order("fecha")
        .limit(1)
        .maybeSingle();

      chequeos.push({
        nombre: "Temporada creada",
        ok: (rondas ?? 0) > 0,
        detalle: (rondas ?? 0) > 0 ? `${rondas} rondas cargadas` : "todavía no hay rondas",
        arreglo: "Entrar a /admin y tocar «Crear la temporada 2026».",
      });

      chequeos.push({
        nombre: "Jugadores",
        ok: (jugadores ?? 0) > 0,
        detalle:
          (jugadores ?? 0) > 0
            ? `${jugadores} anotado${jugadores === 1 ? "" : "s"}`
            : "nadie creó su cuenta todavía",
        arreglo: "Crear la primera cuenta desde /entrar.",
      });

      if ((rondas ?? 0) > 0) {
        chequeos.push({
          nombre: "Ronda de hoy",
          ok: true,
          detalle: laDeHoy
            ? `hay ronda hoy (${laDeHoy.fecha})`
            : `hoy no se juega · próxima: ${proxima?.fecha ?? "ninguna"}`,
        });
      }
    }
    } catch (e) {
      chequeos.push({
        nombre: "Conexión con Supabase",
        ok: false,
        detalle: e instanceof Error ? e.message : "no se pudo conectar",
        arreglo: "Revisar que NEXT_PUBLIC_SUPABASE_URL apunte al proyecto y volver a desplegar.",
      });
    }
  }

  const listo = chequeos.every((c) => c.ok || c.nombre === "Admin por correo");

  return (
    <div className="app">
      <Encabezado titulo="Estado del sistema" derecha={listo ? "Listo" : "Falta algo"} />
      <main className="cuerpo">
        <div className={`aviso ${listo ? "" : "mal"}`}>
          <span className="k">{listo ? "Todo en orden" : "Falta configurar"}</span>
          <p className="cita">
            {listo
              ? "El juego está andando. Si nadie cargó su predicción todavía, empezá vos."
              : "Abajo está lo que falta, en orden. Cada punto dice dónde se arregla."}
          </p>
        </div>

        <div className="caja suave">
          <div className="cab">
            <span>Chequeos</span>
            <span>
              {chequeos.filter((c) => c.ok).length} / {chequeos.length}
            </span>
          </div>
          <div className="interior" style={{ gap: 0, padding: "4px 13px 10px" }}>
            {chequeos.map((c) => (
              <div
                key={c.nombre}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  padding: "11px 0",
                  borderBottom: "1px dotted var(--line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span
                    className="num"
                    style={{ color: c.ok ? "var(--ver)" : "var(--nar)", width: 16 }}
                  >
                    {c.ok ? "✓" : "✗"}
                  </span>
                  <span className="nom">{c.nombre}</span>
                </div>
                <span className="k" style={{ paddingLeft: 24, textTransform: "none" }}>
                  {c.detalle}
                </span>
                {!c.ok && c.arreglo ? (
                  <span
                    style={{
                      paddingLeft: 24,
                      fontFamily: "var(--disp)",
                      fontSize: 12.5,
                      color: "var(--nar)",
                    }}
                  >
                    {c.arreglo}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <p className="p" style={{ fontSize: 12 }}>
          Esta página no muestra ninguna clave: sólo si están puestas o no.
        </p>
      </main>
    </div>
  );
}
