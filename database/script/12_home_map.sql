USE `municipalidad_trancas`;

CREATE TABLE IF NOT EXISTS `home_map_content` (
  `id` TINYINT UNSIGNED NOT NULL,
  `center_lat` DECIMAL(10, 7) NOT NULL DEFAULT -26.2312000,
  `center_lng` DECIMAL(10, 7) NOT NULL DEFAULT -65.2818000,
  `zoom_level` TINYINT UNSIGNED NOT NULL DEFAULT 14,
  `points_json` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `home_map_content` (`id`, `center_lat`, `center_lng`, `zoom_level`, `points_json`)
SELECT
  1,
  -26.2312000,
  -65.2818000,
  14,
  JSON_ARRAY(
    JSON_OBJECT(
      'id', 'municipalidad',
      'title', 'Municipalidad de Trancas',
      'subtitle', 'Atención central',
      'description', 'Sede principal para consultas generales, trámites y atención al vecino.',
      'address', 'Trancas, Tucumán',
      'pointType', 'institucional',
      'lat', -26.2312000,
      'lng', -65.2818000,
      'isActive', TRUE,
      'sortOrder', 10
    ),
    JSON_OBJECT(
      'id', 'hospital',
      'title', 'Hospital de Trancas',
      'subtitle', 'Salud',
      'description', 'Atención médica y guardia para la comunidad.',
      'address', 'Zona centro, Trancas',
      'pointType', 'salud',
      'lat', -26.2334000,
      'lng', -65.2861000,
      'isActive', TRUE,
      'sortOrder', 20
    ),
    JSON_OBJECT(
      'id', 'terminal',
      'title', 'Terminal de ómnibus',
      'subtitle', 'Transporte',
      'description', 'Conectividad interurbana y servicios de transporte de pasajeros.',
      'address', 'Acceso principal, Trancas',
      'pointType', 'transporte',
      'lat', -26.2279000,
      'lng', -65.2794000,
      'isActive', TRUE,
      'sortOrder', 30
    )
  )
WHERE NOT EXISTS (SELECT 1 FROM `home_map_content` WHERE id = 1);
