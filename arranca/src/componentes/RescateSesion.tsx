"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseEnNavegador } from "@/lib/supabase-navegador.ts";

/**
 * Rescata la sesión cuando el link del correo la deja en el fragmento de la URL
 * (#access_token=…) en lugar de mandarla al callback.
 *
 * Pasa cuando la plantilla del correo usa el flujo viejo de Supabase: el
 * navegador aterriza en una dirección que la app no conoce, muestra un 404, y
 * la sesión se pierde aunque el link era válido. El fragmento nunca llega al
 * servidor, así que esto sólo se puede resolver acá.
 */
export function RescateSesion() {
  const router = useRouter();
  const [rescatando, setRescatando] = useState(false);

  useEffect(() => {
    const fragmento = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragmento.get("access_token");
    const refreshToken = fragmento.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    setRescatando(true);
    supabaseEnNavegador()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setRescatando(false);
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
        router.replace("/");
      })
      .catch(() => setRescatando(false));
  }, [router]);

  if (!rescatando) return null;

  return (
    <div className="aviso">
      <span className="k">Un momento</span>
      <p className="cita">Estamos abriendo tu sesión.</p>
    </div>
  );
}
