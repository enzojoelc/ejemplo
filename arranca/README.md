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

## Lo que sigue

- Esquema de base de datos y políticas de acceso (Supabase).
- Aplicación web (Next.js) con las pantallas ya diseñadas.
- Extracción de texto del PDF, para cerrar el circuito de carga del calendario.
- Recordatorio por mail a las 17:00 para quien no cargó.
- Modo simulación.
