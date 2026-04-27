-- =============================================================================
-- Migración: elimina la columna `email` de `users` (solo nombre de usuario).
-- Ejecutar en bases que aún tienen `email` (p. ej. tras versiones anteriores).
-- En instalaciones nuevas con 01 sin email, este script no hace daño (idempotente).
-- =============================================================================

USE municipalidad_trancas;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'users_email_unique'
);

SET @sql := IF(
  @idx_exists > 0,
  'ALTER TABLE users DROP INDEX users_email_unique',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'email'
);

SET @sql2 := IF(
  @col_exists > 0,
  'ALTER TABLE users DROP COLUMN email',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
