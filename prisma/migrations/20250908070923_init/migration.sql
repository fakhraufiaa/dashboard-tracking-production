-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'OPT', 'QC', 'SCM');

-- CreateEnum
CREATE TYPE "public"."ProcessType" AS ENUM ('INV', 'SCC', 'BATT', 'PD', 'PB', 'WD', 'WB', 'QC', 'PACK');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "uniqCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."productions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."production_units" (
    "id" SERIAL NOT NULL,
    "productionId" INTEGER NOT NULL,
    "uniqCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gen_production_units" (
    "id" SERIAL NOT NULL,
    "productionUnitId" INTEGER NOT NULL,
    "uniqCode" TEXT NOT NULL,
    "process" "public"."ProcessType" NOT NULL,
    "jsBarcode" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gen_production_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."info_scan_productions" (
    "id" SERIAL NOT NULL,
    "genProductionUnitId" INTEGER NOT NULL,
    "pekerja" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "info_scan_productions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."process_qcs" (
    "id" SERIAL NOT NULL,
    "productionUnitId" INTEGER NOT NULL,
    "uji_input" BOOLEAN NOT NULL DEFAULT false,
    "uji_output" BOOLEAN NOT NULL DEFAULT false,
    "uji_ac" BOOLEAN NOT NULL DEFAULT false,
    "uji_kabel" BOOLEAN NOT NULL DEFAULT false,
    "labelling" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_qcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."process_qc_logs" (
    "id" SERIAL NOT NULL,
    "processQcId" INTEGER NOT NULL,
    "qcUserId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_qc_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uniqCode_key" ON "public"."users"("uniqCode");

-- CreateIndex
CREATE UNIQUE INDEX "production_units_uniqCode_key" ON "public"."production_units"("uniqCode");

-- CreateIndex
CREATE UNIQUE INDEX "gen_production_units_uniqCode_key" ON "public"."gen_production_units"("uniqCode");

-- CreateIndex
CREATE UNIQUE INDEX "process_qcs_productionUnitId_key" ON "public"."process_qcs"("productionUnitId");

-- AddForeignKey
ALTER TABLE "public"."production_units" ADD CONSTRAINT "production_units_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "public"."productions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gen_production_units" ADD CONSTRAINT "gen_production_units_productionUnitId_fkey" FOREIGN KEY ("productionUnitId") REFERENCES "public"."production_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."info_scan_productions" ADD CONSTRAINT "info_scan_productions_genProductionUnitId_fkey" FOREIGN KEY ("genProductionUnitId") REFERENCES "public"."gen_production_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."info_scan_productions" ADD CONSTRAINT "info_scan_productions_pekerja_fkey" FOREIGN KEY ("pekerja") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."process_qcs" ADD CONSTRAINT "process_qcs_productionUnitId_fkey" FOREIGN KEY ("productionUnitId") REFERENCES "public"."production_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."process_qc_logs" ADD CONSTRAINT "process_qc_logs_processQcId_fkey" FOREIGN KEY ("processQcId") REFERENCES "public"."process_qcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."process_qc_logs" ADD CONSTRAINT "process_qc_logs_qcUserId_fkey" FOREIGN KEY ("qcUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
