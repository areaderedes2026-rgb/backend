/**
 * Convierte fila MySQL (snake_case) al formato esperado por el frontend (camelCase).
 */
export function mapNewsRow(row, galleryUrls = []) {
  if (!row) return null
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    publishedAt: row.published_at
      ? new Date(row.published_at).toISOString()
      : null,
    category: row.category_name ?? 'General',
    categoryId:
      row.category_id != null ? String(row.category_id) : null,
    imageUrl: row.image_url ?? null,
    galleryUrls: Array.isArray(galleryUrls) ? galleryUrls : [],
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString()
      : undefined,
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toISOString()
      : undefined,
    createdBy: row.created_by != null ? String(row.created_by) : null,
  }
}

export function mapUserPublic(row) {
  if (!row) return null
  return {
    id: String(row.id),
    username: row.username,
    name: row.full_name,
    fullName: row.full_name,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString()
      : undefined,
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toISOString()
      : undefined,
  }
}
