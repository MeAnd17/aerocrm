-- Usuarios de la base compartida en Supabase (TS-025).
-- Se corre una vez, como postgres, en Supabase > SQL Editor. Se puede volver a correr sin problema.
--
-- postgres        lo usan solo los responsables de integración (AGENTS.md G4): aplica migraciones y la carga de arranque.
-- aerocrm_equipo  lo usa el resto del equipo: lee y escribe datos, pero no puede crear, cambiar ni borrar tablas.
--                 Si alguien corre por error `prisma migrate dev`, `migrate reset` o `db push` contra la base
--                 compartida, el comando falla por falta de permisos en lugar de borrar la base.
--
-- El script no fija contraseñas. Después de correrlo, un responsable de integración le pone una
-- (solo letras y números, para que no haya que escaparla en la cadena de conexión):
--   alter role aerocrm_equipo password '<contraseña>';

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'aerocrm_equipo') then
    create role aerocrm_equipo login nocreatedb nocreaterole noinherit;
  end if;
end
$$;

-- Seis integrantes con connection_limit=3 en su DATABASE_URL usan como máximo 18.
alter role aerocrm_equipo connection limit 30;

-- Datos: lectura y escritura sobre las tablas que ya existen y las que creen las migraciones futuras.
grant usage on schema public to aerocrm_equipo;
grant select, insert, update, delete on all tables in schema public to aerocrm_equipo;
grant usage, select on all sequences in schema public to aerocrm_equipo;
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to aerocrm_equipo;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to aerocrm_equipo;

-- Estructura: ningún permiso para crear objetos.
revoke create on schema public from aerocrm_equipo;

-- AeroCRM no usa la API automática de Supabase (el frontend habla solo con el backend).
-- Se le quitan a los roles de esa API los permisos sobre nuestras tablas, para que nadie
-- pueda leerlas con la clave pública del proyecto.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
