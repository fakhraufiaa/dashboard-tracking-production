/*
  Warnings:

  - A unique constraint covering the columns `[productionUnitId,uniqCode]` on the table `gen_production_units` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."gen_production_units_uniqCode_key";

-- CreateIndex
CREATE UNIQUE INDEX "gen_production_units_productionUnitId_uniqCode_key" ON "public"."gen_production_units"("productionUnitId", "uniqCode");
