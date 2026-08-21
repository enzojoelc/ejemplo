import { CIERRE, estaEnRango, type Minutos } from "./horario.ts";

/**
 * Estados de una ronda. Son los mismos cinco que ve el jugador en pantalla,
 * más los dos que sólo existen cuando algo sale mal.
 */
export type EstadoRonda =
  | "abierta" // se puede predecir y corregir la predicción
  | "cerrada" // 18:00: predicciones congeladas, falta el horario real
  | "pendiente" // alguien cargó el horario, falta que otro lo confirme
  | "en_disputa" // dos jugadores cargaron horarios distintos
  | "resuelta" // confirmado: se revelan las predicciones y se puntúa
  | "anulada"; // no hubo clase

export const VENTANA_OBJECION_MIN = 60;
export const AUTO_CONFIRMACION_HS = 24;
export const VENTANA_CORRECCION_HS = 24;

export interface Carga {
  jugadorId: string;
  horario: Minutos;
  en: string; // ISO 8601
}

export interface Ronda {
  id: string;
  fecha: string; // YYYY-MM-DD
  horarioTeorico: Minutos;
  carga?: Carga;
  confirmacion?: { jugadorId: string; en: string };
  objecion?: { jugadorId: string; en: string };
  correccion?: { horario: Minutos; en: string };
  anulacion?: { motivo: string; en: string };
  /** Las rondas de simulación nunca entran en ninguna tabla. */
  simulada?: boolean;
}

export class ReglaViolada extends Error {}

/** Momento exacto del cierre de predicciones, en hora de Argentina. */
export function instanteDeCierre(fecha: string): string {
  return instante(fecha, CIERRE);
}

export function instante(fecha: string, minutos: Minutos): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return new Date(`${fecha}T${h}:${m}:00-03:00`).toISOString();
}

/**
 * El estado no se guarda: se deduce de lo que pasó y de qué hora es.
 * Así una ronda no puede quedarse "pendiente" para siempre porque un proceso
 * no corrió: si pasaron 24 horas, está resuelta, la haya mirado alguien o no.
 */
export function estadoEn(ronda: Ronda, ahora: string): EstadoRonda {
  if (ronda.anulacion) return "anulada";
  if (ronda.objecion && !ronda.correccion) return "en_disputa";
  if (ronda.correccion || ronda.confirmacion) return "resuelta";

  if (ronda.carga) {
    return horasEntre(ronda.carga.en, ahora) >= AUTO_CONFIRMACION_HS ? "resuelta" : "pendiente";
  }
  return ahora >= instanteDeCierre(ronda.fecha) ? "cerrada" : "abierta";
}

/** El horario real que vale, ya sea el cargado o el corregido por el admin. */
export function horarioReal(ronda: Ronda): Minutos | null {
  if (ronda.correccion) return ronda.correccion.horario;
  return ronda.carga?.horario ?? null;
}

export function puedePredecir(ronda: Ronda, ahora: string): boolean {
  return estadoEn(ronda, ahora) === "abierta";
}

export function validarPrediccion(ronda: Ronda, horario: Minutos, ahora: string): void {
  if (!puedePredecir(ronda, ahora)) {
    throw new ReglaViolada("Las predicciones cerraron a las 18:00.");
  }
  if (!estaEnRango(horario)) {
    throw new ReglaViolada("La predicción tiene que estar entre las 18:20 y las 20:00.");
  }
}

export type Accion =
  | { tipo: "cargar_inicio"; jugadorId: string; horario: Minutos; en: string }
  | { tipo: "confirmar"; jugadorId: string; en: string }
  | { tipo: "objetar"; jugadorId: string; en: string }
  | { tipo: "corregir"; horario: Minutos; en: string }
  | { tipo: "anular"; motivo: string; en: string };

export function aplicar(ronda: Ronda, accion: Accion): Ronda {
  const estado = estadoEn(ronda, accion.en);

  switch (accion.tipo) {
    case "cargar_inicio": {
      if (estado !== "cerrada") {
        throw new ReglaViolada(
          estado === "abierta"
            ? "Todavía no cerraron las predicciones."
            : "El horario de inicio ya fue cargado.",
        );
      }
      if (!estaEnRango(accion.horario)) {
        throw new ReglaViolada("El horario de inicio tiene que estar entre las 18:20 y las 20:00.");
      }
      return {
        ...ronda,
        carga: { jugadorId: accion.jugadorId, horario: accion.horario, en: accion.en },
      };
    }

    case "confirmar": {
      if (estado !== "pendiente") throw new ReglaViolada("No hay un horario pendiente de confirmar.");
      if (ronda.carga?.jugadorId === accion.jugadorId) {
        throw new ReglaViolada("Quien carga el horario no puede confirmarlo.");
      }
      return { ...ronda, confirmacion: { jugadorId: accion.jugadorId, en: accion.en } };
    }

    case "objetar": {
      if (estado === "pendiente") {
        if (ronda.carga?.jugadorId === accion.jugadorId) {
          throw new ReglaViolada("Quien carga el horario no puede objetarlo.");
        }
        return { ...ronda, objecion: { jugadorId: accion.jugadorId, en: accion.en } };
      }
      if (estado === "resuelta" && ronda.confirmacion) {
        if (minutosEntre(ronda.confirmacion.en, accion.en) > VENTANA_OBJECION_MIN) {
          throw new ReglaViolada("La ventana de 60 minutos para objetar ya pasó.");
        }
        return { ...ronda, objecion: { jugadorId: accion.jugadorId, en: accion.en } };
      }
      throw new ReglaViolada("No hay nada que objetar en esta ronda.");
    }

    case "corregir": {
      if (!ronda.carga) throw new ReglaViolada("Todavía no hay un horario que corregir.");
      if (!estaEnRango(accion.horario)) {
        throw new ReglaViolada("El horario corregido tiene que estar entre las 18:20 y las 20:00.");
      }
      const desde = ronda.confirmacion?.en ?? ronda.carga.en;
      if (estado !== "en_disputa" && horasEntre(desde, accion.en) > VENTANA_CORRECCION_HS) {
        throw new ReglaViolada("La ronda ya es definitiva: pasaron más de 24 horas.");
      }
      return { ...ronda, correccion: { horario: accion.horario, en: accion.en } };
    }

    case "anular": {
      if (ronda.anulacion) throw new ReglaViolada("La ronda ya estaba anulada.");
      return { ...ronda, anulacion: { motivo: accion.motivo, en: accion.en } };
    }
  }
}

/** En qué pantalla cae el jugador: los cinco estados de la pantalla Hoy. */
export function vistaDelJugador(
  ronda: Ronda,
  tienePrediccion: boolean,
  ahora: string,
): "E1" | "E2" | "E3" | "E4" | "E5" {
  switch (estadoEn(ronda, ahora)) {
    case "abierta":
      return tienePrediccion ? "E2" : "E1";
    case "cerrada":
      return "E3";
    case "pendiente":
    case "en_disputa":
      return "E4";
    default:
      return "E5";
  }
}

function minutosEntre(desde: string, hasta: string): number {
  return (Date.parse(hasta) - Date.parse(desde)) / 60000;
}

function horasEntre(desde: string, hasta: string): number {
  return minutosEntre(desde, hasta) / 60;
}
