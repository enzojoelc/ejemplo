import { test } from "node:test";
import assert from "node:assert/strict";
import { aMinutos } from "./horario.ts";
import { puntosPorError, puntuarRonda, BONUS_MAS_CERCANO } from "./puntaje.ts";

test("la escalera da los puntos del reglamento", () => {
  assert.equal(puntosPorError(0), 25);
  assert.equal(puntosPorError(1), 18);
  assert.equal(puntosPorError(2), 15);
  assert.equal(puntosPorError(3), 12);
  assert.equal(puntosPorError(4), 10);
  assert.equal(puntosPorError(5), 10);
  assert.equal(puntosPorError(6), 6);
  assert.equal(puntosPorError(10), 6);
  assert.equal(puntosPorError(11), 3);
  assert.equal(puntosPorError(15), 3);
  assert.equal(puntosPorError(16), 0);
  assert.equal(puntosPorError(300), 0);
});

test("errar por antes o por después vale lo mismo", () => {
  assert.equal(puntosPorError(-3), puntosPorError(3));
  assert.equal(puntosPorError(-20), 0);
});

test("puntúa la ronda de ejemplo del reglamento", () => {
  const real = aMinutos("18:34");
  const r = puntuarRonda(
    [
      { jugadorId: "mica", horario: aMinutos("18:34") },
      { jugadorId: "tomas", horario: aMinutos("18:33") },
      { jugadorId: "sofi", horario: aMinutos("18:36") },
      { jugadorId: "enzo", horario: aMinutos("18:31") },
      { jugadorId: "fede", horario: aMinutos("18:40") },
      { jugadorId: "juli", horario: aMinutos("18:50") },
    ],
    real,
  );

  assert.deepEqual(
    r.map((x) => [x.jugadorId, x.puntos]),
    [
      ["mica", 30],
      ["tomas", 18],
      ["sofi", 15],
      ["enzo", 12],
      ["fede", 6],
      ["juli", 0],
    ],
  );
  assert.equal(r[0]?.exacto, true);
  assert.equal(r[0]?.masCercano, true);
});

test("el bonus del más cercano se comparte cuando hay empate", () => {
  const real = aMinutos("18:30");
  const r = puntuarRonda(
    [
      { jugadorId: "a", horario: aMinutos("18:28") },
      { jugadorId: "b", horario: aMinutos("18:32") },
      { jugadorId: "c", horario: aMinutos("18:40") },
    ],
    real,
  );
  const ganadores = r.filter((x) => x.masCercano).map((x) => x.jugadorId);
  assert.deepEqual(ganadores.sort(), ["a", "b"]);
  assert.equal(r.find((x) => x.jugadorId === "a")?.puntos, 15 + BONUS_MAS_CERCANO);
  assert.equal(r.find((x) => x.jugadorId === "c")?.puntos, 6);
});

test("el más cercano cobra el bonus aunque todos hayan errado feo", () => {
  const real = aMinutos("19:40");
  const r = puntuarRonda(
    [
      { jugadorId: "audaz", horario: aMinutos("19:15") },
      { jugadorId: "prudente", horario: aMinutos("18:30") },
    ],
    real,
  );
  const audaz = r.find((x) => x.jugadorId === "audaz");
  assert.equal(audaz?.puntosEscalera, 0, "erró por 25 minutos: la escalera no le da nada");
  assert.equal(audaz?.puntos, BONUS_MAS_CERCANO, "pero se lleva el bonus que nadie más toca");
  assert.equal(r.find((x) => x.jugadorId === "prudente")?.puntos, 0);
});

test("una ronda sin predicciones no puntúa a nadie", () => {
  assert.deepEqual(puntuarRonda([], aMinutos("18:34")), []);
});
