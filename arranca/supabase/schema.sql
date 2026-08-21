-- ¿A qué hora arranca? — esquema de la base
--
-- Dos ideas gobiernan este esquema:
--
-- 1. Los puntos NO se guardan. Se calculan a partir de las rondas cada vez que
--    se pide la tabla. Es lo que permite que el admin corrija un horario dentro
--    de las 24 horas y el campeonato entero se reordene solo.
--
-- 2. Las predicciones ajenas se ocultan EN LA BASE, no en la pantalla. Si se
--    ocultaran sólo en el front, cualquiera las lee con F12 y el juego se acaba.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- jugadores

create table jugadores (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (length(trim(nombre)) between 2 and 24),
  es_admin boolean not null default false,
  creado_en timestamptz not null default now()
);

-- --------------------------------------------------------------- temporadas

create table temporadas (
  id uuid primary key default gen_random_uuid(),
  anio int not null unique,
  -- El texto del premio se muestra arriba de la tabla anual desde el día uno.
  premio text,
  creada_en timestamptz not null default now()
);

-- Días sin clase: feriados y mesas salen de la resolución, los puentes del
-- calendario nacional, y las suspensiones las carga el admin. Todos terminan
-- siendo lo mismo, así que viven en una sola tabla.
create table dias_sin_clase (
  temporada_id uuid not null references temporadas(id) on delete cascade,
  fecha date not null,
  motivo text not null,
  tipo text not null check (tipo in ('feriado', 'puente', 'mesa', 'suspension')),
  primary key (temporada_id, fecha)
);

-- ------------------------------------------------------------------ rondas

create table rondas (
  id uuid primary key default gen_random_uuid(),
  temporada_id uuid not null references temporadas(id) on delete cascade,
  fecha date not null,
  -- Hoy siempre 18:20, pero cada ronda guarda el suyo: si la cátedra mueve la
  -- clase, se cambia el dato y no el código.
  horario_teorico time not null default '18:20',

  -- Carga del horario real. El estado de la ronda se deduce de estas columnas
  -- y de la hora actual: no hay una columna "estado" que pueda quedar vieja
  -- porque un proceso programado no corrió.
  carga_jugador_id uuid references jugadores(id),
  carga_horario time,
  carga_en timestamptz,

  confirmacion_jugador_id uuid references jugadores(id),
  confirmacion_en timestamptz,

  objecion_jugador_id uuid references jugadores(id),
  objecion_en timestamptz,

  correccion_horario time,
  correccion_en timestamptz,

  anulacion_motivo text,
  anulacion_en timestamptz,

  -- Las rondas de simulación nunca entran en ninguna tabla de posiciones.
  simulada boolean not null default false,

  unique (temporada_id, fecha),
  constraint carga_completa check (
    (carga_jugador_id is null and carga_horario is null and carga_en is null) or
    (carga_jugador_id is not null and carga_horario is not null and carga_en is not null)
  ),
  -- Quien carga no puede confirmar ni objetar su propia carga.
  constraint confirma_otro check (
    confirmacion_jugador_id is null or confirmacion_jugador_id <> carga_jugador_id
  ),
  constraint objeta_otro check (
    objecion_jugador_id is null or objecion_jugador_id <> carga_jugador_id
  )
);

create index rondas_por_fecha on rondas (temporada_id, fecha desc);

-- ------------------------------------------------------------- predicciones

create table predicciones (
  ronda_id uuid not null references rondas(id) on delete cascade,
  jugador_id uuid not null references jugadores(id) on delete cascade,
  horario time not null check (horario between '18:20' and '20:00'),
  cargada_en timestamptz not null default now(),
  primary key (ronda_id, jugador_id)
);

-- ------------------------------------------------------------------ helpers

-- Una ronda está resuelta cuando fue confirmada, corregida, o pasaron 24 horas
-- desde la carga sin que nadie dijera nada.
create or replace function ronda_resuelta(r rondas)
returns boolean language sql stable as $$
  select r.anulacion_en is null
     and (r.objecion_en is null or r.correccion_en is not null)
     and (
       r.confirmacion_en is not null
       or r.correccion_en is not null
       or (r.carga_en is not null and now() - r.carga_en >= interval '24 hours')
     );
$$;

create or replace function es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select es_admin from jugadores where id = auth.uid()), false);
$$;

-- ------------------------------------------------------- seguridad de filas

alter table jugadores enable row level security;
alter table temporadas enable row level security;
alter table dias_sin_clase enable row level security;
alter table rondas enable row level security;
alter table predicciones enable row level security;

-- Todos los que entraron ven a todos: es una liga cerrada de compañeros.
create policy jugadores_lectura on jugadores
  for select to authenticated using (true);

create policy jugadores_propio_nombre on jugadores
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy temporadas_lectura on temporadas
  for select to authenticated using (true);

create policy dias_lectura on dias_sin_clase
  for select to authenticated using (true);

create policy rondas_lectura on rondas
  for select to authenticated using (true);

-- El corazón del juego: una predicción ajena sólo es visible cuando la ronda
-- ya está resuelta. Antes de eso, sólo ves la tuya.
create policy predicciones_lectura on predicciones
  for select to authenticated using (
    jugador_id = auth.uid()
    or exists (
      select 1 from rondas r
      where r.id = predicciones.ronda_id and ronda_resuelta(r)
    )
  );

-- Se predice sólo por uno mismo, dentro del rango, y antes de las 18:00.
create policy predicciones_propias on predicciones
  for insert to authenticated with check (
    jugador_id = auth.uid()
    and exists (
      select 1 from rondas r
      where r.id = ronda_id
        and r.anulacion_en is null
        and now() < (r.fecha + time '18:00') at time zone 'America/Argentina/Buenos_Aires'
    )
  );

create policy predicciones_editables on predicciones
  for update to authenticated using (
    jugador_id = auth.uid()
    and exists (
      select 1 from rondas r
      where r.id = ronda_id
        and r.anulacion_en is null
        and now() < (r.fecha + time '18:00') at time zone 'America/Argentina/Buenos_Aires'
    )
  ) with check (jugador_id = auth.uid());

-- Escribir sobre la ronda (cargar, confirmar, objetar) pasa por funciones del
-- servidor, que son las que aplican las reglas completas. La tabla sólo deja
-- escribir al admin.
create policy rondas_admin on rondas
  for all to authenticated using (es_admin()) with check (es_admin());

create policy temporadas_admin on temporadas
  for all to authenticated using (es_admin()) with check (es_admin());

create policy dias_admin on dias_sin_clase
  for all to authenticated using (es_admin()) with check (es_admin());
