-- =============================================================================
-- Usuario administrador (MySQL Workbench o consola)
-- Ejecutar DESPUÉS de 01_init_database.sql
--
-- Usuario:  admin
-- Contraseña: 123123
--
-- El campo password_hash es bcrypt (10 rounds), compatible con el backend Node.
-- Si ya existe el usuario `admin`, se actualizan contraseña y datos.
-- =============================================================================

USE municipalidad_trancas;

INSERT INTO users (username, password_hash, full_name, role, is_active)
VALUES (
  'admin',
  '$2b$10$tkRIlyuGlC1NUDKWfVjDhue8.5LKqdcuDazsvpg9ntayPRrdDFIzC',
  'Administrador',
  'admin',
  1
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  role = VALUES(role),
  is_active = VALUES(is_active);
