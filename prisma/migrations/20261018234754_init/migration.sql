/*
  Warnings:

  - The primary key for the `UserPermissionOverride` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `allowed` on the `UserPermissionOverride` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,permissionId,scopeType,scopeId]` on the table `UserPermissionOverride` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `UserPermissionOverride` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Effect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('GLOBAL', 'BRANCH', 'DEPARTMENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissionsVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserPermissionOverride" DROP CONSTRAINT "UserPermissionOverride_pkey",
DROP COLUMN "allowed",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "effect" "Effect" NOT NULL DEFAULT 'ALLOW',
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "scopeId" INTEGER,
ADD COLUMN     "scopeType" "ScopeType" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "UserPermissionOverride_userId_permissionId_idx" ON "UserPermissionOverride"("userId", "permissionId");

-- CreateIndex
CREATE INDEX "UserPermissionOverride_permissionId_idx" ON "UserPermissionOverride"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermissionOverride_userId_permissionId_scopeType_scopeI_key" ON "UserPermissionOverride"("userId", "permissionId", "scopeType", "scopeId");
