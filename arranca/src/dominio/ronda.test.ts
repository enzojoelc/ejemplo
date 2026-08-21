import { test } from "node:test";
import assert from "node:assert/strict";
import { aMinutos, HORARIO_TEORICO } from "./horario.ts";
import {
  aplicar,
  estadoEn,
  horarioReal,
  instante,
  instanteDeCierre,
  ReglaViolada,
  validarPrediccion,
  vistaDelJugador,
  type Ronda,
} from "./ronda.ts";

const base: Ronda = { id: "r09", fecha: "2026-08-20", horarioTeorico: HORARIO_TEORICO };
const alas = (hhmm: string) => instante("2026-08-20", aMinutos(hhmm));

test("la ronda está abierta hasta las 18:00 y cerrada después", () => {
  assert.equal(estadoEn(base, alas("17:59")), "abierta");
  assert.equal(estadoEn(base, alas("18:00")), "cerrada");
  assert.equal(instanteDeCierre("2026-08-20"), "2026-08-20T21:00:00.000Z", "18:00 en Argentina");
});

test("la predicción se puede cambiar hasta el cierre, y después no", () => {
  validarPrediccion(base, aMinutos("18:31"), alas("12:00"));
  validarPrediccion(base, aMinutos("18:45"), alas("17:59"));
  assert.throws(() => validarPrediccion(base, aMinutos("18:31"), alas("18:00")), ReglaViolada);
});

test("no se aceptan predicciones fuera del rango 18:20 a 20:00", () => {
  assert.throws(() => validarPrediccion(base, aMinutos("18:19"), alas("12:00")), ReglaViolada);
  assert.throws(() => validarPrediccion(base, aMinutos("20:01"), alas("12:00")), ReglaViolada);
  validarPrediccion(base, aMinutos("18:20"), alas("12:00"));
  validarPrediccion(base, aMinutos("20:00"), alas("12:00"));
});

test("cargar el horario deja la ronda pendiente de confirmación", () => {
  const r = aplicar(base, {
    tipo: "cargar_inicio",
    jugadorId: "mica",
    horario: aMinutos("18:34"),
    en: alas("18:36"),
  });
  assert.equal(estadoEn(r, alas("18:40")), "pendiente");
  assert.equal(horarioReal(r), aMinutos("18:34"));
});

test("no se puede cargar el horario antes del cierre", () => {
  assert.throws(
    () =>
      aplicar(base, {
        tipo: "cargar_inicio",
        jugadorId: "mica",
        horario: aMinutos("18:34"),
        en: alas("17:50"),
      }),
    /Todavía no cerraron/,
  );
});

test("quien carga el horario no puede confirmarlo ni objetarlo", () => {
  const r = aplicar(base, {
    tipo: "cargar_inicio",
    jugadorId: "mica",
    horario: aMinutos("18:34"),
    en: alas("18:36"),
  });
  assert.throws(
    () => aplicar(r, { tipo: "confirmar", jugadorId: "mica", en: alas("18:37") }),
    /no puede confirmarlo/,
  );
  assert.throws(
    () => aplicar(r, { tipo: "objetar", jugadorId: "mica", en: alas("18:37") }),
    /no puede objetarlo/,
  );
});

test("un segundo jugador confirma y la ronda queda resuelta", () => {
  const cargada = aplicar(base, {
    tipo: "cargar_inicio",
    jugadorId: "mica",
    horario: aMinutos("18:34"),
    en: alas("18:36"),
  });
  const resuelta = aplicar(cargada, { tipo: "confirmar", jugadorId: "sofi", en: alas("18:38") });
  assert.equal(estadoEn(resuelta, alas("18:39")), "resuelta");
});

test("si nadie contesta, a las 24 horas se confirma sola", () => {
  const cargada = aplicar(base, {
    tipo: "cargar_inicio",
    jugadorId: "mica",
    horario: aMinutos("18:34"),
    en: alas("18:36"),
  });
  assert.equal(estadoEn(cargada, alas("23:59")), "pendiente");
  assert.equal(estadoEn(cargada, instante("2026-08-21", aMinutos("18:37"))), "resuelta");
});

test("objetar antes de confirmar deja la ronda en disputa", () => {
  const cargada = aplicar(base, {
    tipo: "cargar_inicio",
    jugadorId: "mica",
    horario: aMinutos("18:34"),
    en: alas("18:36"),
  });
  const disputa = aplicar(cargada, { tipo: "objetar", jugadorId: "sofi", en: alas("18:40") });
  assert.equal(estadoEn(disputa, alas("18:41")), "en_disputa");
  assert.equal(estadoEn(disputa, instante("2026-08-25", aMinutos("12:00"))), "en_disputa",
    "una disputa no se auto-confirma: espera al admin");
});

test("la ventana para objetar una ronda confirmada dura 60 minutos", () => {
  let r = aplicar(base, {
    tipo: "cargar_inicio",
    jugadorId: "mica",
    horario: aMinutos("18:34"),
    en: alas("18:36"),
  });
  r = aplicar(r, { tipo: "confirmar", jugadorId: "sofi", en: alas("18:40") });

  const aTiempo = aplicar(r, { tipo: "objetar", jugadorId: "fede", en: alas("19:30") });
  assert.equal(estadoEn(aTiempo, alas("19:31")), "en_disputa");

  assert.throws(
    () => aplicar(r, { tipo: "objetar", jugadorId: "fede", en: alas("19:45") }),
    /ventana de 60 minutos/,
  );
});

test("el admin corrige dentro de las 24 horas y después la ronda es definitiva", () => {
  let r = aplicar(base, {
    tipo: "cargar_inicio",
    jugadorId: "mica",
    horario: aMinutos("18:34"),
    en: alas("18:36"),
  });
  r = aplicar(r, { tipo: "confirmar", jugadorId: "sofi", en: alas("18:40") });

  const corregida = aplicar(r, {
    tipo: "corregir",
    horario: aMinutos("18:36"),
    en: instante("2026-08-21", aMinutos("10:00")),
  });
  assert.equal(horarioReal(corregida), aMinutos("18:36"));

  assert.throws(
    () =>
      aplicar(r, {
        tipo: "corregir",
        horario: aMinutos("18:36"),
        en: instante("2026-08-22", aMinutos("10:00")),
      }),
    /definitiva/,
  );
});

test("una ronda en disputa se puede corregir aunque pasen días", () => {
  let r = aplicar(base, {
    tipo: "cargar_inicio",
    jugadorId: "mica",
    horario: aMinutos("18:34"),
    en: alas("18:36"),
  });
  r = aplicar(r, { tipo: "objetar", jugadorId: "sofi", en: alas("18:45") });
  const resuelta = aplicar(r, {
    tipo: "corregir",
    horario: aMinutos("18:37"),
    en: instante("2026-08-25", aMinutos("12:00")),
  });
  assert.equal(estadoEn(resuelta, instante("2026-08-25", aMinutos("12:01"))), "resuelta");
});

test("anular gana sobre cualquier otro estado", () => {
  const r = aplicar(base, { tipo: "anular", motivo: "Paro docente", en: alas("19:00") });
  assert.equal(estadoEn(r, alas("19:01")), "anulada");
  assert.equal(vistaDelJugador(r, true, alas("19:01")), "E5");
});

test("el jugador ve la pantalla que le corresponde", () => {
  assert.equal(vistaDelJugador(base, false, alas("12:00")), "E1");
  assert.equal(vistaDelJugador(base, true, alas("12:00")), "E2");
  assert.equal(vistaDelJugador(base, true, alas("18:05")), "E3");

  const cargada = aplicar(base, {
    tipo: "cargar_inicio",
    jugadorId: "mica",
    horario: aMinutos("18:34"),
    en: alas("18:36"),
  });
  assert.equal(vistaDelJugador(cargada, true, alas("18:37")), "E4");

  const resuelta = aplicar(cargada, { tipo: "confirmar", jugadorId: "sofi", en: alas("18:38") });
  assert.equal(vistaDelJugador(resuelta, true, alas("18:39")), "E5");
});
