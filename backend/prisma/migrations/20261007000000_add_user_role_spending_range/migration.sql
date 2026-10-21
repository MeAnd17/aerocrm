-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "SpendingRange" AS ENUM ('LESS_500', 'RANGE_500_1500', 'RANGE_1500_3000', 'MORE_3000');

-- AlterTable: add role to User
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CLIENT';

-- AlterTable: add spendingRange to Client
ALTER TABLE "Client" ADD COLUMN "spendingRange" "SpendingRange";
