import { redirect } from "next/navigation";
import { exigirJugador } from "@/lib/sesion.ts";
import { rondaDeHoy, hayTemporada } from "@/datos/consultas.ts";
import { fechaLarga, hoy } from "@/lib/ahora.ts";
import { Encabezado } from "@/componentes/Encabezado.tsx";
import { Navegacion } from "@/componentes/Navegacion.tsx";
import { CrearTemporada } from "@/componentes/ImportarCalendario.tsx";
import { BotonAccion, CargarHorario } from "@/componentes/AccionRonda.tsx";
import { horarioReal } from "@/dominio/ronda.ts";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const jugador = await exigirJugador();
  if (!jugador.esAdmin) redirect("/");

  const [datos, temporada] = await Promise.all([rondaDeHoy(jugador.id), hayTemporada()]);
  const real = datos ? horarioReal(datos.ronda) : null;

  return (
    <div className="app">
      <Encabezado titulo="Administración" derecha="Admin" />
      <main className="cuerpo">
        <div className="caja">
          <div className="cab inv">
            <span>Temporada {temporada ? "· creada" : "· falta crearla"}</span>
          </div>
          <div className="interior">
            <CrearTemporada yaExiste={temporada} />
          </div>
        </div>

        <div className="caja suave">
          <div className="cab">
            <span>Ronda de hoy</span>
            <span>{fechaLarga(hoy())}</span>
          </div>
          <div className="interior">
            {!datos ? (
              <p className="p">Hoy no hay ronda.</p>
            ) : (
              <>
                <p className="p">
                  {real !== null ? (
                    <>
                      Horario cargado. La corrección recalcula los puntajes de todos y sólo se puede
                      dentro de las 24 horas.
                    </>
                  ) : (
                    "Todavía nadie cargó el horario real."
                  )}
                </p>
                {real !== null ? (
                  <CargarHorario rondaId={datos.ronda.id} tipo="corregir" inicial={real} />
                ) : null}
                <BotonAccion rondaId={datos.ronda.id} tipo="anular">
                  Anular la ronda
                </BotonAccion>
              </>
            )}
          </div>
        </div>
      </main>
      <Navegacion activo="hoy" />
    </div>
  );
}
