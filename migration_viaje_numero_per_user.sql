-- Migración: numeración de viajes por usuario con relleno de huecos
-- Correr en el SQL Editor del dashboard de Supabase

-- 1. Quitar el GENERATED ALWAYS AS IDENTITY y dejar la columna como bigint simple
ALTER TABLE viajes ALTER COLUMN numero DROP IDENTITY IF EXISTS;
ALTER TABLE viajes ALTER COLUMN numero DROP DEFAULT;
ALTER TABLE viajes ALTER COLUMN numero SET DATA TYPE bigint;

-- 2. Función que asigna el menor número libre para el usuario
CREATE OR REPLACE FUNCTION assign_viaje_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  SELECT COALESCE(
    (
      SELECT MIN(s)
      FROM generate_series(
        1,
        (SELECT COUNT(*) + 1 FROM viajes WHERE user_id = NEW.user_id)::int
      ) s
      WHERE s NOT IN (
        SELECT numero FROM viajes WHERE user_id = NEW.user_id AND numero IS NOT NULL
      )
    ),
    1
  ) INTO NEW.numero;
  RETURN NEW;
END;
$$;

-- 3. Trigger que dispara la función antes de cada INSERT
DROP TRIGGER IF EXISTS trg_assign_viaje_numero ON viajes;
CREATE TRIGGER trg_assign_viaje_numero
  BEFORE INSERT ON viajes
  FOR EACH ROW
  EXECUTE FUNCTION assign_viaje_numero();
