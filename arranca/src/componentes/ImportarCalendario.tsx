"use client";

import { useActionState } from "react";
import { importarCalendario, type Respuesta } from "@/app/acciones.ts";

export function ImportarCalendario() {
  const [estado, enviar, enviando] = useActionState<Respuesta, FormData>(importarCalendario, {});

  return (
    <form action={enviar} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <label className="k" htmlFor="resolucion">
        Texto de la resolución
      </label>
      <textarea
        className="campo"
        id="resolucion"
        name="resolucion"
        rows={6}
        required
        style={{ padding: 12, minHeight: 140, fontSize: 12 }}
        placeholder="Pegá acá el texto del PDF de la resolución de Consejo Directivo"
      />

      <label className="k" htmlFor="puentes">
        Puentes turísticos y suspensiones, uno por línea
      </label>
      <textarea
        className="campo"
        id="puentes"
        name="puentes"
        rows={3}
        style={{ padding: 12, minHeight: 80, fontSize: 12 }}
        placeholder={"2026-03-23 Puente turístico del 24 de marzo"}
      />

      {/* El valor viaja en el botón que envía: un estado de React se actualizaría
          después del envío y mandaría siempre el valor anterior. */}
      <button className="btn pri" name="confirmado" value="no" disabled={enviando}>
        {enviando ? "Leyendo…" : "Ver qué entiende"}
      </button>

      {estado.ok ? (
        <>
          <div className="aviso">
            <span className="k">Revisá antes de crear</span>
            <p className="cita">{estado.ok}</p>
          </div>
          <button className="btn azul" name="confirmado" value="si" disabled={enviando}>
            Crear las rondas
          </button>
        </>
      ) : null}

      {estado.error ? <p className="p error">{estado.error}</p> : null}
    </form>
  );
}
