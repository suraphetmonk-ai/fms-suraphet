import { requirePermission, hasPermission } from "@/features/identity/server";
import { NEWS_P, listArticles, listCategories } from "@/features/news/server";
import { NewsAdminClient } from "./_components/news-admin-client";

export default async function NewsAdminPage() {
  const ctx = await requirePermission(NEWS_P.newsRead);
  const [initialArticles, categories] = await Promise.all([
    listArticles(ctx.tenantId),
    listCategories(ctx.tenantId),
  ]);

  return (
    <NewsAdminClient
      initialArticles={initialArticles}
      categories={categories}
      canCreate={hasPermission(ctx, NEWS_P.newsCreate)}
      canUpdate={hasPermission(ctx, NEWS_P.newsUpdate)}
      canDelete={hasPermission(ctx, NEWS_P.newsDelete)}
    />
  );
}
