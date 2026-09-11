import { prisma } from "@/shared/lib/infra/prisma";
import type { CreateArticleInput, UpdateArticleInput } from "./validations";

export interface ArticleCategoryDto {
  id: string;
  nameTh: string;
  nameEn: string;
  slug: string;
}

export interface ArticleDto {
  id: string;
  tenantId: string;
  categoryId: string;
  categoryNameTh?: string;
  categoryNameEn?: string;
  titleTh: string;
  titleEn: string;
  slug: string;
  excerptTh: string | null;
  excerptEn: string | null;
  contentTh: string;
  contentEn: string;
  coverImageUrl: string | null;
  status: string;
  publishedAt: string | null;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function listCategories(tenantId: string): Promise<ArticleCategoryDto[]> {
  await ensureDefaultCategories(tenantId);
  const categories = await prisma.articleCategory.findMany({
    where: { tenantId },
    orderBy: { orderIndex: "asc" },
  });
  return categories.map((c) => ({
    id: c.id,
    nameTh: c.nameTh,
    nameEn: c.nameEn,
    slug: c.slug,
  }));
}

export async function ensureDefaultCategories(tenantId: string) {
  const count = await prisma.articleCategory.count({ where: { tenantId } });
  if (count === 0) {
    await prisma.articleCategory.createMany({
      data: [
        { tenantId, nameTh: "ข่าวประชาสัมพันธ์ทั่วไป", nameEn: "General PR News", slug: "general", orderIndex: 1 },
        { tenantId, nameTh: "ข่าวกิจกรรมและอบรม", nameEn: "Activities & Training", slug: "activities", orderIndex: 2 },
        { tenantId, nameTh: "ข่าววิชาการและวิจัย", nameEn: "Academic & Research", slug: "academic", orderIndex: 3 },
        { tenantId, nameTh: "ประกาศและจัดซื้อจัดจ้าง", nameEn: "Announcements & Procurement", slug: "announcements", orderIndex: 4 },
      ],
    });
  }
}

export async function listArticles(tenantId: string): Promise<ArticleDto[]> {
  await ensureDefaultCategories(tenantId);
  const rows = await prisma.article.findMany({
    where: { tenantId },
    include: { category: true },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    categoryId: r.categoryId,
    categoryNameTh: r.category.nameTh,
    categoryNameEn: r.category.nameEn,
    titleTh: r.titleTh,
    titleEn: r.titleEn,
    slug: r.slug,
    excerptTh: r.excerptTh,
    excerptEn: r.excerptEn,
    contentTh: r.contentTh,
    contentEn: r.contentEn,
    coverImageUrl: r.coverImageUrl,
    status: r.status,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    isPinned: r.isPinned,
    viewCount: r.viewCount,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function listPublishedArticles(tenantId: string, limit = 10): Promise<ArticleDto[]> {
  await ensureDefaultCategories(tenantId);
  const rows = await prisma.article.findMany({
    where: { tenantId, status: "PUBLISHED" },
    include: { category: true },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    categoryId: r.categoryId,
    categoryNameTh: r.category.nameTh,
    categoryNameEn: r.category.nameEn,
    titleTh: r.titleTh,
    titleEn: r.titleEn,
    slug: r.slug,
    excerptTh: r.excerptTh,
    excerptEn: r.excerptEn,
    contentTh: r.contentTh,
    contentEn: r.contentEn,
    coverImageUrl: r.coverImageUrl,
    status: r.status,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    isPinned: r.isPinned,
    viewCount: r.viewCount,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getArticleBySlug(tenantId: string, slug: string): Promise<ArticleDto | null> {
  const r = await prisma.article.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
    include: { category: true },
  });
  if (!r) return null;

  await prisma.article.update({
    where: { id: r.id },
    data: { viewCount: { increment: 1 } },
  });

  return {
    id: r.id,
    tenantId: r.tenantId,
    categoryId: r.categoryId,
    categoryNameTh: r.category.nameTh,
    categoryNameEn: r.category.nameEn,
    titleTh: r.titleTh,
    titleEn: r.titleEn,
    slug: r.slug,
    excerptTh: r.excerptTh,
    excerptEn: r.excerptEn,
    contentTh: r.contentTh,
    contentEn: r.contentEn,
    coverImageUrl: r.coverImageUrl,
    status: r.status,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    isPinned: r.isPinned,
    viewCount: r.viewCount + 1,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createArticle(tenantId: string, authorId: string | null, input: CreateArticleInput): Promise<ArticleDto> {
  const publishedAt = input.status === "PUBLISHED" ? new Date() : null;
  const created = await prisma.article.create({
    data: {
      tenantId,
      authorId,
      categoryId: input.categoryId,
      titleTh: input.titleTh,
      titleEn: input.titleEn,
      slug: input.slug,
      excerptTh: input.excerptTh ?? null,
      excerptEn: input.excerptEn ?? null,
      contentTh: input.contentTh,
      contentEn: input.contentEn,
      coverImageUrl: input.coverImageUrl || null,
      status: input.status,
      isPinned: input.isPinned,
      publishedAt,
    },
    include: { category: true },
  });

  return {
    id: created.id,
    tenantId: created.tenantId,
    categoryId: created.categoryId,
    categoryNameTh: created.category.nameTh,
    categoryNameEn: created.category.nameEn,
    titleTh: created.titleTh,
    titleEn: created.titleEn,
    slug: created.slug,
    excerptTh: created.excerptTh,
    excerptEn: created.excerptEn,
    contentTh: created.contentTh,
    contentEn: created.contentEn,
    coverImageUrl: created.coverImageUrl,
    status: created.status,
    publishedAt: created.publishedAt?.toISOString() ?? null,
    isPinned: created.isPinned,
    viewCount: created.viewCount,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateArticle(tenantId: string, input: UpdateArticleInput): Promise<ArticleDto> {
  const existing = await prisma.article.findUnique({ where: { id: input.id, tenantId } });
  const publishedAt =
    input.status === "PUBLISHED" && (!existing || !existing.publishedAt)
      ? new Date()
      : existing?.publishedAt ?? null;

  const updated = await prisma.article.update({
    where: { id: input.id, tenantId },
    data: {
      categoryId: input.categoryId,
      titleTh: input.titleTh,
      titleEn: input.titleEn,
      slug: input.slug,
      excerptTh: input.excerptTh ?? null,
      excerptEn: input.excerptEn ?? null,
      contentTh: input.contentTh,
      contentEn: input.contentEn,
      coverImageUrl: input.coverImageUrl || null,
      status: input.status,
      isPinned: input.isPinned,
      publishedAt,
    },
    include: { category: true },
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    categoryId: updated.categoryId,
    categoryNameTh: updated.category.nameTh,
    categoryNameEn: updated.category.nameEn,
    titleTh: updated.titleTh,
    titleEn: updated.titleEn,
    slug: updated.slug,
    excerptTh: updated.excerptTh,
    excerptEn: updated.excerptEn,
    contentTh: updated.contentTh,
    contentEn: updated.contentEn,
    coverImageUrl: updated.coverImageUrl,
    status: updated.status,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
    isPinned: updated.isPinned,
    viewCount: updated.viewCount,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteArticle(tenantId: string, id: string): Promise<void> {
  await prisma.article.delete({
    where: { id, tenantId },
  });
}
