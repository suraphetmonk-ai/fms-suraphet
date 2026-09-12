import Link from "next/link";
import { getLocale } from "@/shared/lib/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { listPublishedArticles, listCategories } from "@/features/news/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { Calendar, Eye, Pin, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PublicNewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const locale = await getLocale();
  const isTh = locale === "th";

  const tenant = await prisma.tenant.findFirst();
  const tenantId = tenant?.id ?? "";

  const [articles, categories] = await Promise.all([
    listPublishedArticles(tenantId, 50),
    listCategories(tenantId),
  ]);

  const filtered = cat
    ? articles.filter((a) => a.categoryId === cat)
    : articles;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {isTh ? "ข่าวสารและประกาศประชาสัมพันธ์" : "News & Faculty Announcements"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTh
              ? "ติดตามข่าวสาร กิจกรรม อบรมสัมมนา และประกาศสำคัญของคณะ"
              : "Stay updated with latest news, activities, seminars, and faculty announcements"}
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2 shrink-0">
          <Link href="/admin/news">
            <Newspaper className="h-4 w-4" />
            {isTh ? "จัดการข่าวสาร (Admin)" : "Manage News (Admin)"}
          </Link>
        </Button>
      </div>


      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          asChild
          variant={!cat ? "default" : "outline"}
          size="sm"
          className="rounded-full"
        >
          <Link href="/news">{isTh ? "ข่าวทั้งหมด" : "All News"}</Link>
        </Button>
        {categories.map((c) => (
          <Button
            key={c.id}
            asChild
            variant={cat === c.id ? "default" : "outline"}
            size="sm"
            className="rounded-full"
          >
            <Link href={`/news?cat=${c.id}`}>
              {isTh ? c.nameTh : c.nameEn}
            </Link>
          </Button>
        ))}
      </div>

      {/* News Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-card text-muted-foreground">
          {isTh ? "ไม่พบข่าวสารในหมวดหมู่นี้" : "No news articles found in this category."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all hover:border-primary/50"
            >
              {item.coverImageUrl ? (
                <div className="h-48 w-full overflow-hidden bg-muted">
                  <img
                    src={item.coverImageUrl}
                    alt={item.titleTh}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="h-48 w-full bg-primary/5 flex items-center justify-center text-primary/40">
                  <Newspaper className="h-12 w-12" />
                </div>
              )}

              <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {isTh ? item.categoryNameTh : item.categoryNameEn}
                    </span>
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                        <Pin className="h-3 w-3 fill-current" />
                        {isTh ? "ปักหมุด" : "Pinned"}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {isTh ? item.titleTh : item.titleEn}
                  </h3>

                  {item.excerptTh && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {isTh ? item.excerptTh : item.excerptEn || item.excerptTh}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.publishedAt ? formatDate(new Date(item.publishedAt), locale) : "-"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {item.viewCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
