USE `municipalidad_trancas`;

CREATE TABLE IF NOT EXISTS `citizen_attention_content` (
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

CREATE TABLE IF NOT EXISTS `citizen_inquiries` (
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

INSERT INTO `citizen_attention_content` (
  `id`,
  `hero_eyebrow`,
  `hero_title`,
  `hero_subtitle`,
  `hero_image_url`,
  `channels_json`,
  `faq_json`,
  `tips_json`,
  `form_topics_json`,
  `form_intro_text`,
  `final_cta_title`,
  `final_cta_text`,
  `final_primary_label`,
  `final_primary_href`,
  `final_secondary_label`,
  `final_secondary_href`
)
SELECT
  1,
  'Tu municipio te escucha',
  'Atención al ciudadano',
  'Un solo lugar para consultas, reclamos y orientación. Diseñamos esta experiencia para que encuentres rápido el canal adecuado y nos dejes tu mensaje con total claridad.',
  '/images/atencion-hero-bg.jpg',
  JSON_ARRAY(
    JSON_OBJECT('id', 'presencial', 'title', 'Mesa de entrada', 'subtitle', 'Documentación y trámites', 'description', 'Recibí asesoramiento sobre trámites, presentación de notas y constancias. Llevá DNI y, si aplica, la documentación respaldatoria.', 'accent', 'from-sky-600 to-cyan-600', 'icon', 'building'),
    JSON_OBJECT('id', 'telefono', 'title', 'Teléfonos útiles', 'subtitle', 'Voz a voz con el equipo', 'description', 'Comunicate con las áreas operativas. Tenemos derivación interna para que tu consulta llegue a quien corresponda.', 'accent', 'from-emerald-600 to-teal-600', 'icon', 'phone'),
    JSON_OBJECT('id', 'digital', 'title', 'Consulta web', 'subtitle', 'Este formulario', 'description', 'Dejanos tu mensaje detallado. Es la vía recomendada para reclamos, sugerencias o pedidos que requieran seguimiento por escrito.', 'accent', 'from-violet-600 to-indigo-600', 'icon', 'mail'),
    JSON_OBJECT('id', 'redes', 'title', 'Redes sociales', 'subtitle', 'Instagram y Facebook', 'description', 'Seguí novedades y avisos urgentes. Para trámites formales siempre preferimos mesa de entrada o consulta web.', 'accent', 'from-fuchsia-600 to-pink-600', 'icon', 'share')
  ),
  JSON_ARRAY(
    JSON_OBJECT('id', 'horario', 'q', '¿Cuál es el horario de atención al público?', 'a', 'De lunes a viernes de 8:00 a 14:00 en la sede central. Los feriados nacionales y provinciales no hay atención presencial salvo avisos especiales en redes.'),
    JSON_OBJECT('id', 'demora', 'q', '¿Cuánto tarda una respuesta por el formulario web?', 'a', 'Trabajamos con un plazo orientativo de hasta 48 horas hábiles para la primera respuesta. Temas complejos pueden requerir más tiempo; en ese caso te avisamos.'),
    JSON_OBJECT('id', 'urgente', 'q', '¿Dónde comunico una urgencia (ej. calle inundada)?', 'a', 'Para emergencias operativas usá la línea vecinal o los números publicados por Defensa Civil. Este sitio es informativo: en emergencias reales llamá al 100 o al servicio que corresponda.'),
    JSON_OBJECT('id', 'datos', 'q', '¿Mis datos están protegidos?', 'a', 'Sí. Solo usamos la información para gestionar tu consulta dentro del municipio. No compartimos datos con terceros sin base legal (demo: texto a completar con política oficial).')
  ),
  JSON_ARRAY(
    'Llevá siempre DNI o documento que acredite identidad en mesa de entrada.',
    'En consultas web, cuanto más contexto (dirección, fechas y referencias), mejor.'
  ),
  JSON_ARRAY(
    JSON_OBJECT('value', 'consulta', 'label', 'Consulta general'),
    JSON_OBJECT('value', 'reclamo', 'label', 'Reclamo o inconveniente'),
    JSON_OBJECT('value', 'sugerencia', 'label', 'Sugerencia o felicitación'),
    JSON_OBJECT('value', 'turno', 'label', 'Turno o documentación'),
    JSON_OBJECT('value', 'otro', 'label', 'Otro')
  ),
  'Completá tus datos para que podamos gestionar tu consulta.',
  '¿Preferís ver el mapa de servicios?',
  'Desde Servicios podés ubicar trámites y requisitos. La atención al ciudadano complementa esa información con contacto directo.',
  'Ir a Servicios',
  '/services',
  'Ver noticias',
  '/news'
WHERE NOT EXISTS (SELECT 1 FROM `citizen_attention_content` WHERE id = 1);
