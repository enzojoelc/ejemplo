# ¿A qué hora arranca?

Juego de predicción del horario real de inicio de Análisis de Sistemas (UTN FRSN),
que se dicta lunes y jueves de 18:20 a 20:35 y nunca arranca a horario.

El reglamento completo está en el documento de especificación; este repositorio
lo implementa.

## Estado

Construido y probado el **núcleo de dominio**, que es la parte donde un error
sale caro: puntajes mal calculados o rondas que no existen arruinan el torneo
entero y se descubren tarde.

| Módulo | Qué resuelve |
|---|---|
| `src/dominio/horario.ts` | Horarios como minutos, rango válido, cierre 18:00 |
| `src/dominio/puntaje.ts` | La escalera de puntos y el bonus del más cercano |
| `src/dominio/ronda.ts` | Los cinco estados de la ronda y sus transiciones |
| `src/dominio/tabla.ts` | Tablas anual y mensual, descartes y desempates |
| `src/dominio/calendario.ts` | Qué lunes y jueves se juegan |
| `src/dominio/resolucion.ts` | Lectura del calendario académico oficial |

```bash
npm test
```

42 tests, sin dependencias: corren con el runner de Node y el soporte nativo de
TypeScript.

## Decisiones que están en el código

**Los puntos no se guardan, se calculan.** La tabla de posiciones se deriva de
las rondas cada vez. Es lo que permite que el admin corrija un horario dentro de
las 24 horas y el campeonato se reordene solo, sin acumulados que actualizar a
mano.

**El estado de la ronda tampoco se guarda.** Se deduce de lo que pasó y de qué
hora es. Una ronda no puede quedar colgada en "pendiente" porque un proceso
programado no corrió: si pasaron 24 horas sin que nadie confirme ni objete, está
resuelta.

**Las fechas son texto `YYYY-MM-DD` y las cuentas se hacen en UTC.** Ningún huso
horario puede correr un día para atrás. Los instantes del juego —el cierre de
las 18:00— se construyen explícitamente en hora de Argentina.

**El parseo de la resolución recibe texto, no un PDF.** Separar la extracción
del parseo permite testear las reglas contra un texto fijo y cambiar la
biblioteca que abre PDFs sin tocar ninguna regla.

## La temporada 2026, calculada

Del calendario académico oficial (Resolución CD 0455/2025) salen **54 rondas**,
del lunes 16 de marzo al jueves 12 de noviembre: 26 lunes y 28 jueves.

Diez días de cursada no se juegan: seis feriados, tres mesas de examen y el
puente turístico del 24 de marzo. Ese último no está en la resolución —los
puentes los declara el Poder Ejecutivo después— y es la razón por la que el
calendario se arma con tres fuentes: la resolución, el calendario nacional y el
admin.

## Poner a andar

```bash
npm install
npm test          # 42 tests de las reglas del juego, sin base de datos
npm run dev
```

## Desplegar

Todo entra en las capas gratuitas: son quince jugadores y 54 rondas al año.

**1. Supabase.** Creá un proyecto y corré `supabase/schema.sql` en el SQL Editor.
En **Authentication → Providers → Email** hacen falta tres cosas, todas en esa
misma pantalla:

1. el proveedor **Email habilitado**;
2. **«Allow new users to sign up» encendido**;
3. **«Confirm email» apagado**.

Con eso la cuenta se crea y queda lista en el acto, sin enviar ningún correo.
El plan gratuito pausa proyectos con 7 días de inactividad: jugando lunes y
jueves nunca se pausa.

Se entra con correo y contraseña a propósito: es el único método que no
necesita ninguna pieza externa. El correo interno de Supabase manda unos pocos
mensajes por hora y montar uno propio exige verificar un dominio para poder
escribirle a quince personas; el acceso con Google evita las dos cosas, pero
pide crear credenciales en Google Cloud.

**2. Vercel.** Importá este repositorio, con `arranca` como directorio raíz.
Cargá las variables de `.env.example`:

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | idem — **nunca** en el navegador |
| `NEXT_PUBLIC_SITIO` | la URL de la app (respaldo: normalmente se deduce sola) |
| `CODIGO_INVITACION` | lo elegís vos |
| `RESEND_API_KEY`, `MAIL_DESDE` | opcionales: sin esto no sale el recordatorio |
| `CRON_SECRET` | protege el endpoint del recordatorio |

**3. Primer ingreso.** Entrá con tu mail y el código. Después, en Supabase,
marcate como admin:

```sql
update jugadores set es_admin = true where id = (select id from auth.users where email = 'tu@mail.com');
```

**4. Calendario.** En `/admin`, pegá el texto de la resolución del ciclo lectivo
y los puentes turísticos (uno por línea, `2026-03-23 Puente turístico`). La
pantalla muestra primero cuántas rondas entendió y de qué fecha a qué fecha:
recién cuando confirmás las crea.

El recordatorio de las 17:00 queda programado por `vercel.json` a las 20:00 UTC.

## Lo que sigue

- **Subir el PDF** en vez de pegar el texto. La resolución 2026 tiene capa de
  texto limpia, así que es cuestión de conectar un extractor a la pantalla que
  ya existe.
- **Cruce automático con el calendario nacional** para los puentes y los tres
  feriados con traslado posible. Hoy se cargan a mano.
- **Modo simulación** completo: el reloj ya es inyectable (`HORA_SIMULADA`) y
  las rondas tienen su marca, falta la pantalla que lo maneje.
- **Recordatorio por correo** de las 17:00: es el único mail que manda la app
  y necesita una cuenta de Resend con dominio verificado.
- **Estadísticas de fase 2**: cuánto tarda el docente en promedio, rachas,
  apodos según el sesgo.
