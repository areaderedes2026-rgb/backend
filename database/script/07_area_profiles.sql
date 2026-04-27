-- =============================================================================
-- Migración: crea tabla `area_profiles` si no existe.
-- =============================================================================

USE municipalidad_trancas;

SET @tbl := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'area_profiles'
);

SET @sql := IF(
  @tbl = 0,
  'CREATE TABLE `area_profiles` (
    `slug` VARCHAR(90) NOT NULL,
    `hero_tag` VARCHAR(140) NOT NULL DEFAULT '''',
    `mission` TEXT NOT NULL,
    `director_name` VARCHAR(140) NOT NULL DEFAULT '''',
    `director_role` VARCHAR(160) NOT NULL DEFAULT '''',
    `director_bio` TEXT NOT NULL,
    `director_photo_url` VARCHAR(2048) NOT NULL DEFAULT '''',
    `director_email` VARCHAR(180) NOT NULL DEFAULT '''',
    `director_phone` VARCHAR(80) NOT NULL DEFAULT '''',
    `director_office_hours` VARCHAR(140) NOT NULL DEFAULT '''',
    `services_json` JSON NOT NULL,
    `initiatives_json` JSON NOT NULL,
    `contacts_json` JSON NOT NULL,
    `notices_json` JSON NOT NULL,
    `location_address` VARCHAR(240) NOT NULL DEFAULT '''',
    `location_references` VARCHAR(280) NOT NULL DEFAULT '''',
    `location_map_embed_url` VARCHAR(2048) NOT NULL DEFAULT '''',
    `location_map_external_url` VARCHAR(2048) NOT NULL DEFAULT '''',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`slug`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT 1'
);

PREPARE st FROM @sql;
EXECUTE st;
DEALLOCATE PREPARE st;
