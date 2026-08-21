"use client";

import { useActionState, useState } from "react";
import { iniciarSesion, registrarse, validarInvitacion, type Respuesta } from "@/app/acciones.ts";

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
export function Acceso() {
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

    </div>
  );
}
