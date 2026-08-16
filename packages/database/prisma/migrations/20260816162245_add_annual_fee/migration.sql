-- AlterEnum
ALTER TYPE "ChargeType" ADD VALUE 'ANNUAL_FEE';

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "annual_fee_amount" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "default_annual_fee" DECIMAL(10,2),
ADD COLUMN     "default_enrollment_fee" DECIMAL(10,2);
