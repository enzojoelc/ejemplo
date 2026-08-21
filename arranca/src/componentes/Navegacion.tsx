import Link from "next/link";

const RELOJ = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9.2V13l2.6 1.6M9 2h6" />
  </svg>
);
const PODIO = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 20V9h6v11M3 20v-6h6M15 20h6v-9" />
  </svg>
);
const LISTA = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);

export function Navegacion({ activo }: { activo: "hoy" | "tabla" | "historial" }) {
  return (
    <nav className="nav">
      <Link href="/" className={`navi ${activo === "hoy" ? "on" : ""}`}>
        {RELOJ}
        <span>Hoy</span>
      </Link>
      <Link href="/tabla" className={`navi ${activo === "tabla" ? "on" : ""}`}>
        {PODIO}
        <span>Tabla</span>
      </Link>
      <Link href="/historial" className={`navi ${activo === "historial" ? "on" : ""}`}>
        {LISTA}
        <span>Historial</span>
      </Link>
    </nav>
  );
}
