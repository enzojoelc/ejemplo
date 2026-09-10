// Generado desde la Resolución CD 0455/2025 con el lector de src/dominio/resolucion.ts.
// Se guarda ya calculado para que crear la temporada sea un botón y no un trámite:
// el lector sigue estando para el año que viene, cuando cambie la resolución.

export interface DiaSinRonda {
  fecha: string;
  motivo: string;
  tipo: "feriado" | "puente" | "mesa" | "suspension";
}

export const ANIO = 2026;

/** Las 54 fechas que se juegan, del 2026-03-16 al 2026-11-12. */
export const FECHAS: readonly string[] = [
  "2026-03-16",
  "2026-03-19",
  "2026-03-26",
  "2026-03-30",
  "2026-04-06",
  "2026-04-09",
  "2026-04-13",
  "2026-04-16",
  "2026-04-20",
  "2026-04-23",
  "2026-04-27",
  "2026-04-30",
  "2026-05-04",
  "2026-05-07",
  "2026-05-11",
  "2026-05-14",
  "2026-05-18",
  "2026-05-21",
  "2026-06-01",
  "2026-06-04",
  "2026-06-08",
  "2026-06-11",
  "2026-06-15",
  "2026-06-22",
  "2026-06-25",
  "2026-06-29",
  "2026-07-02",
  "2026-07-06",
  "2026-08-03",
  "2026-08-06",
  "2026-08-10",
  "2026-08-13",
  "2026-08-20",
  "2026-08-24",
  "2026-08-27",
  "2026-08-31",
  "2026-09-03",
  "2026-09-07",
  "2026-09-10",
  "2026-09-14",
  "2026-09-17",
  "2026-09-24",
  "2026-09-28",
  "2026-10-01",
  "2026-10-08",
  "2026-10-15",
  "2026-10-19",
  "2026-10-22",
  "2026-10-26",
  "2026-10-29",
  "2026-11-02",
  "2026-11-05",
  "2026-11-09",
  "2026-11-12"
];

/** Los días de cursada que no generan ronda, con su motivo. */
export const SIN_CLASE: readonly DiaSinRonda[] = [
  {
    "fecha": "2026-03-23",
    "motivo": "Puente turístico del 24 de marzo",
    "tipo": "puente"
  },
  {
    "fecha": "2026-04-02",
    "motivo": "Semana Santa",
    "tipo": "feriado"
  },
  {
    "fecha": "2026-05-25",
    "motivo": "Día de la Revolución de Mayo",
    "tipo": "feriado"
  },
  {
    "fecha": "2026-05-28",
    "motivo": "Mesa de examen",
    "tipo": "mesa"
  },
  {
    "fecha": "2026-06-18",
    "motivo": "Mesa de examen",
    "tipo": "mesa"
  },
  {
    "fecha": "2026-07-09",
    "motivo": "Día de la Independencia",
    "tipo": "feriado"
  },
  {
    "fecha": "2026-08-17",
    "motivo": "Paso a la inmortalidad del Gral. San Martín",
    "tipo": "feriado"
  },
  {
    "fecha": "2026-09-21",
    "motivo": "Día del Estudiante",
    "tipo": "feriado"
  },
  {
    "fecha": "2026-10-05",
    "motivo": "Mesa de examen",
    "tipo": "mesa"
  },
  {
    "fecha": "2026-10-12",
    "motivo": "Día del Respeto a la Diversidad Cultural",
    "tipo": "feriado"
  }
];
