import { exigirJugador } from "@/lib/sesion.ts";
import { rondaDeHoy } from "@/datos/consultas.ts";
import { ahora, faltan, fechaLarga, hoy } from "@/lib/ahora.ts";
import { aTexto, demora } from "@/dominio/horario.ts";
import { horarioReal, instanteDeCierre, vistaDelJugador, type Ronda } from "@/dominio/ronda.ts";
import { puntuarRonda } from "@/dominio/puntaje.ts";
import { Encabezado } from "@/componentes/Encabezado.tsx";
import { Navegacion } from "@/componentes/Navegacion.tsx";
import { Maquina } from "@/componentes/Maquina.tsx";
import { Picker } from "@/componentes/Picker.tsx";
import { BotonAccion, CargarHorario } from "@/componentes/AccionRonda.tsx";

export const dynamic = "force-dynamic";

export default async function Hoy() {
  const jugador = await exigirJugador();
  const datos = await rondaDeHoy(jugador.id);

  if (!datos) {
    return (
      <div className="app">
        <Encabezado titulo={fechaLarga(hoy())} derecha="Sin ronda" />
        <main className="cuerpo">
          <div className="caja suave">
            <div className="cab">
              <span>Hoy no se juega</span>
            </div>
            <div className="interior">
              <p className="p">
                Hoy no hay clase de Análisis de Sistemas: puede ser feriado, receso, mesa de examen o
                simplemente un día que no es lunes ni jueves.
              </p>
            </div>
          </div>
        </main>
        <Navegacion activo="hoy" />
      </div>
    );
  }

  const { ronda, mia, visibles, cargadaPor, cuantosCargaron, totalJugadores } = datos;
  const vista = vistaDelJugador(ronda, mia !== null, ahora());
  const real = horarioReal(ronda);

  return (
    <div className="app">
      <Encabezado titulo={fechaLarga(ronda.fecha)} derecha={ronda.simulada ? "Simulación" : "Ronda"} />
      <main className="cuerpo">
        <Maquina vista={vista} />

        {vista === "E1" || vista === "E2" ? <Picker inicial={mia} /> : null}

        {vista === "E2" ? (
          <div className="caja suave">
            <div className="interior fila">
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span className="k">Editable hasta el cierre</span>
                <span className="hora h34" style={{ color: "var(--nar)" }}>
                  {faltan(instanteDeCierre(ronda.fecha))}
                </span>
              </div>
              <span className="hora h22">{mia !== null ? aTexto(mia) : ""}</span>
            </div>
          </div>
        ) : null}

        {vista === "E3" ? (
          <>
            <div className="caja">
              <div className="cab nar">
                <span>E3 · Predicciones cerradas</span>
                <span>18:00</span>
              </div>
              <div className="interior">
                <div className="hora h46">Esperando el inicio real</div>
                <p className="p">
                  {mia !== null ? (
                    <>
                      Tu predicción quedó congelada en <b>{aTexto(mia)}</b>.
                    </>
                  ) : (
                    "Esta ronda te la perdiste: las predicciones cerraron a las 18:00."
                  )}
                </p>
              </div>
            </div>

            <div className="caja">
              <div className="cab">
                <span>¿Estás en clase?</span>
              </div>
              <div className="interior">
                <div className="aviso">
                  <span className="k">Qué cuenta como inicio</span>
                  <p className="cita">
                    La clase arranca cuando el docente la abre: empieza con algún tema o toma
                    asistencia.
                  </p>
                </div>
                <CargarHorario rondaId={ronda.id} tipo="cargar_inicio" />
              </div>
            </div>
          </>
        ) : null}

        {vista === "E4" && ronda.carga ? (
          <>
            <div className="caja">
              <div className="cab nar">
                <span>E4 · Pendiente de confirmación</span>
                <span>{cargadaPor ?? ""}</span>
              </div>
              <div className="interior" style={{ gap: 6 }}>
                <div className="k">{cargadaPor ?? "Alguien"} cargó el inicio en</div>
                <div className="hora h68">{aTexto(ronda.carga.horario)}</div>
                <div className="k" style={{ color: "var(--nar)" }}>
                  Δ +{demora(ronda.carga.horario)} min sobre 18:20
                </div>
              </div>
            </div>

            {ronda.objecion ? (
              <p className="p">
                <b>Ronda en disputa.</b> Alguien no coincide con ese horario. La resuelve el admin.
              </p>
            ) : ronda.carga.jugadorId === jugador.id ? (
              <p className="p">
                Cargaste vos este horario, así que no podés confirmarlo. Falta que lo haga otro.
              </p>
            ) : (
              <>
                <p className="p">
                  <b>¿Coincide con lo que viste?</b> Hace falta un segundo jugador para cerrar la
                  ronda.
                </p>
                <BotonAccion rondaId={ronda.id} tipo="confirmar" clase="ver">
                  Confirmar
                </BotonAccion>
                <BotonAccion rondaId={ronda.id} tipo="objetar">
                  Fue otra hora
                </BotonAccion>
              </>
            )}
          </>
        ) : null}

        {vista === "E5" ? <Resultado ronda={ronda} real={real} visibles={visibles} yo={jugador.id} /> : null}

        {vista === "E1" || vista === "E2" ? (
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid var(--line)",
              paddingTop: 11,
            }}
          >
            <span className="k">Cargaron</span>
            <span className="num" style={{ fontSize: 15 }}>
              {String(cuantosCargaron).padStart(2, "0")} / {String(totalJugadores).padStart(2, "0")}
            </span>
          </div>
        ) : null}
      </main>
      <Navegacion activo="hoy" />
    </div>
  );
}

function Resultado({
  ronda,
  real,
  visibles,
  yo,
}: {
  ronda: Ronda;
  real: number | null;
  visibles: { jugadorId: string; nombre: string; horario: number }[];
  yo: string;
}) {
  if (ronda.anulacion) {
    return (
      <div className="caja">
        <div className="cab">
          <span>Ronda anulada</span>
        </div>
        <div className="interior">
          <p className="p">
            <b>{ronda.anulacion.motivo}.</b> Esta ronda no puntúa para nadie y no cuenta entre las dos
            peores que se descartan a fin de año.
          </p>
        </div>
      </div>
    );
  }

  if (real === null) return null;

  const resultados = puntuarRonda(
    visibles.map((v) => ({ jugadorId: v.jugadorId, horario: v.horario })),
    real,
  );
  const nombres = new Map(visibles.map((v) => [v.jugadorId, v.nombre]));
  const mio = resultados.find((r) => r.jugadorId === yo);
  const puesto = resultados.findIndex((r) => r.jugadorId === yo) + 1;

  return (
    <>
      <div className="caja">
        <div className="cab ver">
          <span>E5 · Ronda resuelta</span>
        </div>
        <div className="interior" style={{ gap: 6 }}>
          <div className="k">La clase arrancó</div>
          <div className="hora h68">{aTexto(real)}</div>
          <div className="k" style={{ color: "var(--ver)" }}>
            Δ +{demora(real)} min sobre 18:20
          </div>
        </div>
      </div>

      {mio ? (
        <div className="caja suave">
          <div className="interior fila">
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span className="k">
                Predijiste {aTexto(mio.horario)} · error {mio.error} min
              </span>
              <span style={{ fontFamily: "var(--disp)", fontSize: 14, fontWeight: 600 }}>
                Puesto {puesto} de {resultados.length} en la ronda
              </span>
            </div>
            <span className="hora h34" style={{ color: "var(--azul)" }}>
              +{mio.puntos}
            </span>
          </div>
        </div>
      ) : null}

      <div className="caja suave">
        <div className="cab">
          <span>Resultado de la ronda</span>
          <span>Predicción · Puntos</span>
        </div>
        <div className="interior" style={{ gap: 0, padding: "4px 13px 10px" }}>
          {resultados.map((r) => (
            <div className="fila-lista" key={r.jugadorId}>
              <span className={`ini ${r.jugadorId === yo ? "yo" : ""}`}>
                {(nombres.get(r.jugadorId) ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="nom" style={r.jugadorId === yo ? { fontWeight: 700 } : undefined}>
                {nombres.get(r.jugadorId)}
              </span>
              {r.exacto ? <span className="tag">exacto</span> : null}
              <span className="num" style={{ color: "var(--mute)", width: 44, textAlign: "right" }}>
                {aTexto(r.horario)}
              </span>
              <span className="num" style={{ width: 38, textAlign: "right" }}>
                +{r.puntos}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
