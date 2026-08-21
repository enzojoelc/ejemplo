import { BONUS_MAS_CERCANO } from "./puntaje.ts";

/** Una participación es lo que un jugador sacó en una ronda que jugó. */
export interface Participacion {
  rondaId: string;
  jugadorId: string;
  fecha: string; // YYYY-MM-DD de la ronda
  puntos: number;
  error: number;
  exacto: boolean;
  cargadaEn: string; // ISO 8601: cuándo guardó la predicción
}

export interface FilaTabla {
  posicion: number;
  jugadorId: string;
  puntos: number;
  exactos: number;
  errorAcumulado: number;
  rondasJugadas: number;
  descartadas: string[]; // ids de las rondas que no cuentan
}

export interface OpcionesTabla {
  /** Cuántas peores rondas se descartan. Sólo al cierre de la temporada. */
  descartes?: number;
  /** Filtra por mes calendario, formato YYYY-MM. Sin esto, cuenta todo. */
  mes?: string;
}

/**
 * Arma una tabla de posiciones a partir de las participaciones.
 *
 * La tabla no se guarda: se calcula. Es lo que permite que corregir el horario
 * de una ronda dentro de las 24 horas reordene el campeonato sin que haya que
 * tocar ningún acumulado a mano.
 */
export function posiciones(
  participaciones: readonly Participacion[],
  opciones: OpcionesTabla = {},
): FilaTabla[] {
  const { descartes = 0, mes } = opciones;

  const enJuego = mes
    ? participaciones.filter((p) => p.fecha.startsWith(mes))
    : participaciones;

  const porJugador = new Map<string, Participacion[]>();
  for (const p of enJuego) {
    const lista = porJugador.get(p.jugadorId) ?? [];
    lista.push(p);
    porJugador.set(p.jugadorId, lista);
  }

  const filas = [...porJugador.entries()].map(([jugadorId, todas]) => {
    // Los descartes aplican sólo entre rondas jugadas: no cargar nunca se descarta.
    const ordenadasPorPuntaje = [...todas].sort(
      (a, b) => a.puntos - b.puntos || b.error - a.error,
    );
    const descartadas = ordenadasPorPuntaje.slice(0, descartes);
    const idsDescartados = new Set(descartadas.map((p) => p.rondaId));
    const cuentan = todas.filter((p) => !idsDescartados.has(p.rondaId));

    return {
      posicion: 0,
      jugadorId,
      puntos: suma(cuentan.map((p) => p.puntos)),
      exactos: cuentan.filter((p) => p.exacto).length,
      errorAcumulado: suma(cuentan.map((p) => p.error)),
      rondasJugadas: cuentan.length,
      descartadas: descartadas.map((p) => p.rondaId),
      primeraCarga: minimo(todas.map((p) => p.cargadaEn)),
    };
  });

  filas.sort(
    (a, b) =>
      b.puntos - a.puntos ||
      b.exactos - a.exactos ||
      a.errorAcumulado - b.errorAcumulado ||
      a.primeraCarga.localeCompare(b.primeraCarga),
  );

  return filas.map(({ primeraCarga: _, ...fila }, i) => ({ ...fila, posicion: i + 1 }));
}

/** El máximo que se puede sacar en una ronda: acierto exacto siendo el más cercano. */
export const PUNTAJE_MAXIMO_RONDA = 25 + BONUS_MAS_CERCANO;

function suma(ns: readonly number[]): number {
  return ns.reduce((a, b) => a + b, 0);
}

function minimo(ss: readonly string[]): string {
  return ss.reduce((a, b) => (a <= b ? a : b));
}
