/**
 * Lectura de la resolución de Consejo Directivo que publica el calendario
 * académico. Recibe el TEXTO del PDF, no el PDF: separar la extracción del
 * parseo permite testear el parseo con un texto fijo, y cambiar la biblioteca
 * que abre PDFs sin tocar ninguna regla.
 */

export type TipoSinClase = "feriado" | "puente" | "mesa" | "suspension";

export interface DiaSinClase {
  fecha: string; // YYYY-MM-DD
  motivo: string;
  tipo: TipoSinClase;
  /** La resolución lo marca como trasladable: lo define el calendario nacional. */
  trasladoPosible?: boolean;
}

export interface Cuatrimestre {
  desde: string;
  hasta: string;
}

export interface CalendarioAcademico {
  anio: number;
  cuatrimestres: Cuatrimestre[];
  sinClase: DiaSinClase[];
}

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

/** Normaliza el texto del PDF: ordinales, espacios y saltos vienen desprolijos. */
function normalizar(texto: string): string {
  return texto.replace(/°/g, "º").replace(/\s+/g, " ").trim();
}

function fecha(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function leerCalendario(textoPdf: string): CalendarioAcademico {
  const texto = normalizar(textoPdf);
  const anio = detectarAnio(texto);
  return {
    anio,
    cuatrimestres: leerCuatrimestres(texto, anio),
    // La resolución también lista el verano siguiente; el ciclo que nos ocupa
    // termina en diciembre, así que lo que cae en el año que viene se descarta.
    sinClase: [...leerFeriados(texto, anio), ...leerMesas(texto, anio)]
      .filter((d) => d.fecha.startsWith(String(anio)))
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

function detectarAnio(texto: string): number {
  const m = /ciclo lectivo (\d{4})/i.exec(texto);
  if (!m) throw new Error("No se encontró el ciclo lectivo en la resolución.");
  return Number(m[1]);
}

/**
 * Toma el cuatrimestre de 2º a 6º año, que es el que cursa la materia.
 * Las filas de 1º año existen pero tienen otras fechas.
 */
function leerCuatrimestres(texto: string, anio: number): Cuatrimestre[] {
  const filas = [
    ...texto.matchAll(
      /(\d{1,2}) de ([a-záéíóú]+)\s*(?:\(\*\))?\s*(Comienza|Finaliza) el (primer|segundo) cuatrimestre([^0-9]*)/gi,
    ),
  ].map((m) => ({
    fecha: fecha(anio, MESES[m[2]!.toLowerCase()] ?? 0, Number(m[1])),
    accion: m[3]!.toLowerCase(),
    cual: m[4]!.toLowerCase(),
    alcance: m[5]!.trim(),
  }));

  const buscar = (accion: string, cual: string) => {
    const candidatas = filas.filter((f) => f.accion === accion && f.cual === cual);
    // "de 1º año" es la fila de ingresantes; cualquier otra sirve.
    const propia = candidatas.find((f) => !/^de 1º año/i.test(f.alcance)) ?? candidatas[0];
    if (!propia) throw new Error(`Falta en la resolución: ${accion} el ${cual} cuatrimestre.`);
    return propia.fecha;
  };

  return [
    { desde: buscar("comienza", "primer"), hasta: buscar("finaliza", "primer") },
    { desde: buscar("comienza", "segundo"), hasta: buscar("finaliza", "segundo") },
  ];
}

function leerFeriados(texto: string, anio: number): DiaSinClase[] {
  const bloque = recortar(texto, "FERIADOS", "MESAS EXAMINADORAS");
  if (!bloque) return [];

  const patron =
    /(\d{1,2}(?:\s*,\s*\d{1,2})*(?:\s*y\s*\d{1,2})?)\s*de ([a-záéíóú]+)/gi;

  const encontrados = [...bloque.matchAll(patron)];
  const dias: DiaSinClase[] = [];

  for (const [i, m] of encontrados.entries()) {
    const mes = MESES[m[2]!.toLowerCase()];
    if (!mes) continue;

    const hasta = encontrados[i + 1]?.index ?? bloque.length;
    // El "(posible traslado)" va detrás del mes, junto al día de la semana.
    const cola = bloque.slice((m.index ?? 0) + m[0].length, hasta);
    const trasladoPosible = /\(posible traslado\)/i.test(cola);
    const motivo = limpiarMotivo(cola);
    const anioFila = anioDeLaFila(bloque, m.index ?? 0, anio);

    for (const d of m[1]!.split(/\s*(?:,|y)\s*/)) {
      dias.push({
        fecha: fecha(anioFila, mes, Number(d)),
        motivo,
        tipo: "feriado",
        ...(trasladoPosible ? { trasladoPosible: true } : {}),
      });
    }
  }

  // La resolución repite el 02 de abril en Semana Santa y en Malvinas.
  return unicos(dias);
}

/**
 * La tabla de feriados se corta por año: "2026 ... 2027 ...". Se toma el
 * último encabezado de año que aparece antes de la fila.
 */
function anioDeLaFila(bloque: string, posicion: number, porDefecto: number): number {
  const previos = [...bloque.slice(0, posicion).matchAll(/(?:^|\s)(20\d{2})(?=\s)/g)];
  const ultimo = previos.at(-1);
  return ultimo ? Number(ultimo[1]) : porDefecto;
}

function limpiarMotivo(cola: string): string {
  return cola
    .replace(/\(posible traslado\)/gi, "")
    .replace(/^[\s,]*(?:(?:lu|ma|mi|ju|vi|sa|do)\b[\s,]*)+/i, "")
    .replace(/Fechas sujetas.*$/i, "")
    .replace(/\b20\d{2}\b\s*$/, "")
    .trim();
}

/**
 * Los días de mesa no hay clase, así que no generan ronda.
 *
 * Las dos tablas se leen por separado a propósito: la de mesas examinadoras
 * termina con el turno de febrero-marzo del año siguiente, y si se leyeran
 * juntas las mesas especiales heredarían ese 2027.
 */
function leerMesas(texto: string, anio: number): DiaSinClase[] {
  const inicio = texto.indexOf("MESAS EXAMINADORAS");
  if (inicio < 0) return [];

  const corte = texto.indexOf("MESAS ESPECIALES", inicio);
  const tablas =
    corte < 0
      ? [texto.slice(inicio)]
      : [texto.slice(inicio, corte), texto.slice(corte)];

  const dias: DiaSinClase[] = [];
  for (const tabla of tablas) {
    for (const m of tabla.matchAll(/\b(\d{2})-(\d{2})\b/g)) {
      dias.push({
        fecha: fecha(anioDeLaFila(tabla, m.index ?? 0, anio), Number(m[2]), Number(m[1])),
        motivo: "Mesa de examen",
        tipo: "mesa",
      });
    }
  }
  return unicos(dias);
}

function recortar(texto: string, desde: string, hasta: string): string | null {
  const i = texto.indexOf(desde);
  if (i < 0) return null;
  const j = texto.indexOf(hasta, i);
  return texto.slice(i + desde.length, j < 0 ? undefined : j);
}

function unicos(dias: DiaSinClase[]): DiaSinClase[] {
  const vistos = new Map<string, DiaSinClase>();
  for (const d of dias) if (!vistos.has(d.fecha)) vistos.set(d.fecha, d);
  return [...vistos.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
