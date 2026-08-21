import { headers } from "next/headers";

/**
 * La URL pública de la app, tomada del pedido que está en curso.
 *
 * Deducirla del host en vez de leerla de una variable de entorno evita el error
 * más silencioso de todos: si la variable falta, el link del correo se arma
 * relativo —"/auth/callback"— y deja de ser una dirección válida. Además
 * funciona igual en producción y en cada previsualización, que tienen dominios
 * distintos.
 */
export async function urlDelSitio(): Promise<string> {
  const cabeceras = await headers();
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host");
  const protocolo = cabeceras.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  if (host) return `${protocolo}://${host}`;
  return process.env.NEXT_PUBLIC_SITIO ?? "";
}
