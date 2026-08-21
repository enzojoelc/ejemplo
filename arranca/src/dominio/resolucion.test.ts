import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { leerCalendario } from "./resolucion.ts";

const texto = readFileSync(
  new URL("./fixtures/resolucion-0455-2025.txt", import.meta.url),
  "utf8",
);

test("lee el ciclo lectivo de la resolución 0455/2025", () => {
  const c = leerCalendario(texto);
  assert.equal(c.anio, 2026);
});

test("toma los cuatrimestres de 2º a 6º año, no los de ingresantes", () => {
  const c = leerCalendario(texto);
  assert.deepEqual(c.cuatrimestres, [
    { desde: "2026-03-16", hasta: "2026-07-11" },
    { desde: "2026-08-03", hasta: "2026-11-14" },
  ]);
});

test("lee los feriados del ciclo, incluidos los grupos de varios días", () => {
  const feriados = leerCalendario(texto).sinClase.filter((d) => d.tipo === "feriado");
  const fechas = feriados.map((f) => f.fecha);

  assert.ok(fechas.includes("2026-03-24"), "Memoria cae martes 24, no lunes 23");
  assert.ok(!fechas.includes("2026-03-23"), "el 23 es puente y no está en la resolución");

  // "02, 03, 04 y 05 de abril" es una sola fila con cuatro días.
  for (const d of ["2026-04-02", "2026-04-03", "2026-04-04", "2026-04-05"]) {
    assert.ok(fechas.includes(d), `falta ${d} de Semana Santa`);
  }

  assert.ok(fechas.includes("2026-12-25"), "llega hasta fin de año");
  assert.ok(!fechas.includes("2027-01-01"), "el año siguiente no es de este ciclo");
});

test("marca los feriados que la resolución deja sujetos a traslado", () => {
  const c = leerCalendario(texto);
  const trasladables = c.sinClase
    .filter((d) => d.trasladoPosible)
    .map((d) => d.fecha);
  assert.deepEqual(trasladables, ["2026-06-17", "2026-08-17", "2026-10-12", "2026-11-20"]);
});

test("lee las mesas de examen del ciclo", () => {
  const mesas = leerCalendario(texto).sinClase.filter((d) => d.tipo === "mesa");
  const fechas = mesas.map((m) => m.fecha);

  for (const d of ["2026-04-07", "2026-05-28", "2026-07-17", "2026-09-16", "2026-12-04"]) {
    assert.ok(fechas.includes(d), `falta la mesa del ${d}`);
  }
  // Mesas especiales.
  for (const d of ["2026-04-28", "2026-06-18", "2026-10-05", "2026-11-11"]) {
    assert.ok(fechas.includes(d), `falta la mesa especial del ${d}`);
  }
  // Las de febrero y marzo de 2027 son del ciclo siguiente.
  assert.ok(!fechas.some((f) => f.startsWith("2027")));
});

test("una resolución sin ciclo lectivo se rechaza en vez de adivinar", () => {
  assert.throws(() => leerCalendario("un texto cualquiera"), /ciclo lectivo/i);
});
