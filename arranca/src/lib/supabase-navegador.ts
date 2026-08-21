"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Cliente para el navegador. Sólo se usa para rescatar sesiones que llegan en el # de la URL. */
export function supabaseEnNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
