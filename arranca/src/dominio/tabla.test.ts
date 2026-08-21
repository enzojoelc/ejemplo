import { test } from "node:test";
import assert from "node:assert/strict";
import { posiciones, type Participacion } from "./tabla.ts";

let n = 0;
function p(
  jugadorId: string,
  fecha: string,
  puntos: number,
  extra: Partial<Participacion> = {},
): Participacion {
  n += 1;
  return {
    rondaId: `${fecha}-${jugadorId}`,
    jugadorId,
    fecha,
    puntos,
    error: extra.error ?? 3,
    exacto: extra.exacto ?? false,
    cargadaEn: extra.cargadaEn ?? `2026-08-0${(n % 9) + 1}T12:00:00Z`,
  };
}

test("suma los puntos de cada jugador y los ordena", () => {
  const t = posiciones([
    p("mica", "2026-08-03", 30),
    p("mica", "2026-08-06", 12),
    p("sofi", "2026-08-03", 18),
    p("sofi", "2026-08-06", 18),
  ]);
  assert.deepEqual(
    t.map((f) => [f.posicion, f.jugadorId, f.puntos]),
    [
      [1, "mica", 42],
      [2, "sofi", 36],
    ],
  );
});

test("a igual puntaje gana quien tenga más aciertos exactos", () => {
  const t = posiciones([
    p("mica", "2026-08-03", 30, { exacto: true, error: 0 }),
    p("sofi", "2026-08-03", 15),
    p("sofi", "2026-08-06", 15),
    p("mica", "2026-08-06", 0, { error: 40 }),
  ]);
  assert.equal(t[0]?.jugadorId, "mica");
  assert.equal(t[0]?.exactos, 1);
});

test("con los mismos exactos, desempata el menor error acumulado", () => {
  const t = posiciones([
    p("a", "2026-08-03", 15, { error: 2 }),
    p("b", "2026-08-03", 15, { error: 3 }),
  ]);
  assert.deepEqual(t.map((f) => f.jugadorId), ["a", "b"]);
});

test("el último criterio es quién empezó a jugar antes", () => {
  const t = posiciones([
    p("tarde", "2026-08-03", 15, { error: 2, cargadaEn: "2026-08-03T17:00:00Z" }),
    p("temprano", "2026-08-03", 15, { error: 2, cargadaEn: "2026-08-03T09:00:00Z" }),
  ]);
  assert.deepEqual(t.map((f) => f.jugadorId), ["temprano", "tarde"]);
});

test("la tabla mensual sólo mira su mes", () => {
  const datos = [
    p("mica", "2026-08-03", 30),
    p("mica", "2026-09-03", 6),
    p("sofi", "2026-09-03", 25),
  ];
  const agosto = posiciones(datos, { mes: "2026-08" });
  assert.deepEqual(agosto.map((f) => [f.jugadorId, f.puntos]), [["mica", 30]]);

  const septiembre = posiciones(datos, { mes: "2026-09" });
  assert.deepEqual(septiembre.map((f) => [f.jugadorId, f.puntos]), [
    ["sofi", 25],
    ["mica", 6],
  ]);
});

test("los descartes borran las dos peores rondas jugadas", () => {
  const datos = [
    p("mica", "2026-08-03", 30),
    p("mica", "2026-08-06", 18),
    p("mica", "2026-08-10", 0, { error: 40 }),
    p("mica", "2026-08-13", 3, { error: 12 }),
  ];
  const t = posiciones(datos, { descartes: 2 });
  assert.equal(t[0]?.puntos, 48, "quedan la de 30 y la de 18");
  assert.equal(t[0]?.rondasJugadas, 2);
  assert.equal(t[0]?.descartadas.length, 2);
});

test("faltar no se perdona: sólo se descarta entre rondas jugadas", () => {
  // Dos jugadores con el mismo puntaje bruto: uno jugó cuatro veces, el otro dos.
  const constante = [
    p("presente", "2026-08-03", 12),
    p("presente", "2026-08-06", 12),
    p("presente", "2026-08-10", 12),
    p("presente", "2026-08-13", 12),
  ];
  const ausente = [p("ausente", "2026-08-03", 24), p("ausente", "2026-08-06", 24)];

  const t = posiciones([...constante, ...ausente], { descartes: 2 });
  const presente = t.find((f) => f.jugadorId === "presente");
  const faltador = t.find((f) => f.jugadorId === "ausente");

  assert.equal(presente?.puntos, 24, "descarta dos de sus cuatro rondas");
  assert.equal(faltador?.puntos, 0, "descarta las dos únicas que jugó: no hay ceros gratis");
  assert.equal(t[0]?.jugadorId, "presente");
});

test("sin descartes, la tabla del año en curso cuenta todo", () => {
  const datos = [p("mica", "2026-08-03", 30), p("mica", "2026-08-06", 0, { error: 40 })];
  assert.equal(posiciones(datos)[0]?.puntos, 30);
  assert.equal(posiciones(datos)[0]?.rondasJugadas, 2);
});
