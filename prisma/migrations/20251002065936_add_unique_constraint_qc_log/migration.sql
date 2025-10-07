/*
  Warnings:

  - A unique constraint covering the columns `[processQcId,action]` on the table `process_qc_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "process_qc_logs_processQcId_action_key" ON "public"."process_qc_logs"("processQcId", "action");
