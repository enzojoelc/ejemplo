import type { Minutos } from "./horario.ts";

/**
 * La escalera de puntos. El error es la diferencia en minutos entre lo predicho
 * y la hora real de inicio, en cualquier dirección.
 *
 * Está escrita como una lista de tramos y no como una fórmula porque el
 * reglamento es una lista de tramos: si algún día se cambia un escalón, se
 * cambia acá y en ningún otro lado.
 */
export const ESCALERA: ReadonlyArray<{ hasta: number; puntos: number }> = [
  { hasta: 0, puntos: 25 },
  { hasta: 1, puntos: 18 },
  { hasta: 2, puntos: 15 },
  { hasta: 3, puntos: 12 },
  { hasta: 5, puntos: 10 },
  { hasta: 10, puntos: 6 },
  { hasta: 15, puntos: 3 },
];

/** Puntos extra para quien queda más cerca de la hora real. Se comparte en caso de empate. */
export const BONUS_MAS_CERCANO = 5;

export function puntosPorError(error: number): number {
  const e = Math.abs(error);
  for (const tramo of ESCALERA) {
    if (e <= tramo.hasta) return tramo.puntos;
  }
  return 0;
}

export interface Prediccion {
  jugadorId: string;
  horario: Minutos;
}

export interface ResultadoJugador {
  jugadorId: string;
  horario: Minutos;
  error: number;
  puntosEscalera: number;
  bonus: number;
  puntos: number;
  masCercano: boolean;
  exacto: boolean;
}

/**
 * Puntaje de una ronda resuelta. Devuelve un resultado por predicción,
 * ordenado de menor a mayor error; a igual error, por orden de llegada.
 *
 * No recibe a los jugadores que no predijeron: no jugar es no tener fila,
 * y vale cero por ausencia de resultado, no por un cero guardado.
 */
export function puntuarRonda(
  predicciones: readonly Prediccion[],
  horaReal: Minutos,
): ResultadoJugador[] {
  if (predicciones.length === 0) return [];

  const conError = predicciones.map((p) => ({
    ...p,
    error: Math.abs(p.horario - horaReal),
  }));

  const menorError = Math.min(...conError.map((p) => p.error));

  return conError
    .map((p) => {
      const masCercano = p.error === menorError;
      const puntosEscalera = puntosPorError(p.error);
      const bonus = masCercano ? BONUS_MAS_CERCANO : 0;
      return {
        jugadorId: p.jugadorId,
        horario: p.horario,
        error: p.error,
        puntosEscalera,
        bonus,
        puntos: puntosEscalera + bonus,
        masCercano,
        exacto: p.error === 0,
      };
    })
    .sort((a, b) => a.error - b.error);
}
