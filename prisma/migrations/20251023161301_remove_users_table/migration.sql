/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."conversations" DROP CONSTRAINT "conversations_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."videos" DROP CONSTRAINT "videos_userId_fkey";

-- DropTable
DROP TABLE "public"."users";
