/**
 * El reloj de la aplicación, en un solo lugar.
 *
 * Existe para el modo simulación: correr una ronda entera lleva días de reloj
 * real, y sin poder mover la hora cada corrección de un error costaría media
 * semana de espera hasta la clase siguiente.
 */
export function ahora(): string {
  const simulada = process.env.HORA_SIMULADA;
  return simulada ? new Date(simulada).toISOString() : new Date().toISOString();
}

const ZONA = "America/Argentina/Buenos_Aires";

/** La fecha de hoy en Argentina, como YYYY-MM-DD. */
export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date(ahora()));
}

export function fechaLarga(fecha: string): string {
  const texto = new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${fecha}T12:00:00Z`));
  return texto;
}

/** "2 h 14 min", para el tiempo que falta hasta el cierre. */
export function faltan(hasta: string, desde: string = ahora()): string {
  const minutos = Math.max(0, Math.round((Date.parse(hasta) - Date.parse(desde)) / 60000));
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
