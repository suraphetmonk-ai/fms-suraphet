import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/shared/lib/i18n/server";
import { formatDate } from "@/shared/lib/format";
import { getArticleBySlug } from "@/features/news/server";
import { prisma } from "@/shared/lib/infra/prisma";
import { Calendar, Eye, ArrowLeft, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PublicNewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const isTh = locale === "th";

  const tenant = await prisma.tenant.findFirst();
  const tenantId = tenant?.id ?? "";

  const article = await getArticleBySlug(tenantId, decodeURIComponent(slug));
  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground">
          <Link href="/news">
            <ArrowLeft className="h-4 w-4" />
            <span>{isTh ? "กลับหน้ารวมข่าว" : "Back to News"}</span>
          </Link>
        </Button>
      </div>

      {/* Title & Metadata */}
      <header className="space-y-4 border-b pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {isTh ? article.categoryNameTh : article.categoryNameEn}
          </span>
          {article.isPinned && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 font-medium">
              <Pin className="h-3 w-3 fill-current" />
              {isTh ? "ข่าวปักหมุดเด่น" : "Pinned"}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-snug">
          {isTh ? article.titleTh : article.titleEn}
        </h1>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {article.publishedAt ? formatDate(new Date(article.publishedAt), locale) : "-"}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {article.viewCount} {isTh ? "ครั้ง" : "views"}
          </span>
        </div>
      </header>

      {/* Cover Image */}
      {article.coverImageUrl && (
        <div className="rounded-xl overflow-hidden border max-h-[480px] bg-muted">
          <img
            src={article.coverImageUrl}
            alt={article.titleTh}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Excerpt Lead */}
      {article.excerptTh && (
        <div className="p-4 rounded-lg bg-muted/40 border-l-4 border-primary text-sm font-medium text-foreground/90 leading-relaxed italic">
          {isTh ? article.excerptTh : article.excerptEn || article.excerptTh}
        </div>
      )}

      {/* Article Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-line text-base">
        {isTh ? article.contentTh : article.contentEn}
      </div>

      {/* Footer / Share */}
      <footer className="border-t pt-6 flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/news">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {isTh ? "ดูข่าวสารอื่น ๆ" : "More News"}
          </Link>
        </Button>
      </footer>
    </article>
  );
}
