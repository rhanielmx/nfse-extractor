/*
  Warnings:

  - Added the required column `code` to the `receipt_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "receipt_items" ADD COLUMN     "code" TEXT NOT NULL;
