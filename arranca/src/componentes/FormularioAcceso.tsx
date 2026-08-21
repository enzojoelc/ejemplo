"use client";

import { useActionState } from "react";
import { entrarConGoogle, validarInvitacion, type Respuesta } from "@/app/acciones.ts";

const GOOGLE = (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.3-.2-1.9H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" />
    <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z" />
    <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" />
  </svg>
);

/** Con invitación validada, entrar es un solo toque. Sin ella, primero el código. */
export function FormularioAcceso({ invitado }: { invitado: boolean }) {
  const [estado, enviar, enviando] = useActionState<Respuesta, FormData>(validarInvitacion, {});

  if (invitado) {
    return (
      <form action={entrarConGoogle} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <button className="btn pri">{GOOGLE} Entrar con Google</button>
        <p className="p" style={{ fontSize: 12 }}>
          Tu nombre en la tabla sale de tu cuenta de Google.
        </p>
      </form>
    );
  }

  return (
    <form action={enviar} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <label className="k" htmlFor="codigo">
        Código de invitación
      </label>
      <input
        className="campo"
        id="codigo"
        name="codigo"
        required
        autoComplete="off"
        placeholder="el que circula en el grupo"
      />
      <button className="btn pri" disabled={enviando}>
        {enviando ? "Verificando…" : "Continuar"}
      </button>
      {estado.error ? <p className="p error">{estado.error}</p> : null}
    </form>
  );
}
