/*
  Warnings:

  - Added the required column `updatedAt` to the `process_qc_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."process_qc_logs" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
