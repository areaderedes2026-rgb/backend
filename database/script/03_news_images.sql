-- Migración: galería de imágenes por noticia (si ya tenías la BD sin esta tabla)
USE municipalidad_trancas;

CREATE TABLE IF NOT EXISTS `news_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `news_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(2048) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `news_images_news_idx` (`news_id`),
  CONSTRAINT `news_images_news_fk` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
