"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Route } from "next";
import { supabaseDelJugador, supabaseDelServidor } from "@/lib/supabase.ts";
import { exigirJugador } from "@/lib/sesion.ts";
import { ahora, hoy } from "@/lib/ahora.ts";
import { urlDelSitio } from "@/lib/url.ts";
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

/**
 * La liga es cerrada: para entrar hay que saber el código que circula entre
 * los que cursan. Se valida acá y queda en una cookie del propio navegador,
 * que el callback vuelve a verificar antes de crear la ficha del jugador.
 *
 * La cookie guarda el código, no un "ya validé": así, falsificarla exige
 * conocer el código igual, que es exactamente la barrera que queremos.
 */
export async function validarInvitacion(_previo: Respuesta, datos: FormData): Promise<Respuesta> {
  const codigo = String(datos.get("codigo") ?? "").trim();

  if (!process.env.CODIGO_INVITACION) {
    return { error: "Falta configurar el código de invitación en el servidor." };
  }
  if (codigo !== process.env.CODIGO_INVITACION) {
    return { error: "Ese código no es el correcto." };
  }

  const galleta = await cookies();
  galleta.set("invitacion", codigo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 30,
    path: "/",
  });

  revalidatePath("/entrar");
  return { ok: "Código correcto." };
}

/**
 * Alta con contraseña. Con la confirmación por correo apagada en Supabase,
 * esto devuelve la sesión en el acto y no se envía ningún mail: es el camino
 * que menos piezas externas necesita para una liga de quince personas.
 */
export async function registrarse(_previo: Respuesta, datos: FormData): Promise<Respuesta> {
  const nombre = String(datos.get("nombre") ?? "").trim();
  const email = String(datos.get("email") ?? "").trim();
  const clave = String(datos.get("clave") ?? "");

  if (nombre.length < 2) return { error: "Poné el nombre con el que querés aparecer en la tabla." };
  if (clave.length < 6) return { error: "La contraseña necesita al menos 6 caracteres." };
  if (!(await tieneInvitacion())) return { error: "Primero cargá el código de invitación." };

  const supabase = await supabaseDelJugador();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: clave,
    options: { data: { nombre } },
  });

  if (error) return { error: traducir(error) };

  if (!data.session) {
    return {
      error:
        "Supabase quedó esperando una confirmación por correo. Apagá " +
        "«Confirm email» en Authentication → Providers → Email y probá de nuevo.",
    };
  }

  const alta = await crearFicha(data.user!.id, nombre);
  if (alta) return { error: alta };

  redirect("/");
}

/** Ingreso de quien ya tiene cuenta. */
export async function iniciarSesion(_previo: Respuesta, datos: FormData): Promise<Respuesta> {
  const email = String(datos.get("email") ?? "").trim();
  const clave = String(datos.get("clave") ?? "");

  const supabase = await supabaseDelJugador();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: clave });

  if (error) return { error: traducir(error) };

  // La ficha puede faltar si el alta quedó a medias: se completa al entrar.
  const nombre = (data.user.user_metadata?.nombre as string | undefined)?.trim();
  await crearFicha(data.user.id, nombre || email.split("@")[0] || "Jugador");

  redirect("/");
}

/** Manda a Google. Sólo se ofrece si está configurado. */
export async function entrarConGoogle(): Promise<void> {
  const supabase = await supabaseDelJugador();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await urlDelSitio()}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) redirect("/entrar?fallo=google_no_configurado");

  // El tipado de rutas cubre las internas; ésta es la de Google, que es externa.
  redirect(data.url as Route);
}

async function tieneInvitacion(): Promise<boolean> {
  const galleta = await cookies();
  return Boolean(
    process.env.CODIGO_INVITACION &&
      galleta.get("invitacion")?.value === process.env.CODIGO_INVITACION,
  );
}

/** La ficha del jugador es lo que lo hace existir para el juego. */
async function crearFicha(id: string, nombre: string): Promise<string | null> {
  const servidor = supabaseDelServidor();
  const { error } = await servidor
    .from("jugadores")
    .upsert({ id, nombre: nombre.slice(0, 24) }, { onConflict: "id", ignoreDuplicates: true });
  return error ? "Entraste, pero no se pudo crear tu ficha de jugador." : null;
}

function traducir(error: { message?: string; code?: string }): string {
  const texto = (error.message ?? "").toLowerCase();
  const codigo = error.code ?? "";

  if (codigo === "email_not_confirmed" || texto.includes("not confirmed")) {
    return (
      "Supabase pide confirmar el correo. Apagá «Confirm email» en " +
      "Authentication → Providers → Email."
    );
  }
  if (codigo === "invalid_credentials" || texto.includes("invalid login")) {
    return "Correo o contraseña incorrectos.";
  }
  if (codigo === "user_already_exists" || texto.includes("already registered")) {
    return "Ese correo ya tiene cuenta. Entrá con tu contraseña.";
  }
  if (codigo === "weak_password" || texto.includes("password")) {
    return "Esa contraseña es muy débil: probá con una más larga.";
  }
  if (codigo === "email_address_invalid" || texto.includes("invalid")) {
    return "Ese correo no es válido.";
  }
  if (texto.includes("rate limit")) {
    return "Demasiados intentos seguidos. Esperá un minuto.";
  }
  return error.message ?? "No se pudo completar el ingreso.";
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
