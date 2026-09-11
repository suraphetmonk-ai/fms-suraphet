import type { PermissionDef } from "@/shared/lib/permission-def";

export const NEWS_P = {
  newsRead: "news:read",
  newsCreate: "news:create",
  newsUpdate: "news:update",
  newsDelete: "news:delete",
  newsPublish: "news:publish",
  newsPin: "news:pin",
} as const;

export const NEWS_PERMISSIONS: readonly PermissionDef[] = [
  { code: NEWS_P.newsRead, module: "news", action: "read" },
  { code: NEWS_P.newsCreate, module: "news", action: "create" },
  { code: NEWS_P.newsUpdate, module: "news", action: "update" },
  { code: NEWS_P.newsDelete, module: "news", action: "delete" },
  { code: NEWS_P.newsPublish, module: "news", action: "publish" },
  { code: NEWS_P.newsPin, module: "news", action: "pin" },
];
