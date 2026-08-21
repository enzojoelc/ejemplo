const ESTADOS = ["Abierta", "Cargada", "Cerrada", "Pendiente", "Resuelta"];

/**
 * El diagrama de estados de la ronda. No es decoración: es lo que te dice, de
 * un vistazo, si te toca predecir, esperar, cargar el horario o mirar el
 * resultado.
 */
export function Maquina({ vista }: { vista: "E1" | "E2" | "E3" | "E4" | "E5" }) {
  const actual = Number(vista.slice(1)) - 1;

  return (
    <div className="maq">
      <div className="maqcab">
        <span>Estado de la ronda{actual <= 1 ? " · editable" : ""}</span>
        <span>
          {vista} · <b>{ESTADOS[actual]?.toUpperCase()}</b>
        </span>
      </div>
      <div className="nodos">
        {ESTADOS.map((estado, i) => (
          <div key={estado} style={{ display: "contents" }}>
            <div className={`nodo ${i === actual ? "act" : i < actual ? "hecho" : ""}`} />
            {i < ESTADOS.length - 1 ? <div className="arco" /> : null}
          </div>
        ))}
      </div>
      <div className="maqpie">
        {ESTADOS.map((_, i) => (
          <span key={i}>E{i + 1}</span>
        ))}
      </div>
    </div>
  );
}
