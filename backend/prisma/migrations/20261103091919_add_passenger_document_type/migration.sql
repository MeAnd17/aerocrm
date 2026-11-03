-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'PASAPORTE');

-- AlterTable
ALTER TABLE "BookingPassenger" ADD COLUMN     "documentType" "DocumentType" NOT NULL DEFAULT 'DNI';

-- AlterTable
ALTER TABLE "Traveler" ADD COLUMN     "documentType" "DocumentType" NOT NULL DEFAULT 'DNI';
