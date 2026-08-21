"use client";

import { useActionState, useState } from "react";
import { guardarPrediccion, type Respuesta } from "@/app/acciones.ts";
import { aTexto, demora, RANGO_MAXIMO, RANGO_MINIMO, aMinutos } from "@/dominio/horario.ts";

const ATAJOS = ["18:25", "18:30", "18:35", "18:40", "19:00"].map(aMinutos);

/**
 * Lo único que el jugador toca dos veces por semana. Pasos de un minuto,
 * atajos para los horarios de siempre, y el desfasaje sobre las 18:20 a la
 * vista, que es la forma en que uno piensa el problema: "hoy llega quince
 * tarde", no "hoy llega 18:35".
 */
export function Picker({ inicial }: { inicial: number | null }) {
  const [minutos, setMinutos] = useState(inicial ?? aMinutos("18:34"));
  const [estado, enviar, enviando] = useActionState<Respuesta, FormData>(guardarPrediccion, {});

  const desfase = demora(minutos);

  return (
    <form action={enviar} style={{ display: "contents" }}>
      <input type="hidden" name="horario" value={minutos} />

      <div className="caja">
        <div className="cab azul">
          <span>{inicial === null ? "E1 · Entrada de predicción" : "E2 · Predicción registrada"}</span>
          <span>Cierra 18:00</span>
        </div>
        <div className="interior">
          <div className="pasos">
            <button
              type="button"
              className="paso"
              aria-label="Un minuto menos"
              onClick={() => setMinutos((m) => Math.max(RANGO_MINIMO, m - 1))}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M5 12h14" />
              </svg>
            </button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div className="hora h68">{aTexto(minutos)}</div>
              <div className="k" style={{ color: "var(--azul)" }}>
                Δ {desfase >= 0 ? "+" : ""}
                {desfase} min sobre 18:20
              </div>
            </div>

            <button
              type="button"
              className="paso"
              aria-label="Un minuto más"
              onClick={() => setMinutos((m) => Math.min(RANGO_MAXIMO, m + 1))}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          <div className="pastillas">
            {ATAJOS.map((m) => (
              <button
                key={m}
                type="button"
                className={`pastilla ${m === minutos ? "on" : ""}`}
                onClick={() => setMinutos(m)}
              >
                {aTexto(m)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className={`btn ${estado.ok ? "ver" : "pri"}`} disabled={enviando}>
        {enviando ? "Guardando…" : estado.ok ? "✓ Predicción guardada" : "Guardar predicción"}
      </button>

      {estado.error ? <p className="p error">{estado.error}</p> : null}
      <p className="p">
        {inicial === null
          ? "Rango válido 18:20 a 20:00, precisión de un minuto."
          : "Podés cambiarla todas las veces que quieras hasta las 18:00. Nadie ve tu horario hasta que se cargue el inicio real."}
      </p>
    </form>
  );
}
