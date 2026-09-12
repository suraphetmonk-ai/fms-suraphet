"use client";

import { useState, useTransition } from "react";
import { Plus, Edit, Trash2, Pin, Search, Eye, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { formatDate } from "@/shared/lib/format";
import {
  LiyonCard,
  StatusPill,
  LiyonField,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
} from "@/shared/components/liyon";
import type { ArticleDto, ArticleCategoryDto } from "@/features/news";
import {
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
  getArticlesAction,
  translateNewsWithGeminiAction,
} from "@/features/news/actions";


interface Props {
  initialArticles: ArticleDto[];
  categories: ArticleCategoryDto[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function NewsAdminClient({
  initialArticles,
  categories,
  canCreate,
  canUpdate,
  canDelete,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const [articles, setArticles] = useState<ArticleDto[]>(initialArticles);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Dialog State
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArticleDto | null>(null);
  const [isAiTranslating, setIsAiTranslating] = useState(false);


  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    categoryId: string;
    titleTh: string;
    titleEn: string;
    slug: string;
    excerptTh: string;
    excerptEn: string;
    contentTh: string;
    contentEn: string;
    coverImageUrl: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    isPinned: boolean;
  }>({
    categoryId: categories[0]?.id ?? "",
    titleTh: "",
    titleEn: "",
    slug: "",
    excerptTh: "",
    excerptEn: "",
    contentTh: "",
    contentEn: "",
    coverImageUrl: "",
    status: "PUBLISHED",
    isPinned: false,
  });

  const refresh = async () => {
    const res = await getArticlesAction();
    if (res.ok) setArticles(res.data);
  };

  const handleOpenCreate = () => {
    setFormData({
      categoryId: categories[0]?.id ?? "",
      titleTh: "",
      titleEn: "",
      slug: `news-${Date.now()}`,
      excerptTh: "",
      excerptEn: "",
      contentTh: "",
      contentEn: "",
      coverImageUrl: "",
      status: "PUBLISHED",
      isPinned: false,
    });
    setDialogMode("create");
  };

  const handleOpenEdit = (article: ArticleDto) => {
    setFormData({
      id: article.id,
      categoryId: article.categoryId,
      titleTh: article.titleTh,
      titleEn: article.titleEn,
      slug: article.slug,
      excerptTh: article.excerptTh ?? "",
      excerptEn: article.excerptEn ?? "",
      contentTh: article.contentTh,
      contentEn: article.contentEn,
      coverImageUrl: article.coverImageUrl ?? "",
      status: (article.status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT",
      isPinned: article.isPinned,
    });
    setDialogMode("edit");
  };

  const handleTitleThChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      titleTh: val,
      slug: dialogMode === "create" ? val.toLowerCase().replace(/[^a-zA-Z0-9ก-๙]+/g, "-").replace(/^-|-$/g, "") || `news-${Date.now()}` : prev.slug,
    }));
  };

  const handleAiTranslate = async () => {
    if (!formData.titleTh.trim() && !formData.contentTh.trim()) {
      toast.error(t("news.aiTranslatePromptTh"));
      return;
    }

    setIsAiTranslating(true);
    try {
      const res = await translateNewsWithGeminiAction({
        titleTh: formData.titleTh,
        excerptTh: formData.excerptTh,
        contentTh: formData.contentTh,
      });

      if (res.ok) {
        setFormData((prev) => ({
          ...prev,
          titleEn: res.data.titleEn,
          excerptEn: res.data.excerptEn,
          contentEn: res.data.contentEn,
          slug: res.data.slug || prev.slug,
        }));
        toast.success(t("news.aiTranslateSuccess"));
      } else {
        const msg = res.error.fieldErrors?.gemini?.[0] || res.error.fieldErrors?.titleTh?.[0] || res.error.message;
        toast.error(msg || t("news.aiTranslateApiKeyMissing"));
      }
    } catch {
      toast.error(t("news.aiTranslateApiKeyMissing"));
    } finally {
      setIsAiTranslating(false);
    }
  };

  const handleSubmit = () => {

    if (!formData.titleTh.trim()) {
      toast.error(t("news.titleTh") + " required");
      return;
    }
    if (!formData.contentTh.trim()) {
      toast.error(t("news.contentTh") + " required");
      return;
    }

    startTransition(async () => {
      if (dialogMode === "create") {
        const res = await createArticleAction(formData);
        if (res.ok) {
          toast.success(t("news.createSuccess"));
          setDialogMode(null);
          await refresh();
        } else {
          toast.error(res.error.message);
        }
      } else if (dialogMode === "edit") {
        const res = await updateArticleAction(formData);
        if (res.ok) {
          toast.success(t("news.updateSuccess"));
          setDialogMode(null);
          await refresh();
        } else {
          toast.error(res.error.message);
        }
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteArticleAction(deleteTarget.id);
      if (res.ok) {
        toast.success(t("news.deleteSuccess"));
        setDeleteTarget(null);
        await refresh();
      } else {
        toast.error(res.error.message);
      }
    });
  };

  const filtered = articles.filter((a) => {
    const matchesSearch =
      a.titleTh.toLowerCase().includes(search.toLowerCase()) ||
      a.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || a.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === "ALL" || a.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("news.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("news.subtitle")}</p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("news.create")}
          </Button>
        )}
      </div>

      {/* Filters & Search */}
      <LiyonCard className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาตามหัวข้อข่าว..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">-- ทุกหมวดหมู่ข่าว --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "en" ? c.nameEn : c.nameTh}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">-- ทุกสถานะ --</option>
              <option value="PUBLISHED">{t("news.status.published")}</option>
              <option value="DRAFT">{t("news.status.draft")}</option>
              <option value="ARCHIVED">{t("news.status.archived")}</option>
            </select>
          </div>
        </div>
      </LiyonCard>

      {/* Articles Table */}
      <LiyonCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">หัวข้อข่าว</th>
                <th className="px-4 py-3">หมวดหมู่</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">วันที่เผยแพร่</th>
                <th className="px-4 py-3 text-center">ยอดวิว</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {t("news.empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.isPinned && (
                          <span title="ปักหมุดข่าวเด่น" className="flex items-center text-amber-500">
                            <Pin className="h-4 w-4 fill-current" />
                          </span>
                        )}
                        <div>
                          <div className="font-medium text-foreground line-clamp-1">{item.titleTh}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{item.titleEn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {locale === "en" ? item.categoryNameEn : item.categoryNameTh}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusPill
                        tone={
                          item.status === "PUBLISHED"
                            ? "ok"
                            : item.status === "DRAFT"
                            ? "off"
                            : "warn"
                        }
                      >
                        {item.status === "PUBLISHED"
                          ? t("news.status.published")
                          : item.status === "DRAFT"
                          ? t("news.status.draft")
                          : t("news.status.archived")}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {item.publishedAt ? formatDate(new Date(item.publishedAt), locale) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {item.viewCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/news/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="ดูหน้าบ้าน"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title={t("news.edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="rounded p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                            title={t("news.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </LiyonCard>

      {/* Create / Edit Dialog */}
      {dialogMode && (
        <LiyonDialog open onOpenChange={(o) => !o && setDialogMode(null)}>
          <LiyonDialogHeader
            title={dialogMode === "create" ? t("news.create") : t("news.edit")}
            description="กรอกข้อมูลข่าวสารและประชาสัมพันธ์สำหรับเผยแพร่"
          />
          <LiyonDialogBody className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            {/* Gemini AI Translation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    {t("news.aiTranslate")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    กรอกข้อมูลภาษาไทย แล้วกดปุ่มนี้เพื่อแปลหัวข้อ สรุปย่อ เนื้อหา และสร้าง Slug ภาษาอังกฤษอัตโนมัติ
                  </div>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAiTranslate}
                disabled={isAiTranslating || (!formData.titleTh.trim() && !formData.contentTh.trim())}
                className="gap-2 shrink-0 bg-background hover:bg-primary hover:text-primary-foreground border-primary/30 transition-all cursor-pointer font-medium"
              >
                {isAiTranslating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t("news.aiTranslating")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>แปลเป็นอังกฤษด้วย AI</span>
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LiyonField label={t("news.titleTh")}>
                <input
                  type="text"
                  value={formData.titleTh}
                  onChange={(e) => handleTitleThChange(e.target.value)}
                  placeholder="เช่น พิธีไหว้ครู ประจำปีการศึกษา 2569"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("news.titleEn")}>
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="e.g. Teacher Appreciation Day 2026"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LiyonField label="URL Slug (สำหรับเว็บลิงก์)">
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. teacher-appreciation-day-2026"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("news.category")}>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {locale === "en" ? c.nameEn : c.nameTh}
                    </option>
                  ))}
                </select>
              </LiyonField>
            </div>

            <LiyonField label={t("news.coverImage")}>
              <input
                type="text"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </LiyonField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LiyonField label={t("news.excerpt") + " (ภาษาไทย)"}>
                <textarea
                  rows={2}
                  value={formData.excerptTh}
                  onChange={(e) => setFormData({ ...formData, excerptTh: e.target.value })}
                  placeholder="สรุปเนื้อหาข่าวสั้นๆ สำหรับแสดงในการ์ดหน้าแรก..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>

              <LiyonField label={t("news.excerpt") + " (English)"}>
                <textarea
                  rows={2}
                  value={formData.excerptEn}
                  onChange={(e) => setFormData({ ...formData, excerptEn: e.target.value })}
                  placeholder="Brief news summary for preview cards..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </LiyonField>
            </div>

            <LiyonField label={t("news.contentTh")}>
              <textarea
                rows={6}
                value={formData.contentTh}
                onChange={(e) => setFormData({ ...formData, contentTh: e.target.value })}
                placeholder="เนื้อหาข่าวแบบละเอียด (รองรับข้อความหลายย่อหน้า)..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-sans"
              />
            </LiyonField>

            <LiyonField label={t("news.contentEn")}>
              <textarea
                rows={5}
                value={formData.contentEn}
                onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                placeholder="English news content details..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-sans"
              />
            </LiyonField>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t">
              <LiyonField label={t("news.status")}>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="PUBLISHED">{t("news.status.published")}</option>
                  <option value="DRAFT">{t("news.status.draft")}</option>
                  <option value="ARCHIVED">{t("news.status.archived")}</option>
                </select>
              </LiyonField>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="isPinned" className="text-sm font-medium text-foreground cursor-pointer">
                  {t("news.isPinned")}
                </label>
              </div>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} disabled={isPending}>
              {t("news.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "กำลังบันทึก..." : t("news.save")}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <LiyonDialog open onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <LiyonDialogHeader
            title={t("news.delete")}
            description={t("news.deleteConfirm")}
          />
          <LiyonDialogBody>
            <div className="rounded-md border p-3 bg-muted/40">
              <p className="font-semibold text-foreground">{deleteTarget.titleTh}</p>
              <p className="text-xs text-muted-foreground">{deleteTarget.slug}</p>
            </div>
          </LiyonDialogBody>
          <LiyonDialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              {t("news.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "กำลังลบ..." : t("news.delete")}
            </Button>
          </LiyonDialogFooter>
        </LiyonDialog>
      )}
    </div>
  );
}
