-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('PENDIENTE', 'ATENDIDA');

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "attendedAt" TIMESTAMP(3),
ADD COLUMN     "internalNote" TEXT,
ADD COLUMN     "status" "ContactStatus" NOT NULL DEFAULT 'PENDIENTE';
