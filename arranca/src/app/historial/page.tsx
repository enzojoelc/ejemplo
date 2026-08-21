import { exigirJugador } from "@/lib/sesion.ts";
import { historial } from "@/datos/consultas.ts";
import { aTexto } from "@/dominio/horario.ts";
import { Encabezado } from "@/componentes/Encabezado.tsx";
import { Navegacion } from "@/componentes/Navegacion.tsx";

export const dynamic = "force-dynamic";

export default async function Historial() {
  const jugador = await exigirJugador();
  const filas = await historial(jugador.id);
  const jugadas = filas.filter((f) => f.puntos !== null).length;

  return (
    <div className="app">
      <Encabezado titulo="Historial" derecha={`${jugadas} jugadas`} />
      <main className="cuerpo">
        <div className="caja suave">
          <div className="cab">
            <span>Fecha · Inicio real</span>
            <span>Puntos</span>
          </div>
          <div className="interior" style={{ gap: 0, padding: "4px 13px 10px" }}>
            {filas.length === 0 ? (
              <p className="p" style={{ padding: "12px 0" }}>
                Todavía no hay rondas para mostrar.
              </p>
            ) : (
              filas.map((f) => (
                <div className="fila-lista" key={f.fecha} style={f.anulada ? { opacity: 0.55 } : undefined}>
                  <span className="k" style={{ width: 62 }}>{corta(f.fecha)}</span>
                  {f.anulada ? (
                    <span className="nom" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                      RONDA ANULADA
                    </span>
                  ) : (
                    <>
                      <span className="hora h22" style={{ width: 74 }}>
                        {f.real !== null ? aTexto(f.real) : "—"}
                      </span>
                      <span
                        className="nom"
                        style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--mute)" }}
                      >
                        {f.mia !== null ? `vos ${aTexto(f.mia)}` : "no jugaste"}
                      </span>
                    </>
                  )}
                  <span className="num" style={{ color: f.puntos ? undefined : "var(--mute)" }}>
                    {f.puntos === null ? "—" : `+${f.puntos}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <p className="p" style={{ fontSize: 12 }}>
          Las rondas anuladas no puntúan y no cuentan entre las dos peores que se descartan a fin de
          año.
        </p>
      </main>
      <Navegacion activo="historial" />
    </div>
  );
}

function corta(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  const dia = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "short" }).format(d);
  return `${dia.slice(0, 3)} ${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
}
