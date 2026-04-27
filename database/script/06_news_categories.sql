-- =============================================================================
-- Migración: tabla `categories`, `news.category_id` y retiro de `news.category`.
-- Ejecutar en bases creadas con el esquema anterior (columna category VARCHAR).
-- En instalaciones nuevas usá solo 01_init_database.sql actualizado.
-- =============================================================================

USE municipalidad_trancas;

SET FOREIGN_KEY_CHECKS = 0;

SET @cat_table := (
  SELECT COUNT(*) FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories'
);

SET @sql := IF(
  @cat_table = 0,
  'CREATE TABLE `categories` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(130) NOT NULL,
    `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `categories_slug_unique` (`slug`),
    UNIQUE KEY `categories_name_unique` (`name`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT 1'
);
PREPARE st FROM @sql;
EXECUTE st;
DEALLOCATE PREPARE st;

INSERT IGNORE INTO categories (name, slug, sort_order) VALUES
  ('General', 'general', 0);

SET @col_cat_id := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news' AND COLUMN_NAME = 'category_id'
);

SET @sql2 := IF(
  @col_cat_id = 0,
  'ALTER TABLE news ADD COLUMN category_id INT UNSIGNED NULL AFTER published_at',
  'SELECT 1'
);
PREPARE st2 FROM @sql2;
EXECUTE st2;
DEALLOCATE PREPARE st2;

INSERT INTO categories (name, slug, sort_order)
SELECT DISTINCT TRIM(n.category) AS nm,
  CONCAT('m-', SUBSTRING(MD5(CONCAT(TRIM(n.category), DATABASE())), 1, 24)),
  100
FROM news n
WHERE TRIM(n.category) <> ''
  AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = TRIM(n.category));

UPDATE news n
INNER JOIN categories c ON c.name = TRIM(n.category)
SET n.category_id = c.id
WHERE n.category_id IS NULL;

UPDATE news SET category_id = (SELECT id FROM categories WHERE slug = 'general' LIMIT 1)
WHERE category_id IS NULL;

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'news'
    AND CONSTRAINT_NAME = 'news_category_fk'
);

SET @sql3 := IF(
  @fk_exists = 0,
  'ALTER TABLE news ADD CONSTRAINT news_category_fk FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE st3 FROM @sql3;
EXECUTE st3;
DEALLOCATE PREPARE st3;

SET @idx_old := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news' AND INDEX_NAME = 'news_category_idx'
);
SET @sql4 := IF(@idx_old > 0, 'ALTER TABLE news DROP INDEX news_category_idx', 'SELECT 1');
PREPARE st4 FROM @sql4;
EXECUTE st4;
DEALLOCATE PREPARE st4;

SET @col_old := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news' AND COLUMN_NAME = 'category'
);
SET @sql5 := IF(@col_old > 0, 'ALTER TABLE news DROP COLUMN category', 'SELECT 1');
PREPARE st5 FROM @sql5;
EXECUTE st5;
DEALLOCATE PREPARE st5;

SET FOREIGN_KEY_CHECKS = 1;
