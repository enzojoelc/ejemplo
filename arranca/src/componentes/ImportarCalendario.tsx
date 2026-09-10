"use client";

import { useState } from "react";
import { crearTemporada, type Respuesta } from "@/app/acciones.ts";

/** Crear la temporada es un solo botón: las fechas ya vienen calculadas. */
export function CrearTemporada({ yaExiste }: { yaExiste: boolean }) {
  const [estado, setEstado] = useState<Respuesta>({});
  const [ocupado, setOcupado] = useState(false);

  async function crear() {
    setOcupado(true);
    setEstado(await crearTemporada());
    setOcupado(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <p className="p">
        54 rondas, del <b>16 de marzo</b> al <b>12 de noviembre</b>, con los feriados, el receso, las
        mesas de examen y el puente del 24 de marzo ya descontados.
      </p>

      <button className={`btn ${yaExiste ? "ghost" : "azul"}`} onClick={crear} disabled={ocupado}>
        {ocupado ? "Creando…" : yaExiste ? "Volver a sincronizar" : "Crear la temporada 2026"}
      </button>

      {estado.ok ? (
        <div className="aviso">
          <span className="k">Hecho</span>
          <p className="cita">{estado.ok}</p>
        </div>
      ) : null}
      {estado.error ? <p className="p error">{estado.error}</p> : null}
    </div>
  );
}
