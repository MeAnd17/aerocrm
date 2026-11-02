-- CreateTable
CREATE TABLE "BookingPassenger" (
    "id" SERIAL NOT NULL,
    "bookingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "isHolder" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BookingPassenger_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BookingPassenger" ADD CONSTRAINT "BookingPassenger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
