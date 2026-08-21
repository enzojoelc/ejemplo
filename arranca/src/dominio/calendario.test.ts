import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { leerCalendario, type DiaSinClase } from "./resolucion.ts";
import { armarTemporada, rondasPorMes, diaIso } from "./calendario.ts";
import { aTexto, HORARIO_TEORICO } from "./horario.ts";

const calendario = leerCalendario(
  readFileSync(new URL("./fixtures/resolucion-0455-2025.txt", import.meta.url), "utf8"),
);

/** Lo que agrega el calendario nacional: el puente del feriado del 24 de marzo. */
const puentes: DiaSinClase[] = [
  { fecha: "2026-03-23", motivo: "Puente turístico del 24 de marzo", tipo: "puente" },
  { fecha: "2026-07-10", motivo: "Puente turístico del 9 de julio", tipo: "puente" },
];

test("la temporada 2026 tiene 54 rondas", () => {
  const t = armarTemporada(calendario, puentes);
  assert.equal(t.rondas.length, 54);
  assert.equal(t.rondas[0]?.fecha, "2026-03-16");
  assert.equal(t.cierre, "2026-11-12");
});

test("quedan repartidas parejo entre lunes y jueves", () => {
  const t = armarTemporada(calendario, puentes);
  const lunes = t.rondas.filter((r) => diaIso(r.fecha) === 1).length;
  const jueves = t.rondas.filter((r) => diaIso(r.fecha) === 4).length;
  assert.equal(lunes, 26);
  assert.equal(jueves, 28);
  assert.equal(lunes + jueves, t.rondas.length, "sólo se juega lunes y jueves");
});

test("sin el puente habría una ronda de más, y es una clase que no existe", () => {
  const sinPuentes = armarTemporada(calendario);
  assert.equal(sinPuentes.rondas.length, 55);
  assert.ok(
    sinPuentes.rondas.some((r) => r.fecha === "2026-03-23"),
    "la resolución sola crea ronda el lunes 23 de marzo",
  );
});

test("explica cada día de cursada que no se juega", () => {
  const t = armarTemporada(calendario, puentes);
  const enCursada = t.descartados.map((d) => `${d.fecha} ${d.tipo}`);
  assert.deepEqual(enCursada, [
    "2026-03-23 puente",
    "2026-04-02 feriado",
    "2026-05-25 feriado",
    "2026-05-28 mesa",
    "2026-06-18 mesa",
    "2026-07-09 feriado",
    "2026-08-17 feriado",
    "2026-09-21 feriado",
    "2026-10-05 mesa",
    "2026-10-12 feriado",
  ]);
});

test("el receso de invierno no genera rondas", () => {
  const t = armarTemporada(calendario, puentes);
  const enReceso = t.rondas.filter((r) => r.fecha > "2026-07-11" && r.fecha < "2026-08-03");
  assert.deepEqual(enReceso, []);
});

test("julio queda con dos rondas, que es la consecuencia del mes calendario", () => {
  const meses = rondasPorMes(armarTemporada(calendario, puentes));
  assert.equal(meses.get("2026-07"), 2);
  assert.equal(meses.get("2026-03"), 4);
  assert.equal(meses.get("2026-11"), 4);
});

test("cada ronda guarda su horario teórico", () => {
  const t = armarTemporada(calendario, puentes);
  assert.ok(t.rondas.every((r) => r.horarioTeorico === HORARIO_TEORICO));
  assert.equal(aTexto(t.rondas[0]!.horarioTeorico), "18:20");
});

test("una suspensión cargada por el admin borra su ronda", () => {
  const conParo = armarTemporada(calendario, [
    ...puentes,
    { fecha: "2026-09-03", motivo: "Paro docente", tipo: "suspension" },
  ]);
  assert.equal(conParo.rondas.length, 53);
  assert.ok(conParo.descartados.some((d) => d.tipo === "suspension"));
});
