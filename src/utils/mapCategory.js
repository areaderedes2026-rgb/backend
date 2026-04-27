export function mapCategoryRow(row) {
  if (!row) return null
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString()
      : undefined,
    updatedAt: row.updated_at
      ? new Date(row.updated_at).toISOString()
      : undefined,
  }
}
