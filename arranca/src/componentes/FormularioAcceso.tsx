"use client";

import { useActionState } from "react";
import { pedirAcceso, type Respuesta } from "@/app/acciones.ts";

export function FormularioAcceso() {
  const [estado, enviar, enviando] = useActionState<Respuesta, FormData>(pedirAcceso, {});

  if (estado.ok) {
    return (
      <div className="aviso">
        <span className="k">Revisá tu correo</span>
        <p className="cita">{estado.ok}</p>
      </div>
    );
  }

  return (
    <form action={enviar} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <label className="k" htmlFor="nombre">
        Cómo aparecés en la tabla
      </label>
      <input className="campo" id="nombre" name="nombre" required maxLength={24} placeholder="Enzo" />

      <label className="k" htmlFor="email">
        Tu mail
      </label>
      <input className="campo" id="email" name="email" type="email" required placeholder="vos@mail.com" />

      <label className="k" htmlFor="codigo">
        Código de invitación
      </label>
      <input className="campo" id="codigo" name="codigo" required placeholder="el que circula en el grupo" />

      <button className="btn pri" disabled={enviando}>
        {enviando ? "Enviando…" : "Mandame el link"}
      </button>

      {estado.error ? <p className="p error">{estado.error}</p> : null}
    </form>
  );
}
