-- CreateEnum
CREATE TYPE "token_purpose" AS ENUM ('verify_email', 'reset_password');

-- CreateEnum
CREATE TYPE "member_role" AS ENUM ('owner', 'admin', 'teacher', 'parent');

-- CreateEnum
CREATE TYPE "class_level" AS ENUM ('playgroup', 'nursery', 'lkg', 'ukg', 'daycare', 'other');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('girl', 'boy', 'other');

-- CreateEnum
CREATE TYPE "child_status" AS ENUM ('active', 'left');

-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('present', 'absent', 'late', 'leave');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "purpose" "token_purpose" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key","window_start")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "city" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_members" (
    "school_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "member_role" NOT NULL,
    "full_name" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_members_pkey" PRIMARY KEY ("school_id","user_id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" "class_level" NOT NULL DEFAULT 'other',
    "capacity" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "class_id" UUID,
    "full_name" TEXT NOT NULL,
    "date_of_birth" DATE,
    "gender" "gender",
    "parent_name" TEXT,
    "parent_phone" TEXT,
    "joined_on" DATE NOT NULL DEFAULT CURRENT_DATE,
    "status" "child_status" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "child_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" "attendance_status" NOT NULL,
    "class_id" UUID,
    "note" TEXT,
    "marked_by" UUID,
    "marked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("child_id","date")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_tokens_user_id_purpose_idx" ON "auth_tokens"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "school_members_user_id_idx" ON "school_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "classes_school_id_name_key" ON "classes"("school_id", "name");

-- CreateIndex
CREATE INDEX "children_school_id_class_id_idx" ON "children"("school_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "children_id_school_id_key" ON "children"("id", "school_id");

-- CreateIndex
CREATE INDEX "attendance_school_id_date_idx" ON "attendance"("school_id", "date");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_members" ADD CONSTRAINT "school_members_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_members" ADD CONSTRAINT "school_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_child_id_school_id_fkey" FOREIGN KEY ("child_id", "school_id") REFERENCES "children"("id", "school_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- Checks (added by hand; Prisma can't express these) ----------
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "schools" ADD CONSTRAINT "schools_name_length" CHECK (length(btrim("name")) BETWEEN 2 AND 120);
ALTER TABLE "classes" ADD CONSTRAINT "classes_name_length" CHECK (length(btrim("name")) BETWEEN 1 AND 60);
ALTER TABLE "classes" ADD CONSTRAINT "classes_capacity_range" CHECK ("capacity" IS NULL OR "capacity" BETWEEN 1 AND 500);
ALTER TABLE "children" ADD CONSTRAINT "children_full_name_length" CHECK (length(btrim("full_name")) BETWEEN 1 AND 120);
ALTER TABLE "children" ADD CONSTRAINT "children_parent_phone_format" CHECK ("parent_phone" IS NULL OR "parent_phone" ~ '^[6-9][0-9]{9}$');
