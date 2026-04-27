-- =============================================================================
-- Migración: catálogo dinámico de áreas + relación con area_profiles.
-- =============================================================================

USE municipalidad_trancas;

SET @areas_table := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'areas'
);

SET @sql := IF(
  @areas_table = 0,
  'CREATE TABLE `areas` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(90) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `description` TEXT NOT NULL,
    `cover_image_url` VARCHAR(2048) NOT NULL DEFAULT '''',
    `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `areas_slug_unique` (`slug`),
    UNIQUE KEY `areas_title_unique` (`title`),
    KEY `areas_sort_idx` (`sort_order`),
    KEY `areas_active_idx` (`is_active`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT 1'
);

PREPARE st FROM @sql;
EXECUTE st;
DEALLOCATE PREPARE st;

INSERT IGNORE INTO `areas` (`slug`, `title`, `description`, `cover_image_url`, `sort_order`) VALUES
  ('asuntos-sociales', 'Asuntos Sociales', 'Programas y acompañamiento a familias y grupos vulnerables de la comunidad.', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80', 10),
  ('deportes', 'Deportes', 'Instalaciones deportivas, escuelas y actividades para todas las edades.', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80', 20),
  ('medio-ambiente', 'Medio ambiente', 'Gestión ambiental local, saneamiento y concientización.', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', 30),
  ('medio-comunicacion', 'Medio de comunicación', 'Difusión de información oficial y canales de la municipalidad.', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80', 40),
  ('obras-publicas', 'Obras públicas', 'Infraestructura, mantenimiento de calles y espacios públicos.', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80', 50),
  ('punto-verde', 'Punto Verde', 'Recepción de residuos reciclables y campañas de recolección.', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80', 60),
  ('cultura', 'Cultura', 'Talleres, eventos y espacios para el desarrollo cultural local.', 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80', 70);

SET @profiles_table := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'area_profiles'
);

SET @sql2 := IF(
  @profiles_table > 0,
  'INSERT IGNORE INTO areas (slug, title, description, cover_image_url, sort_order)
   SELECT ap.slug,
          CONCAT(UCASE(LEFT(REPLACE(ap.slug, ''-'', '' ''), 1)), SUBSTRING(REPLACE(ap.slug, ''-'', '' ''), 2)),
          ''Área creada desde perfiles de contenido.'',
          '''',
          999
   FROM area_profiles ap',
  'SELECT 1'
);
PREPARE st2 FROM @sql2;
EXECUTE st2;
DEALLOCATE PREPARE st2;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'area_profiles'
    AND CONSTRAINT_NAME = 'area_profiles_area_fk'
);

SET @sql3 := IF(
  @profiles_table > 0 AND @fk_exists = 0,
  'ALTER TABLE area_profiles
     ADD CONSTRAINT area_profiles_area_fk
     FOREIGN KEY (slug) REFERENCES areas (slug) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE st3 FROM @sql3;
EXECUTE st3;
DEALLOCATE PREPARE st3;
