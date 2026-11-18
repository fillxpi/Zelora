-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "syncRevision" INTEGER NOT NULL DEFAULT 0;
