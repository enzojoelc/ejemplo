import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jugadorActual } from "@/lib/sesion.ts";
import { Acceso, PedirCodigo } from "@/componentes/FormularioAcceso.tsx";
import { BotonTema } from "@/componentes/Tema.tsx";

export const dynamic = "force-dynamic";

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ fallo?: string; detalle?: string }>;
}) {
  if (await jugadorActual()) redirect("/");

  const { fallo, detalle } = await searchParams;
  const invitado = (await cookies()).get("invitacion")?.value === process.env.CODIGO_INVITACION;

  return (
    <div className="app">
      <header className="top">
        <div className="brandrow">
          <span>Análisis de Sistemas</span>
          <span>Liga cerrada</span>
        </div>
        <div className="fecharow">
          <h1 className="fecha">¿A qué hora arranca?</h1>
          <BotonTema />
        </div>
      </header>

      <main className="cuerpo">
        {fallo ? (
          <div className="aviso mal">
            <span className="k">No pudimos abrir la sesión</span>
            <p className="cita">{explicar(fallo)}</p>
            {detalle ? (
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--mute)",
                  margin: 0,
                  wordBreak: "break-word",
                }}
              >
                {detalle}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="caja">
          <div className="cab azul">
            <span>{invitado ? "Entrar" : "Paso 1 de 2"}</span>
          </div>
          <div className="interior">
            <p className="p">
              La clase es lunes y jueves de 18:20 a 20:35, y nunca arranca 18:20. El juego consiste en
              adivinar cuándo arranca de verdad.
            </p>
            {invitado ? <Acceso /> : <PedirCodigo />}
          </div>
        </div>

        <p className="p" style={{ fontSize: 12 }}>
          {invitado
            ? "No se envía ningún correo: la cuenta se crea y queda lista en el momento."
            : "Hace falta el código que circula entre los que cursan."}
        </p>
      </main>
    </div>
  );
}

function explicar(fallo: string): string {
  switch (fallo) {
    case "sin_invitacion":
      return "Tu cuenta de Google anduvo, pero no tenés invitación. Cargá el código y volvé a entrar.";
    case "alta":
      return "Entraste, pero no se pudo crear tu ficha de jugador.";
    default:
      return "Probá de nuevo. Si vuelve a fallar, avisá.";
  }
}
