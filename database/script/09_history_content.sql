USE `municipalidad_trancas`;

CREATE TABLE IF NOT EXISTS `history_content` (
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

ALTER TABLE `history_content`
  ADD COLUMN IF NOT EXISTS `intro_story_text` TEXT NOT NULL AFTER `hero_image_url`;

ALTER TABLE `history_content`
  DROP COLUMN IF EXISTS `milestones_json`;

INSERT INTO `history_content` (
  `id`,
  `intro_story_text`,
  `legacy_items_json`,
  `tourism_categories_json`,
  `tourism_spots_json`
)
SELECT
  1,
  '',
  JSON_ARRAY(),
  JSON_ARRAY(),
  JSON_ARRAY()
WHERE NOT EXISTS (SELECT 1 FROM `history_content` WHERE `id` = 1);

UPDATE `history_content`
SET `cta_primary_label` = 'Leer resumen histórico',
    `cta_primary_href` = '#resumen-historia'
WHERE `cta_primary_href` = '#linea-tiempo';
