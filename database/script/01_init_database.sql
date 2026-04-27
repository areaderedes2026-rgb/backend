-- =============================================================================
-- Inicialización: crea la base de datos (si no existe) y todas las tablas.
-- Uso en consola:
--   mysql -u root -p < database/script/01_init_database.sql
-- En MySQL Workbench: File → Open SQL Script → ejecutar todo (rayo).
-- =============================================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS municipalidad_trancas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE municipalidad_trancas;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `news_images`;
DROP TABLE IF EXISTS `news`;
DROP TABLE IF EXISTS `home_map_content`;
DROP TABLE IF EXISTS `citizen_inquiries`;
DROP TABLE IF EXISTS `citizen_attention_content`;
DROP TABLE IF EXISTS `area_profiles`;
DROP TABLE IF EXISTS `areas`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(32) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL DEFAULT '',
  `role` ENUM('admin', 'editor') NOT NULL DEFAULT 'editor',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  KEY `users_role_idx` (`role`),
  KEY `users_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(130) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`),
  UNIQUE KEY `categories_name_unique` (`name`),
  KEY `categories_sort_idx` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`name`, `slug`, `sort_order`) VALUES
  ('General', 'general', 0),
  ('Institucional', 'institucional', 10),
  ('Obras', 'obras', 20),
  ('Salud', 'salud', 30),
  ('Cultura', 'cultura', 40),
  ('Medio ambiente', 'medio-ambiente', 50),
  ('Deportes', 'deportes', 60);

CREATE TABLE `news` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(220) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `summary` TEXT NOT NULL,
  `body` MEDIUMTEXT NOT NULL,
  `published_at` DATETIME(3) NOT NULL,
  `category_id` INT UNSIGNED NULL,
  `image_url` VARCHAR(2048) NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `news_slug_unique` (`slug`),
  KEY `news_published_idx` (`published_at`),
  KEY `news_category_fk_idx` (`category_id`),
  CONSTRAINT `news_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `news_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `news_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `news_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(2048) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `news_images_news_idx` (`news_id`),
  CONSTRAINT `news_images_news_fk` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `areas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(90) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `description` TEXT NOT NULL,
  `cover_image_url` VARCHAR(2048) NOT NULL DEFAULT '',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `areas_slug_unique` (`slug`),
  UNIQUE KEY `areas_title_unique` (`title`),
  KEY `areas_sort_idx` (`sort_order`),
  KEY `areas_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `areas` (`slug`, `title`, `description`, `cover_image_url`, `sort_order`) VALUES
  ('asuntos-sociales', 'Asuntos Sociales', 'Programas y acompañamiento a familias y grupos vulnerables de la comunidad.', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80', 10),
  ('deportes', 'Deportes', 'Instalaciones deportivas, escuelas y actividades para todas las edades.', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80', 20),
  ('medio-ambiente', 'Medio ambiente', 'Gestión ambiental local, saneamiento y concientización.', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', 30),
  ('medio-comunicacion', 'Medio de comunicación', 'Difusión de información oficial y canales de la municipalidad.', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80', 40),
  ('obras-publicas', 'Obras públicas', 'Infraestructura, mantenimiento de calles y espacios públicos.', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80', 50),
  ('punto-verde', 'Punto Verde', 'Recepción de residuos reciclables y campañas de recolección.', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80', 60),
  ('cultura', 'Cultura', 'Talleres, eventos y espacios para el desarrollo cultural local.', 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80', 70);

CREATE TABLE `area_profiles` (
  `slug` VARCHAR(90) NOT NULL,
  `hero_tag` VARCHAR(140) NOT NULL DEFAULT '',
  `mission` TEXT NOT NULL,
  `director_name` VARCHAR(140) NOT NULL DEFAULT '',
  `director_role` VARCHAR(160) NOT NULL DEFAULT '',
  `director_bio` TEXT NOT NULL,
  `director_photo_url` VARCHAR(2048) NOT NULL DEFAULT '',
  `director_email` VARCHAR(180) NOT NULL DEFAULT '',
  `director_phone` VARCHAR(80) NOT NULL DEFAULT '',
  `director_office_hours` VARCHAR(140) NOT NULL DEFAULT '',
  `services_json` JSON NOT NULL,
  `initiatives_json` JSON NOT NULL,
  `contacts_json` JSON NOT NULL,
  `notices_json` JSON NOT NULL,
  `location_address` VARCHAR(240) NOT NULL DEFAULT '',
  `location_references` VARCHAR(280) NOT NULL DEFAULT '',
  `location_map_embed_url` VARCHAR(2048) NOT NULL DEFAULT '',
  `location_map_external_url` VARCHAR(2048) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`slug`),
  CONSTRAINT `area_profiles_area_fk` FOREIGN KEY (`slug`) REFERENCES `areas` (`slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `history_content` (
  `id` TINYINT UNSIGNED NOT NULL,
  `hero_badge` VARCHAR(120) NOT NULL DEFAULT '',
  `hero_title` VARCHAR(180) NOT NULL DEFAULT '',
  `hero_subtitle` TEXT NOT NULL,
  `hero_image_url` VARCHAR(2048) NOT NULL DEFAULT '',
  `intro_story_text` TEXT NOT NULL,
  `cta_primary_label` VARCHAR(80) NOT NULL DEFAULT '',
  `cta_primary_href` VARCHAR(2048) NOT NULL DEFAULT '',
  `cta_secondary_label` VARCHAR(80) NOT NULL DEFAULT '',
  `cta_secondary_href` VARCHAR(2048) NOT NULL DEFAULT '',
  `legacy_items_json` JSON NOT NULL,
  `tourism_categories_json` JSON NOT NULL,
  `tourism_spots_json` JSON NOT NULL,
  `closing_title` VARCHAR(180) NOT NULL DEFAULT '',
  `closing_text` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tourism_places` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(90) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `category` VARCHAR(80) NOT NULL DEFAULT '',
  `short_description` TEXT NOT NULL,
  `full_description` LONGTEXT NOT NULL,
  `image_url` VARCHAR(2048) NOT NULL DEFAULT '',
  `gallery_json` JSON NOT NULL,
  `address` VARCHAR(260) NOT NULL DEFAULT '',
  `how_to_get` TEXT NOT NULL,
  `map_embed_url` VARCHAR(2048) NOT NULL DEFAULT '',
  `map_external_url` VARCHAR(2048) NOT NULL DEFAULT '',
  `contact_phone` VARCHAR(80) NOT NULL DEFAULT '',
  `contact_email` VARCHAR(180) NOT NULL DEFAULT '',
  `contact_whatsapp` VARCHAR(80) NOT NULL DEFAULT '',
  `visiting_hours` VARCHAR(180) NOT NULL DEFAULT '',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tourism_places_slug_unique` (`slug`),
  UNIQUE KEY `tourism_places_name_unique` (`name`),
  KEY `tourism_places_sort_idx` (`sort_order`),
  KEY `tourism_places_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `citizen_attention_content` (
  `id` TINYINT UNSIGNED NOT NULL,
  `hero_eyebrow` VARCHAR(120) NOT NULL DEFAULT '',
  `hero_title` VARCHAR(180) NOT NULL DEFAULT '',
  `hero_subtitle` TEXT NOT NULL,
  `hero_image_url` VARCHAR(2048) NOT NULL DEFAULT '',
  `channels_json` JSON NOT NULL,
  `faq_json` JSON NOT NULL,
  `tips_json` JSON NOT NULL,
  `form_topics_json` JSON NOT NULL,
  `form_intro_text` TEXT NOT NULL,
  `final_cta_title` VARCHAR(180) NOT NULL DEFAULT '',
  `final_cta_text` TEXT NOT NULL,
  `final_primary_label` VARCHAR(80) NOT NULL DEFAULT '',
  `final_primary_href` VARCHAR(2048) NOT NULL DEFAULT '',
  `final_secondary_label` VARCHAR(80) NOT NULL DEFAULT '',
  `final_secondary_href` VARCHAR(2048) NOT NULL DEFAULT '',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `home_map_content` (
  `id` TINYINT UNSIGNED NOT NULL,
  `center_lat` DECIMAL(10, 7) NOT NULL DEFAULT -26.2312000,
  `center_lng` DECIMAL(10, 7) NOT NULL DEFAULT -65.2818000,
  `zoom_level` TINYINT UNSIGNED NOT NULL DEFAULT 14,
  `points_json` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `citizen_inquiries` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(120) NOT NULL,
  `last_name` VARCHAR(120) NOT NULL,
  `dni` VARCHAR(20) NOT NULL,
  `email` VARCHAR(180) NOT NULL,
  `phone` VARCHAR(80) NOT NULL DEFAULT '',
  `topic` VARCHAR(40) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('sin_resolver', 'leida', 'resuelta') NOT NULL DEFAULT 'sin_resolver',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `citizen_inquiries_status_idx` (`status`),
  KEY `citizen_inquiries_created_idx` (`created_at`),
  KEY `citizen_inquiries_dni_idx` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuario administrador: ejecutá 02_seed_admin_workbench.sql
