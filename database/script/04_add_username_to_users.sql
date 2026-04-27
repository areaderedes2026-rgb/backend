-- =============================================================================
-- Migración: agrega `username` para inicio de sesión (además del email único).
-- Ejecutar en bases ya creadas con 01_init_database.sql antiguo (sin username).
-- En instalaciones nuevas, 01 ya incluye la columna: este script es idempotente
-- razonable si se omite tras recrear la BD.
-- =============================================================================

USE municipalidad_trancas;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'username'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN username VARCHAR(32) NULL AFTER id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE users SET username = CONCAT('user_', id) WHERE username IS NULL;

UPDATE users SET username = 'admin' WHERE email = 'admin@municipalidad.local' LIMIT 1;

ALTER TABLE users MODIFY username VARCHAR(32) NOT NULL;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'users_username_unique'
);

SET @sql2 := IF(
  @idx_exists = 0,
  'ALTER TABLE users ADD UNIQUE KEY users_username_unique (username)',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
