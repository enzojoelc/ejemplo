import Link from "next/link";
import { exigirJugador } from "@/lib/sesion.ts";
import { nombresDeJugadores, participaciones } from "@/datos/consultas.ts";
import { posiciones } from "@/dominio/tabla.ts";
import { hoy } from "@/lib/ahora.ts";
import { Encabezado } from "@/componentes/Encabezado.tsx";
import { Navegacion } from "@/componentes/Navegacion.tsx";

export const dynamic = "force-dynamic";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function Tabla({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>;
}) {
  const jugador = await exigirJugador();
  const { ver } = await searchParams;
  const mensual = ver === "mes";

  const [datos, nombres] = await Promise.all([participaciones(), nombresDeJugadores()]);
  const mesActual = hoy().slice(0, 7);
  const tabla = posiciones(datos, mensual ? { mes: mesActual } : {});

  const nombreMes = MESES[Number(mesActual.slice(5, 7)) - 1] ?? "";

  return (
    <div className="app">
      <Encabezado titulo="Tabla de posiciones" derecha={`${tabla.length} jugadores`} />
      <main className="cuerpo">
        <div className="tabs">
          <Link href="/tabla" className={`tab ${mensual ? "" : "on"}`}>
            Anual
          </Link>
          <Link href="/tabla?ver=mes" className={`tab ${mensual ? "on" : ""}`}>
            {nombreMes}
          </Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="k">
            {mensual ? `${nombreMes} · en curso` : "Temporada completa"}
          </span>
          <span className="k">Exactos · Puntos</span>
        </div>

        <div className="caja suave">
          <div className="interior" style={{ gap: 0, padding: "4px 13px 10px" }}>
            {tabla.length === 0 ? (
              <p className="p" style={{ padding: "12px 0" }}>
                Todavía no hay ninguna ronda resuelta. La tabla aparece con el primer resultado.
              </p>
            ) : (
              tabla.map((fila) => (
                <div className="fila-lista" key={fila.jugadorId}>
                  <span className="num" style={{ width: 16, color: "var(--mute)" }}>
                    {fila.posicion}
                  </span>
                  <span className={`ini ${fila.jugadorId === jugador.id ? "yo" : ""}`}>
                    {(nombres.get(fila.jugadorId) ?? "?").charAt(0).toUpperCase()}
                  </span>
                  <span
                    className="nom"
                    style={fila.jugadorId === jugador.id ? { fontWeight: 700 } : undefined}
                  >
                    {nombres.get(fila.jugadorId)}
                  </span>
                  <span className="num" style={{ width: 26, textAlign: "right", color: "var(--mute)" }}>
                    {fila.exactos}
                  </span>
                  <span className="num" style={{ width: 40, textAlign: "right" }}>
                    {fila.puntos}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="p" style={{ fontSize: 12 }}>
          Empates: primero más aciertos exactos, después menor error acumulado. Los descartes de las
          dos peores rondas se aplican recién al cierre de la temporada.
        </p>
      </main>
      <Navegacion activo="tabla" />
    </div>
  );
}
