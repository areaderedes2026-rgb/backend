/**
 * Convierte fila MySQL (snake_case) al formato esperado por el frontend (camelCase).
 */
export function mapNewsRow(row, galleryUrls = []) {
  if (!row) return null
  const facebook = Number(row.share_facebook_count || 0)
  const whatsapp = Number(row.share_whatsapp_count || 0)
  const instagram = Number(row.share_instagram_count || 0)
  const native = Number(row.share_native_count || 0)
  const copyLink = Number(row.share_copy_link_count || 0)
  const totalShares = facebook + whatsapp + instagram + native + copyLink
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
    createdByUser:
      row.created_by != null
        ? {
            id: String(row.created_by),
            username: row.creator_username ?? null,
            fullName: row.creator_full_name ?? null,
          }
        : null,
    updatedBy: row.updated_by != null ? String(row.updated_by) : null,
    updatedByUser:
      row.updated_by != null
        ? {
            id: String(row.updated_by),
            username: row.editor_username ?? null,
            fullName: row.editor_full_name ?? null,
          }
        : null,
    stats: {
      views: Number(row.views_count || 0),
      shares: {
        facebook,
        whatsapp,
        instagram,
        native,
        copyLink,
        total: totalShares,
      },
      lastViewedAt: row.last_viewed_at
        ? new Date(row.last_viewed_at).toISOString()
        : null,
      lastSharedAt: row.last_shared_at
        ? new Date(row.last_shared_at).toISOString()
        : null,
    },
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
