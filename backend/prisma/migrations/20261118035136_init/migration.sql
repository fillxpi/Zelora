-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habit" (
    "userId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("userId","id")
);

-- CreateTable
CREATE TABLE "HabitCompletion" (
    "userId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "HabitCompletion_pkey" PRIMARY KEY ("userId","habitId","date")
);

-- CreateTable
CREATE TABLE "Goal" (
    "userId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "createdAt" TEXT NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("userId","id")
);

-- CreateTable
CREATE TABLE "GoalHabit" (
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,

    CONSTRAINT "GoalHabit_pkey" PRIMARY KEY ("userId","goalId","habitId")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requiredCompletions" INTEGER NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("userId","goalId","id")
);

-- CreateTable
CREATE TABLE "GameState" (
    "userId" TEXT NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "freezes" INTEGER NOT NULL DEFAULT 0,
    "lastCheckedDate" TEXT,

    CONSTRAINT "GameState_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "FrozenDate" (
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "FrozenDate_pkey" PRIMARY KEY ("userId","date")
);

-- CreateTable
CREATE TABLE "ClaimedMilestone" (
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,

    CONSTRAINT "ClaimedMilestone_pkey" PRIMARY KEY ("userId","goalId","milestoneId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_userId_habitId_fkey" FOREIGN KEY ("userId", "habitId") REFERENCES "Habit"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalHabit" ADD CONSTRAINT "GoalHabit_userId_goalId_fkey" FOREIGN KEY ("userId", "goalId") REFERENCES "Goal"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalHabit" ADD CONSTRAINT "GoalHabit_userId_habitId_fkey" FOREIGN KEY ("userId", "habitId") REFERENCES "Habit"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_userId_goalId_fkey" FOREIGN KEY ("userId", "goalId") REFERENCES "Goal"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameState" ADD CONSTRAINT "GameState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrozenDate" ADD CONSTRAINT "FrozenDate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimedMilestone" ADD CONSTRAINT "ClaimedMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
