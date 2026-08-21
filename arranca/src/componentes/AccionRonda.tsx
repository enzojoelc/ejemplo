"use client";

import { useActionState, useState } from "react";
import { accionSobreRonda, type Respuesta } from "@/app/acciones.ts";
import { aTexto, aMinutos, RANGO_MAXIMO, RANGO_MINIMO } from "@/dominio/horario.ts";

/** Botón simple para confirmar, objetar o anular. */
export function BotonAccion({
  rondaId,
  tipo,
  children,
  clase = "ghost",
}: {
  rondaId: string;
  tipo: "confirmar" | "objetar" | "anular";
  children: React.ReactNode;
  clase?: string;
}) {
  const [estado, enviar, enviando] = useActionState<Respuesta, FormData>(accionSobreRonda, {});

  return (
    <form action={enviar}>
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="rondaId" value={rondaId} />
      <button className={`btn ${clase}`} disabled={enviando}>
        {enviando ? "…" : children}
      </button>
      {estado.error ? <p className="p error">{estado.error}</p> : null}
      {estado.ok ? <p className="p">{estado.ok}</p> : null}
    </form>
  );
}

/** Carga del horario real de inicio, o su corrección por parte del admin. */
export function CargarHorario({
  rondaId,
  tipo,
  inicial,
}: {
  rondaId: string;
  tipo: "cargar_inicio" | "corregir";
  inicial?: number;
}) {
  const [minutos, setMinutos] = useState(inicial ?? aMinutos("18:30"));
  const [estado, enviar, enviando] = useActionState<Respuesta, FormData>(accionSobreRonda, {});

  return (
    <form action={enviar} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="rondaId" value={rondaId} />
      <input type="hidden" name="horario" value={minutos} />

      <div className="pasos">
        <button type="button" className="paso" aria-label="Un minuto menos"
          onClick={() => setMinutos((m) => Math.max(RANGO_MINIMO, m - 1))}>−</button>
        <div className="hora h46">{aTexto(minutos)}</div>
        <button type="button" className="paso" aria-label="Un minuto más"
          onClick={() => setMinutos((m) => Math.min(RANGO_MAXIMO, m + 1))}>+</button>
      </div>

      <button className="btn azul" disabled={enviando}>
        {enviando ? "…" : tipo === "corregir" ? "Corregir horario" : "Cargar horario de inicio"}
      </button>
      {estado.error ? <p className="p error">{estado.error}</p> : null}
      {estado.ok ? <p className="p">{estado.ok}</p> : null}
    </form>
  );
}
