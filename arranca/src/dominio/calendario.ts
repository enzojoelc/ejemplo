import { HORARIO_TEORICO, type Minutos } from "./horario.ts";
import type { CalendarioAcademico, DiaSinClase } from "./resolucion.ts";

/** La clase es lunes y jueves. 1 y 4 en la numeración ISO de días. */
export const DIAS_DE_CLASE = [1, 4] as const;

const NOMBRE_DIA = ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export interface Ronda {
  fecha: string; // YYYY-MM-DD
  dia: string;
  /** Cada ronda guarda su horario teórico: hoy es 18:20 y no se mueve, pero es un dato. */
  horarioTeorico: Minutos;
}

export interface DiaDescartado {
  fecha: string;
  dia: string;
  motivo: string;
  tipo: DiaSinClase["tipo"];
}

export interface Temporada {
  anio: number;
  rondas: Ronda[];
  descartados: DiaDescartado[];
  /** Última ronda del año: ahí cierra la tabla anual y se aplican los descartes. */
  cierre: string | null;
}

/**
 * Arma la temporada completa: todos los lunes y jueves de cursada que sí se juegan.
 *
 * Las tres fuentes entran acá y en este orden:
 *   1. la resolución, que da cuatrimestres, feriados y mesas;
 *   2. el calendario nacional, que agrega puentes y resuelve traslados;
 *   3. el admin, que carga lo que ninguna de las dos anuncia.
 * Todas terminan siendo la misma cosa —una fecha sin clase— así que se suman.
 */
export function armarTemporada(
  calendario: CalendarioAcademico,
  agregados: readonly DiaSinClase[] = [],
): Temporada {
  const sinClase = new Map<string, DiaSinClase>();
  for (const d of [...calendario.sinClase, ...agregados]) sinClase.set(d.fecha, d);

  const rondas: Ronda[] = [];
  const descartados: DiaDescartado[] = [];

  for (const { desde, hasta } of calendario.cuatrimestres) {
    for (const fecha of diasEntre(desde, hasta)) {
      const iso = diaIso(fecha);
      if (!DIAS_DE_CLASE.includes(iso as 1 | 4)) continue;

      const excusa = sinClase.get(fecha);
      if (excusa) {
        descartados.push({
          fecha,
          dia: NOMBRE_DIA[iso]!,
          motivo: excusa.motivo,
          tipo: excusa.tipo,
        });
      } else {
        rondas.push({ fecha, dia: NOMBRE_DIA[iso]!, horarioTeorico: HORARIO_TEORICO });
      }
    }
  }

  return {
    anio: calendario.anio,
    rondas,
    descartados,
    cierre: rondas.at(-1)?.fecha ?? null,
  };
}

/** Cuántas rondas cae cada mes. Sirve para la tabla mensual y para ver los meses flacos. */
export function rondasPorMes(temporada: Temporada): Map<string, number> {
  const cuenta = new Map<string, number>();
  for (const r of temporada.rondas) {
    const mes = r.fecha.slice(0, 7);
    cuenta.set(mes, (cuenta.get(mes) ?? 0) + 1);
  }
  return cuenta;
}

/* ------------------------------------------------------------------ */
/* Fechas como texto YYYY-MM-DD y cuentas en UTC: así ningún huso ni   */
/* horario de verano puede correr un día para atrás.                   */
/* ------------------------------------------------------------------ */

export function diaIso(fecha: string): number {
  const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay();
  return dia === 0 ? 7 : dia;
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function* diasEntre(desde: string, hasta: string): Generator<string> {
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) yield f;
}
