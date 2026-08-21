import { BotonTema } from "./Tema.tsx";

export function Encabezado({ titulo, derecha }: { titulo: string; derecha: string }) {
  return (
    <header className="top">
      <div className="brandrow">
        <span>¿A qué hora arranca?</span>
        <span>{derecha}</span>
      </div>
      <div className="fecharow">
        <h1 className="fecha">{titulo}</h1>
        <BotonTema />
      </div>
    </header>
  );
}
