// Declared locally; refresh via: npm run cf-typegen (generated file is ignored).
/// <reference types="@cloudflare/workers-types" />
interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  IMAGES: ImagesBinding;
  GOCAMP_ENV: "staging" | "production";
  MIGRATION_SOURCE_SHA?: string;
}
