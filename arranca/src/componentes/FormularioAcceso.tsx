"use client";

import { useActionState, useState } from "react";
import {
  entrarConGoogle,
  iniciarSesion,
  registrarse,
  validarInvitacion,
  type Respuesta,
} from "@/app/acciones.ts";

const GOOGLE = (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.3-.2-1.9H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" />
    <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z" />
    <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" />
  </svg>
);

export function PedirCodigo() {
  const [estado, enviar, enviando] = useActionState<Respuesta, FormData>(validarInvitacion, {});

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

/** Con la invitación validada: entrar si ya jugás, o crear la cuenta la primera vez. */
export function Acceso({ conGoogle }: { conGoogle: boolean }) {
  const [nuevo, setNuevo] = useState(false);
  const [entrando, accionEntrar, ocupadoEntrar] = useActionState<Respuesta, FormData>(
    iniciarSesion,
    {},
  );
  const [creando, accionCrear, ocupadoCrear] = useActionState<Respuesta, FormData>(registrarse, {});

  const estado = nuevo ? creando : entrando;
  const ocupado = nuevo ? ocupadoCrear : ocupadoEntrar;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <div className="tabs">
        <button type="button" className={`tab ${nuevo ? "" : "on"}`} onClick={() => setNuevo(false)}>
          Ya juego
        </button>
        <button type="button" className={`tab ${nuevo ? "on" : ""}`} onClick={() => setNuevo(true)}>
          Primera vez
        </button>
      </div>

      <form
        key={nuevo ? "alta" : "ingreso"}
        action={nuevo ? accionCrear : accionEntrar}
        style={{ display: "flex", flexDirection: "column", gap: 11 }}
      >
        {nuevo ? (
          <>
            <label className="k" htmlFor="nombre">
              Cómo aparecés en la tabla
            </label>
            <input className="campo" id="nombre" name="nombre" required maxLength={24} placeholder="Enzo" />
          </>
        ) : null}

        <label className="k" htmlFor="email">
          Tu correo
        </label>
        <input
          className="campo"
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vos@mail.com"
        />

        <label className="k" htmlFor="clave">
          Contraseña
        </label>
        <input
          className="campo"
          id="clave"
          name="clave"
          type="password"
          required
          minLength={6}
          autoComplete={nuevo ? "new-password" : "current-password"}
          placeholder={nuevo ? "al menos 6 caracteres" : ""}
        />

        <button className="btn pri" disabled={ocupado}>
          {ocupado ? "…" : nuevo ? "Crear mi cuenta" : "Entrar"}
        </button>

        {estado.error ? <p className="p error">{estado.error}</p> : null}
      </form>

      {conGoogle ? (
        <form action={entrarConGoogle}>
          <button className="btn ghost">{GOOGLE} Entrar con Google</button>
        </form>
      ) : null}
    </div>
  );
}
