import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión en cada navegación. Sin esto el link mágico entra bien
 * pero la sesión se corta sola a los pocos minutos, que es el tipo de error
 * que la gente reporta como "me saca todo el tiempo".
 */
export async function middleware(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return respuesta;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (nuevas) => {
        for (const { name, value } of nuevas) request.cookies.set(name, value);
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of nuevas) respuesta.cookies.set(name, value, options);
      },
    },
  });

  await supabase.auth.getUser();
  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
