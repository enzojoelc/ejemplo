"use client";

import { useEffect, useState } from "react";

type Tema = "claro" | "oscuro";

/**
 * El tema lo elige el jugador y se recuerda en su dispositivo. Sin elección,
 * manda el del teléfono: la mayoría nunca toca este botón.
 */
export function BotonTema() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    const guardado = leer();
    if (guardado) setTema(guardado);
  }, []);

  function alternar() {
    const actual =
      tema ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro");
    const siguiente: Tema = actual === "oscuro" ? "claro" : "oscuro";
    setTema(siguiente);
    document.documentElement.dataset.tema = siguiente;
    try {
      localStorage.setItem("tema", siguiente);
    } catch {
      // Navegación privada: el tema dura lo que dure la pestaña.
    }
  }

  return (
    <button className="temabtn" onClick={alternar} aria-label="Cambiar entre claro y oscuro">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}

function leer(): Tema | null {
  try {
    const v = localStorage.getItem("tema");
    return v === "claro" || v === "oscuro" ? v : null;
  } catch {
    return null;
  }
}

/** Aplica el tema antes del primer pintado, para que no haya un destello blanco. */
export const GUION_TEMA = `try{var t=localStorage.getItem("tema");if(t)document.documentElement.dataset.tema=t}catch(e){}`;
