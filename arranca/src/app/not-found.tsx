import Link from "next/link";
import { BotonTema } from "@/componentes/Tema.tsx";
import { RescateSesion } from "@/componentes/RescateSesion.tsx";

/**
 * Cualquier dirección que la app no conoce cae acá. Importa más de lo que
 * parece: es donde aterriza un link del correo mal configurado, así que además
 * de explicar, intenta rescatar la sesión si el link la traía.
 */
export default function NoEncontrado() {
  return (
    <div className="app">
      <header className="top">
        <div className="brandrow">
          <span>¿A qué hora arranca?</span>
          <span>Página inexistente</span>
        </div>
        <div className="fecharow">
          <h1 className="fecha">Acá no hay nada</h1>
          <BotonTema />
        </div>
      </header>

      <main className="cuerpo">
        <RescateSesion />

        <div className="caja suave">
          <div className="cab">
            <span>Qué pudo pasar</span>
          </div>
          <div className="interior">
            <p className="p">
              Si llegaste desde el link de un correo, es probable que la dirección de retorno esté mal
              configurada en Supabase: la que figura en <b>Authentication → URL Configuration</b> tiene
              que ser la de esta app, con <b>/auth/callback</b> al final.
            </p>
            <Link className="btn pri" href="/entrar">
              Volver a entrar
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
