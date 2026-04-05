-- Reset (safe si rien n'existe encore)
DROP TABLE IF EXISTS "trend_item_tags" CASCADE;
DROP TABLE IF EXISTS "trend_item_sources" CASCADE;
DROP TABLE IF EXISTS "trend_item_entities" CASCADE;
DROP TABLE IF EXISTS "post_tags" CASCADE;
DROP TABLE IF EXISTS "post_trend_items" CASCADE;
DROP TABLE IF EXISTS "newsletters" CASCADE;
DROP TABLE IF EXISTS "trend_items" CASCADE;
DROP TABLE IF EXISTS "posts" CASCADE;
DROP TABLE IF EXISTS "sources" CASCADE;
DROP TABLE IF EXISTS "entities" CASCADE;
DROP TABLE IF EXISTS "tags" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TYPE IF EXISTS "NewsletterStatus" CASCADE;
DROP TYPE IF EXISTS "SourceType" CASCADE;
DROP TYPE IF EXISTS "EntityType" CASCADE;
DROP TYPE IF EXISTS "PostStatus" CASCADE;
DROP TYPE IF EXISTS "PostType" CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('DAILY_RECAP', 'STORY', 'EVERGREEN');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PLAYER', 'CLUB', 'NATIONAL_TEAM', 'COMPETITION');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('NEWS_SITE', 'SOCIAL_MEDIA', 'OFFICIAL', 'YOUTUBE', 'RSS', 'OTHER');

-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFr" TEXT,
    "entityType" "EntityType" NOT NULL,
    "descriptionEn" TEXT,
    "descriptionFr" TEXT,
    "imageUrl" TEXT,
    "country" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "trustScore" INTEGER NOT NULL DEFAULT 50,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "PostType" NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "titleEn" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "summaryEn" TEXT,
    "summaryFr" TEXT,
    "bodyEn" TEXT,
    "bodyFr" TEXT,
    "seoTitleEn" TEXT,
    "seoTitleFr" TEXT,
    "seoDescEn" TEXT,
    "seoDescFr" TEXT,
    "canonicalUrl" TEXT,
    "publishDate" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT,
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trend_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "shortSummaryEn" TEXT NOT NULL,
    "shortSummaryFr" TEXT NOT NULL,
    "whyItMattersEn" TEXT,
    "whyItMattersFr" TEXT,
    "sourceUrl" TEXT,
    "mediaUrl" TEXT,
    "videoUrl" TEXT,
    "trendScore" INTEGER NOT NULL DEFAULT 0,
    "momentum" INTEGER NOT NULL DEFAULT 0,
    "sourceDiversity" INTEGER NOT NULL DEFAULT 0,
    "editorialPriority" INTEGER NOT NULL DEFAULT 0,
    "eventWeight" INTEGER NOT NULL DEFAULT 0,
    "mustWatch" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,
    CONSTRAINT "trend_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_trend_items" (
    "postId" TEXT NOT NULL,
    "trendItemId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "post_trend_items_pkey" PRIMARY KEY ("postId","trendItemId")
);

-- CreateTable
CREATE TABLE "post_tags" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "trend_item_entities" (
    "trendItemId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "trend_item_entities_pkey" PRIMARY KEY ("trendItemId","entityId")
);

-- CreateTable
CREATE TABLE "trend_item_sources" (
    "trendItemId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    CONSTRAINT "trend_item_sources_pkey" PRIMARY KEY ("trendItemId","sourceId")
);

-- CreateTable
CREATE TABLE "trend_item_tags" (
    "trendItemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "trend_item_tags_pkey" PRIMARY KEY ("trendItemId","tagId")
);

-- CreateTable
CREATE TABLE "newsletters" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");
CREATE UNIQUE INDEX "entities_slug_key" ON "entities"("slug");
CREATE UNIQUE INDEX "sources_slug_key" ON "sources"("slug");
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");
CREATE INDEX "posts_type_status_publishDate_idx" ON "posts"("type", "status", "publishDate");
CREATE INDEX "posts_slug_idx" ON "posts"("slug");
CREATE UNIQUE INDEX "trend_items_slug_key" ON "trend_items"("slug");
CREATE INDEX "trend_items_trendScore_publishDate_idx" ON "trend_items"("trendScore", "publishDate");
CREATE INDEX "trend_items_publishDate_idx" ON "trend_items"("publishDate");
CREATE UNIQUE INDEX "newsletters_email_key" ON "newsletters"("email");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "trend_items" ADD CONSTRAINT "trend_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "post_trend_items" ADD CONSTRAINT "post_trend_items_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_trend_items" ADD CONSTRAINT "post_trend_items_trendItemId_fkey" FOREIGN KEY ("trendItemId") REFERENCES "trend_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trend_item_entities" ADD CONSTRAINT "trend_item_entities_trendItemId_fkey" FOREIGN KEY ("trendItemId") REFERENCES "trend_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trend_item_entities" ADD CONSTRAINT "trend_item_entities_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trend_item_sources" ADD CONSTRAINT "trend_item_sources_trendItemId_fkey" FOREIGN KEY ("trendItemId") REFERENCES "trend_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trend_item_sources" ADD CONSTRAINT "trend_item_sources_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trend_item_tags" ADD CONSTRAINT "trend_item_tags_trendItemId_fkey" FOREIGN KEY ("trendItemId") REFERENCES "trend_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trend_item_tags" ADD CONSTRAINT "trend_item_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
