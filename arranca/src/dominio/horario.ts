/**
 * Los horarios del juego se manejan como minutos desde la medianoche, en hora
 * de Argentina. Es la representación más simple que permite restar dos horas
 * sin pensar en husos ni en cambios de día: la clase nunca cruza la medianoche.
 */

export type Minutos = number;

/** Horario teórico de la clase. Cada ronda guarda el suyo; hoy siempre es este. */
export const HORARIO_TEORICO: Minutos = 18 * 60 + 20; // 18:20

/** Extremos del rango en que se puede predecir. */
export const RANGO_MINIMO: Minutos = HORARIO_TEORICO; // 18:20
export const RANGO_MAXIMO: Minutos = 20 * 60; // 20:00

/** Hora de cierre de las predicciones. */
export const CIERRE: Minutos = 18 * 60; // 18:00

const FORMATO = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function aMinutos(hhmm: string): Minutos {
  const m = FORMATO.exec(hhmm.trim());
  if (!m) throw new Error(`Horario inválido: "${hhmm}". Se espera HH:MM.`);
  return Number(m[1]) * 60 + Number(m[2]);
}

export function aTexto(minutos: Minutos): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function estaEnRango(minutos: Minutos): boolean {
  return Number.isInteger(minutos) && minutos >= RANGO_MINIMO && minutos <= RANGO_MAXIMO;
}

/** Minutos de demora respecto del horario teórico. Negativo si arrancó antes. */
export function demora(minutos: Minutos, teorico: Minutos = HORARIO_TEORICO): number {
  return minutos - teorico;
}
