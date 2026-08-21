import { redirect } from "next/navigation";
import { jugadorActual } from "@/lib/sesion.ts";
import { FormularioAcceso } from "@/componentes/FormularioAcceso.tsx";
import { BotonTema } from "@/componentes/Tema.tsx";
import { RescateSesion } from "@/componentes/RescateSesion.tsx";

export const dynamic = "force-dynamic";

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ fallo?: string; via?: string; detalle?: string }>;
}) {
  if (await jugadorActual()) redirect("/");
  const { fallo, via, detalle } = await searchParams;

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
        <RescateSesion />

        {fallo ? (
          <div className="aviso mal">
            <span className="k">No pudimos abrir la sesión</span>
            <p className="cita">{explicar(fallo)}</p>
            {detalle || via ? (
              <p
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--mute)",
                  margin: 0,
                  wordBreak: "break-word",
                }}
              >
                {via ? `via=${via}` : null}
                {detalle ? ` · ${detalle}` : null}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="caja">
          <div className="cab azul">
            <span>Entrar</span>
          </div>
          <div className="interior">
            <p className="p">
              La clase es lunes y jueves de 18:20 a 20:35, y nunca arranca 18:20. El juego consiste en
              adivinar cuándo arranca de verdad.
            </p>
            <FormularioAcceso />
          </div>
        </div>

        <p className="p" style={{ fontSize: 12 }}>
          Sin contraseñas: te llega un link por mail y listo. Hace falta el código de invitación que
          circula entre los que cursan.
        </p>
      </main>
    </div>
  );
}

function explicar(fallo: string): string {
  switch (fallo) {
    case "vencido":
      return "El link del correo ya venció. Pedí uno nuevo: duran una hora.";
    case "usado":
      return "Ese link ya se usó. Pedí uno nuevo.";
    case "otro_navegador":
      return "Pediste el link en un navegador y lo abriste en otro. Pedí uno nuevo y abrilo en el mismo.";
    case "sin_datos":
      return "El link llegó sin datos de acceso. Suele ser la plantilla del correo: tiene que usar el link de confirmación estándar de Supabase.";
    default:
      return "Probá pedir un link nuevo. Si vuelve a fallar, avisá.";
  }
}
