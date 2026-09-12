"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission, getTenantGeminiConfig, getSessionContext, hasPermission } from "@/features/identity/server";
import { errors } from "@/shared/lib/errors";
import { callGeminiApi, parseGeminiJson } from "@/shared/lib/ai/gemini";
import { NEWS_P } from "../permissions";

import { createArticleSchema, updateArticleSchema } from "./validations";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  listArticles,
  listCategories,
  type ArticleDto,
  type ArticleCategoryDto,
} from "./services";

export async function getArticlesAction(): Promise<ActionResult<ArticleDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsRead);
    return listArticles(ctx.tenantId);
  });
}

export async function getNewsCategoriesAction(): Promise<ActionResult<ArticleCategoryDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsRead);
    return listCategories(ctx.tenantId);
  });
}

export async function createArticleAction(input: unknown): Promise<ActionResult<ArticleDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsCreate);
    const parsed = createArticleSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createArticle(ctx.tenantId, ctx.userId ?? null, parsed);
    revalidatePath("/news");
    revalidatePath("/");
    return result;
  });
}

export async function updateArticleAction(input: unknown): Promise<ActionResult<ArticleDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsUpdate);
    const parsed = updateArticleSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateArticle(ctx.tenantId, parsed);
    revalidatePath("/news");
    revalidatePath("/");
    return result;
  });
}

export async function deleteArticleAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(NEWS_P.newsDelete);
    await deleteArticle(ctx.tenantId, id);
    revalidatePath("/news");
    revalidatePath("/");
  });
}

export interface NewsAiTranslationResult {
  titleEn: string;
  excerptEn: string;
  contentEn: string;
  slug: string;
}

export async function translateNewsWithGeminiAction(input: {
  titleTh: string;
  excerptTh?: string;
  contentTh: string;
}): Promise<ActionResult<NewsAiTranslationResult>> {
  return runAction(async () => {
    const ctx = await getSessionContext();
    if (!ctx) throw errors.unauthorized();
    if (!hasPermission(ctx, NEWS_P.newsCreate) && !hasPermission(ctx, NEWS_P.newsUpdate)) {

      throw errors.forbidden();
    }

    if (!input.titleTh?.trim() && !input.contentTh?.trim()) {
      throw errors.validation("กรุณากรอกหัวข้อข่าวหรือเนื้อหาข่าวภาษาไทยก่อนดำเนินการสร้างคำแปล", {
        titleTh: ["กรุณากรอกข้อมูลภาษาไทย"],
      });
    }

    const geminiConfig = await getTenantGeminiConfig(ctx.tenantId);
    const apiKey = geminiConfig?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || (geminiConfig && !geminiConfig.enabled && !process.env.GEMINI_API_KEY)) {
      throw errors.validation(
        "ยังไม่ได้เปิดใช้งาน Google Gemini AI หรือไม่มี API Key กรุณาเข้าไปกำหนดในหน้าการตั้งค่า (Settings)",
        { gemini: ["Google Gemini API Key ไม่พร้อมใช้งาน"] }
      );
    }

    const systemInstruction = `You are a professional university public relations specialist and academic translator for a Buddhist and higher education university in Thailand.
Translate and adapt the provided Thai news article into natural, formal, and grammatically accurate English suitable for an official academic university portal.

Rules:
1. "titleEn": Professional, captivating, and concise English title.
2. "excerptEn": Engaging 1-2 sentence English summary for cards and preview snippets.
3. "contentEn": Full English article body matching the structure and paragraph breaks of the Thai content. Maintain respectful titles (e.g., Asst. Prof. Dr., Phra, etc.) and academic conventions.
4. "slug": Clean, SEO-friendly English URL slug in lowercase with hyphens (e.g. "teacher-appreciation-day-2026").

Respond strictly in valid JSON format:
{
  "titleEn": "...",
  "excerptEn": "...",
  "contentEn": "...",
  "slug": "..."
}`;

    const prompt = JSON.stringify({
      titleTh: input.titleTh.trim(),
      excerptTh: input.excerptTh?.trim() || "",
      contentTh: input.contentTh.trim(),
    });

    const rawResponse = await callGeminiApi({
      apiKey,
      model: geminiConfig?.model || "gemini-2.5-flash",
      systemInstruction,
      prompt,
      temperature: 0.2,
      jsonMode: true,
    });

    const parsed = parseGeminiJson<NewsAiTranslationResult>(rawResponse);

    return {
      titleEn: parsed.titleEn || input.titleTh,
      excerptEn: parsed.excerptEn || "",
      contentEn: parsed.contentEn || "",
      slug: parsed.slug || `news-${Date.now()}`,
    };
  });
}

