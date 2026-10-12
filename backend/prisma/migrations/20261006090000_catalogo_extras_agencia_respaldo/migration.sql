-- CreateEnum
CREATE TYPE "ExtraPricing" AS ENUM ('POR_RESERVA', 'POR_PASAJERO');

-- CreateTable
CREATE TABLE "ExtraOption" (
    "id" SERIAL NOT NULL,
    "type" "ExtraType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "pricing" "ExtraPricing" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyInfo" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationClimate" (
    "id" SERIAL NOT NULL,
    "destinationId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "avgTempC" DECIMAL(4,1) NOT NULL,
    "minTempC" DECIMAL(4,1) NOT NULL,
    "maxTempC" DECIMAL(4,1) NOT NULL,
    "rainyDays" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,

    CONSTRAINT "DestinationClimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" SERIAL NOT NULL,
    "countryCode" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtraOption_type_key" ON "ExtraOption"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DestinationClimate_destinationId_month_key" ON "DestinationClimate"("destinationId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_countryCode_month_day_key" ON "Holiday"("countryCode", "month", "day");

-- AddForeignKey
ALTER TABLE "DestinationClimate" ADD CONSTRAINT "DestinationClimate_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
