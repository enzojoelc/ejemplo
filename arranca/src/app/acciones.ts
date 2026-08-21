"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseDelJugador, supabaseDelServidor } from "@/lib/supabase.ts";
import { exigirJugador } from "@/lib/sesion.ts";
import { ahora, hoy } from "@/lib/ahora.ts";
import { aHoraSql, aDominio } from "@/datos/consultas.ts";
import { estaEnRango } from "@/dominio/horario.ts";
import { aplicar, ReglaViolada, validarPrediccion, type Accion, type Ronda } from "@/dominio/ronda.ts";

export interface Respuesta {
  error?: string;
  ok?: string;
}

/** Guarda o corrige la predicción del jugador. Vale siempre la última versión. */
export async function guardarPrediccion(_previo: Respuesta, datos: FormData): Promise<Respuesta> {
  const jugador = await exigirJugador();
  const horario = Number(datos.get("horario"));

  if (!estaEnRango(horario)) {
    return { error: "La predicción tiene que estar entre las 18:20 y las 20:00." };
  }

  const supabase = await supabaseDelJugador();
  const { data: fila } = await supabase
    .from("rondas")
    .select("id, fecha, horario_teorico, carga_jugador_id, carga_horario, carga_en, confirmacion_jugador_id, confirmacion_en, objecion_jugador_id, objecion_en, correccion_horario, correccion_en, anulacion_motivo, anulacion_en, simulada")
    .eq("fecha", hoy())
    .maybeSingle();

  if (!fila) return { error: "Hoy no hay ronda." };

  try {
    validarPrediccion(aDominio(fila as never), horario, ahora());
  } catch (e) {
    return { error: mensaje(e) };
  }

  const { error } = await supabase.from("predicciones").upsert({
    ronda_id: fila.id,
    jugador_id: jugador.id,
    horario: aHoraSql(horario),
    cargada_en: ahora(),
  });

  if (error) return { error: "No se pudo guardar. Probá de nuevo." };

  revalidatePath("/");
  return { ok: "Predicción guardada." };
}

/** Cargar el horario real, confirmarlo, objetarlo: todo pasa por acá. */
export async function accionSobreRonda(_previo: Respuesta, datos: FormData): Promise<Respuesta> {
  const jugador = await exigirJugador();
  const tipo = String(datos.get("tipo"));
  const rondaId = String(datos.get("rondaId"));
  const horario = Number(datos.get("horario") ?? 0);

  const servidor = supabaseDelServidor();
  const { data: fila } = await servidor.from("rondas").select("*").eq("id", rondaId).maybeSingle();
  if (!fila) return { error: "No se encontró la ronda." };

  const accion = armarAccion(tipo, jugador.id, horario);
  if (!accion) return { error: "Acción desconocida." };
  if ((accion.tipo === "corregir" || accion.tipo === "anular") && !jugador.esAdmin) {
    return { error: "Sólo el admin puede hacer eso." };
  }

  let siguiente: Ronda;
  try {
    siguiente = aplicar(aDominio(fila as never), accion);
  } catch (e) {
    return { error: mensaje(e) };
  }

  const { error } = await servidor.from("rondas").update(aFilas(siguiente)).eq("id", rondaId);
  if (error) return { error: "No se pudo guardar el cambio." };

  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath("/historial");
  return { ok: confirmacionDe(tipo) };
}

function armarAccion(tipo: string, jugadorId: string, horario: number): Accion | null {
  const en = ahora();
  switch (tipo) {
    case "cargar_inicio":
      return { tipo: "cargar_inicio", jugadorId, horario, en };
    case "confirmar":
      return { tipo: "confirmar", jugadorId, en };
    case "objetar":
      return { tipo: "objetar", jugadorId, en };
    case "corregir":
      return { tipo: "corregir", horario, en };
    case "anular":
      return { tipo: "anular", motivo: "Clase suspendida", en };
    default:
      return null;
  }
}

function confirmacionDe(tipo: string): string {
  switch (tipo) {
    case "cargar_inicio":
      return "Horario cargado. Falta que otro jugador lo confirme.";
    case "confirmar":
      return "Confirmado: la ronda quedó resuelta.";
    case "objetar":
      return "Objetada. La ronda queda en disputa hasta que la resuelva el admin.";
    case "corregir":
      return "Horario corregido y puntajes recalculados.";
    default:
      return "Listo.";
  }
}

function aFilas(r: Ronda) {
  return {
    carga_jugador_id: r.carga?.jugadorId ?? null,
    carga_horario: r.carga ? aHoraSql(r.carga.horario) : null,
    carga_en: r.carga?.en ?? null,
    confirmacion_jugador_id: r.confirmacion?.jugadorId ?? null,
    confirmacion_en: r.confirmacion?.en ?? null,
    objecion_jugador_id: r.objecion?.jugadorId ?? null,
    objecion_en: r.objecion?.en ?? null,
    correccion_horario: r.correccion ? aHoraSql(r.correccion.horario) : null,
    correccion_en: r.correccion?.en ?? null,
    anulacion_motivo: r.anulacion?.motivo ?? null,
    anulacion_en: r.anulacion?.en ?? null,
  };
}

function mensaje(e: unknown): string {
  return e instanceof ReglaViolada ? e.message : "Algo salió mal.";
}

/* ------------------------------------------------------------------ acceso */

export async function pedirAcceso(_previo: Respuesta, datos: FormData): Promise<Respuesta> {
  const email = String(datos.get("email") ?? "").trim();
  const nombre = String(datos.get("nombre") ?? "").trim();
  const codigo = String(datos.get("codigo") ?? "").trim();

  if (codigo !== process.env.CODIGO_INVITACION) {
    return { error: "El código de invitación no es correcto." };
  }
  if (nombre.length < 2) return { error: "Poné un nombre para la tabla." };

  const supabase = await supabaseDelJugador();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { nombre },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITIO ?? ""}/auth/callback`,
    },
  });

  if (error) return { error: "No se pudo enviar el mail. Revisá la dirección." };
  return { ok: `Te mandamos un link a ${email}. Abrilo desde este dispositivo.` };
}

export async function salir() {
  const supabase = await supabaseDelJugador();
  await supabase.auth.signOut();
  redirect("/entrar");
}


/* ------------------------------------------------------------------- admin */

/**
 * Carga el calendario del ciclo lectivo desde el texto de la resolución y crea
 * todas las rondas del año de una vez.
 *
 * Muestra primero lo que entendió: si algún año la resolución cambia de
 * formato y la extracción sale torcida, el torneo arrancaría con las fechas
 * mal y nadie se daría cuenta hasta mayo.
 */
export async function importarCalendario(_previo: Respuesta, datos: FormData): Promise<Respuesta> {
  const jugador = await exigirJugador();
  if (!jugador.esAdmin) return { error: "Sólo el admin puede cargar el calendario." };

  const { leerCalendario } = await import("@/dominio/resolucion.ts");
  const { armarTemporada } = await import("@/dominio/calendario.ts");

  let temporada;
  try {
    const calendario = leerCalendario(String(datos.get("resolucion") ?? ""));
    temporada = armarTemporada(calendario, leerPuentes(String(datos.get("puentes") ?? "")));
    if (String(datos.get("confirmado")) !== "si") {
      return {
        ok:
          `Entendí ${temporada.rondas.length} rondas, del ${temporada.rondas[0]?.fecha} al ` +
          `${temporada.cierre}. Revisá y confirmá para crearlas.`,
      };
    }
  } catch (e) {
    return { error: `No se pudo leer la resolución: ${mensaje(e)}` };
  }

  const servidor = supabaseDelServidor();
  const { data: fila, error: errorTemporada } = await servidor
    .from("temporadas")
    .upsert({ anio: temporada.anio }, { onConflict: "anio" })
    .select("id")
    .single();

  if (errorTemporada || !fila) return { error: "No se pudo crear la temporada." };

  const { error } = await servidor.from("rondas").upsert(
    temporada.rondas.map((r) => ({ temporada_id: fila.id, fecha: r.fecha })),
    { onConflict: "temporada_id,fecha", ignoreDuplicates: true },
  );

  if (error) return { error: "No se pudieron crear las rondas." };

  revalidatePath("/");
  return { ok: `Listo: ${temporada.rondas.length} rondas creadas para ${temporada.anio}.` };
}

/** Los puentes se pegan como "2026-03-23 Puente turístico", uno por línea. */
function leerPuentes(texto: string) {
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const [fecha, ...resto] = linea.split(/\s+/);
      return {
        fecha: fecha!,
        motivo: resto.join(" ") || "Puente turístico",
        tipo: "puente" as const,
      };
    })
    .filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.fecha));
}
