import { sanitizeString } from "@/lib/validation";

/**
 * Build Prisma-style search query for text fields.
 */
export function buildSearchQuery(
  searchTerm: string,
  fields: string[]
): Record<string, any> {
  if (!searchTerm?.trim()) return {};

  const sanitized = sanitizeString(searchTerm);
  const searchConditions = fields.map((field) => ({
    [field]: { contains: sanitized, mode: "insensitive" }
  }));

  return { OR: searchConditions };
}

/**
 * Build Prisma-style tag filter query.
 */
export function buildTagQuery(tag: string | null): Record<string, any> {
  if (!tag) return {};
  return { tags: { hasSome: [sanitizeString(tag)] } };
}

/**
 * Build category filter query.
 */
export function buildCategoryQuery(category: string | null): Record<string, any> {
  if (!category || category === "all") return {};
  return { category: sanitizeString(category) };
}

/**
 * Build album filter query.
 */
export function buildAlbumQuery(album: string | null): Record<string, any> {
  if (!album || album === "all") return {};
  return { album: sanitizeString(album) };
}

/**
 * Build user filter query.
 * For PostgreSQL/Prisma IDs, we only validate non-empty string.
 */
export function buildUserQuery(
  userId: string | null,
  fieldName: string = "userId"
): Record<string, any> {
  if (!userId) return {};

  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error("Invalid user ID format");
  }

  return { [fieldName]: normalizedUserId };
}

/**
 * Build Prisma-style date range query.
 */
export function buildDateRangeQuery(
  startDate?: string | null,
  endDate?: string | null,
  fieldName: string = "createdAt"
): Record<string, any> {
  const query: Record<string, any> = {};

  if (startDate) {
    query[fieldName] = { ...query[fieldName], gte: new Date(startDate) };
  }

  if (endDate) {
    query[fieldName] = { ...query[fieldName], lte: new Date(endDate) };
  }

  return query;
}

/**
 * Merge multiple query objects.
 */
export function mergeQueries(...queries: Record<string, any>[]): Record<string, any> {
  return Object.assign({}, ...queries);
}

/**
 * Build Prisma-style sort options from request parameters.
 */
export function buildSortOptions(
  sortBy: string = "createdAt",
  sortOrder: string = "desc"
): Record<string, "asc" | "desc"> {
  const order: "asc" | "desc" = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";
  return { [sortBy]: order };
}

/**
 * Common query options for optimized reads.
 * Kept for compatibility in template code paths.
 */
export const LEAN_QUERY_OPTIONS = {
  cache: false,
};

/**
 * Build a Prisma-friendly aggregation descriptor.
 */
export function buildContentAggregation(
  matchQuery: Record<string, any>,
  userFieldName: string = "user"
) {
  return {
    where: matchQuery,
    include: {
      [userFieldName]: {
        select: {
          id: true,
          username: true,
          avatar: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
  };
}
