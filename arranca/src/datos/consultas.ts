import { supabaseDelJugador } from "@/lib/supabase.ts";
import { hoy } from "@/lib/ahora.ts";
import { aMinutos, type Minutos } from "@/dominio/horario.ts";
import { puntuarRonda, type Prediccion } from "@/dominio/puntaje.ts";
import type { Participacion } from "@/dominio/tabla.ts";
import type { Ronda } from "@/dominio/ronda.ts";

/** Postgres devuelve "18:20:00"; el dominio trabaja en minutos. */
export function deHoraSql(hora: string | null): Minutos | null {
  return hora ? aMinutos(hora.slice(0, 5)) : null;
}

export function aHoraSql(minutos: Minutos): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}:00`;
}

interface FilaRonda {
  id: string;
  fecha: string;
  horario_teorico: string;
  carga_jugador_id: string | null;
  carga_horario: string | null;
  carga_en: string | null;
  confirmacion_jugador_id: string | null;
  confirmacion_en: string | null;
  objecion_jugador_id: string | null;
  objecion_en: string | null;
  correccion_horario: string | null;
  correccion_en: string | null;
  anulacion_motivo: string | null;
  anulacion_en: string | null;
  simulada: boolean;
}

const COLUMNAS_RONDA =
  "id, fecha, horario_teorico, carga_jugador_id, carga_horario, carga_en, confirmacion_jugador_id, confirmacion_en, objecion_jugador_id, objecion_en, correccion_horario, correccion_en, anulacion_motivo, anulacion_en, simulada";

export function aDominio(f: FilaRonda): Ronda {
  return {
    id: f.id,
    fecha: f.fecha,
    horarioTeorico: deHoraSql(f.horario_teorico) ?? aMinutos("18:20"),
    ...(f.carga_jugador_id && f.carga_horario && f.carga_en
      ? {
          carga: {
            jugadorId: f.carga_jugador_id,
            horario: deHoraSql(f.carga_horario)!,
            en: f.carga_en,
          },
        }
      : {}),
    ...(f.confirmacion_jugador_id && f.confirmacion_en
      ? { confirmacion: { jugadorId: f.confirmacion_jugador_id, en: f.confirmacion_en } }
      : {}),
    ...(f.objecion_jugador_id && f.objecion_en
      ? { objecion: { jugadorId: f.objecion_jugador_id, en: f.objecion_en } }
      : {}),
    ...(f.correccion_horario && f.correccion_en
      ? { correccion: { horario: deHoraSql(f.correccion_horario)!, en: f.correccion_en } }
      : {}),
    ...(f.anulacion_motivo && f.anulacion_en
      ? { anulacion: { motivo: f.anulacion_motivo, en: f.anulacion_en } }
      : {}),
    simulada: f.simulada,
  };
}

export interface PrediccionVisible {
  jugadorId: string;
  nombre: string;
  horario: Minutos;
  cargadaEn: string;
}

export interface RondaDeHoy {
  ronda: Ronda;
  /** Nombre de quien cargó el horario, cuando hay carga. */
  cargadaPor: string | null;
  mia: Minutos | null;
  /** Sólo trae las ajenas cuando la ronda está resuelta: lo decide la base. */
  visibles: PrediccionVisible[];
  cuantosCargaron: number;
  totalJugadores: number;
}

export async function rondaDeHoy(jugadorId: string): Promise<RondaDeHoy | null> {
  const supabase = await supabaseDelJugador();

  const { data: fila } = await supabase
    .from("rondas")
    .select(COLUMNAS_RONDA)
    .eq("fecha", hoy())
    .maybeSingle<FilaRonda>();

  if (!fila) return null;
  const ronda = aDominio(fila);

  const [{ data: predicciones }, { count }, { data: quien }] = await Promise.all([
    supabase
      .from("predicciones")
      .select("jugador_id, horario, cargada_en, jugadores(nombre)")
      .eq("ronda_id", ronda.id),
    supabase.from("jugadores").select("id", { count: "exact", head: true }),
    fila.carga_jugador_id
      ? supabase.from("jugadores").select("nombre").eq("id", fila.carga_jugador_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const visibles: PrediccionVisible[] = (predicciones ?? []).map((p) => ({
    jugadorId: p.jugador_id as string,
    nombre: nombreDe(p.jugadores),
    horario: deHoraSql(p.horario as string)!,
    cargadaEn: p.cargada_en as string,
  }));

  return {
    ronda,
    cargadaPor: (quien as { nombre?: string } | null)?.nombre ?? null,
    mia: visibles.find((p) => p.jugadorId === jugadorId)?.horario ?? null,
    visibles,
    // Antes del cierre sólo se ve la propia; el contador viene de la vista pública.
    cuantosCargaron: visibles.length,
    totalJugadores: count ?? 0,
  };
}

/**
 * Todo lo necesario para las tablas de posiciones. Trae las rondas resueltas y
 * sus predicciones, y los puntos se calculan acá: en la base no hay ni un
 * puntaje guardado.
 */
export async function participaciones(): Promise<Participacion[]> {
  const supabase = await supabaseDelJugador();

  const { data: rondas } = await supabase
    .from("rondas")
    .select(COLUMNAS_RONDA)
    .is("anulacion_en", null)
    .eq("simulada", false)
    .order("fecha");

  if (!rondas?.length) return [];

  const resueltas = (rondas as unknown as FilaRonda[])
    .map(aDominio)
    .filter((r) => r.confirmacion || r.correccion || r.carga);

  const { data: predicciones } = await supabase
    .from("predicciones")
    .select("ronda_id, jugador_id, horario, cargada_en")
    .in("ronda_id", resueltas.map((r) => r.id));

  const porRonda = new Map<string, Prediccion[]>();
  const cargadaEn = new Map<string, string>();
  for (const p of predicciones ?? []) {
    const lista = porRonda.get(p.ronda_id as string) ?? [];
    lista.push({ jugadorId: p.jugador_id as string, horario: deHoraSql(p.horario as string)! });
    porRonda.set(p.ronda_id as string, lista);
    cargadaEn.set(`${p.ronda_id}:${p.jugador_id}`, p.cargada_en as string);
  }

  const salida: Participacion[] = [];
  for (const ronda of resueltas) {
    const real = ronda.correccion?.horario ?? ronda.carga?.horario;
    if (real === undefined) continue;

    for (const r of puntuarRonda(porRonda.get(ronda.id) ?? [], real)) {
      salida.push({
        rondaId: ronda.id,
        jugadorId: r.jugadorId,
        fecha: ronda.fecha,
        puntos: r.puntos,
        error: r.error,
        exacto: r.exacto,
        cargadaEn: cargadaEn.get(`${ronda.id}:${r.jugadorId}`) ?? ronda.fecha,
      });
    }
  }
  return salida;
}

export interface FilaHistorial {
  fecha: string;
  real: Minutos | null;
  mia: Minutos | null;
  puntos: number | null;
  anulada: boolean;
}

/**
 * El historial reusa exactamente el mismo cálculo que la tabla, para que los
 * puntos que ve el jugador en su fila sean los que suma el campeonato. Calcular
 * la ronda de a una sola predicción daría un número distinto: el bonus del más
 * cercano necesita ver a todos.
 */
export async function historial(jugadorId: string): Promise<FilaHistorial[]> {
  const supabase = await supabaseDelJugador();
  const [{ data: rondas }, todas, { data: mias }] = await Promise.all([
    supabase.from("rondas").select(COLUMNAS_RONDA).order("fecha", { ascending: false }).limit(60),
    participaciones(),
    supabase.from("predicciones").select("ronda_id, horario").eq("jugador_id", jugadorId),
  ]);

  const miPrediccion = new Map(
    (mias ?? []).map((p) => [p.ronda_id as string, deHoraSql(p.horario as string)!]),
  );
  const misPuntos = new Map(
    todas.filter((p) => p.jugadorId === jugadorId).map((p) => [p.rondaId, p.puntos]),
  );

  return ((rondas ?? []) as unknown as FilaRonda[]).map(aDominio).map((r) => ({
    fecha: r.fecha,
    real: r.anulacion ? null : (r.correccion?.horario ?? r.carga?.horario ?? null),
    mia: miPrediccion.get(r.id) ?? null,
    puntos: misPuntos.get(r.id) ?? null,
    anulada: Boolean(r.anulacion),
  }));
}

function nombreDe(valor: unknown): string {
  if (Array.isArray(valor)) return (valor[0] as { nombre?: string })?.nombre ?? "—";
  return (valor as { nombre?: string } | null)?.nombre ?? "—";
}

/** Los nombres para mostrar, por id. La liga es chica: se traen todos de una. */
export async function nombresDeJugadores(): Promise<Map<string, string>> {
  const supabase = await supabaseDelJugador();
  const { data } = await supabase.from("jugadores").select("id, nombre");
  return new Map((data ?? []).map((j) => [j.id as string, j.nombre as string]));
}
