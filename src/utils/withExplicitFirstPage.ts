type PaginatedRoute = {
  params: Record<string, string | undefined>;
  props?: Record<string, unknown>;
};

/**
 * AstroPaper v4 emitted page one of every paginated listing twice: once at the
 * bare path (`/posts/`) and once at the explicit page number (`/posts/1/`).
 * `paginate()` only emits the bare path, so the numbered alias is re-added here
 * to keep the URLs that are already live and indexed.
 */
export function withExplicitFirstPage<T extends PaginatedRoute>(
  routes: T[]
): T[] {
  const firstPage = routes[0];
  if (!firstPage) return routes;

  return [
    ...routes,
    { ...firstPage, params: { ...firstPage.params, page: "1" } },
  ];
}
