import Link from "next/link";
import { BotonTema } from "@/componentes/Tema.tsx";

/** Cualquier dirección que la app no conoce cae acá. */
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
        <div className="caja suave">
          <div className="cab">
            <span>Qué pudo pasar</span>
          </div>
          <div className="interior">
            <p className="p">
              La dirección que abriste no existe en la app. Puede ser un enlace viejo o un error de
              tipeo.
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
