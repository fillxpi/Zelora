import type { Habit } from '../habits/types';
import type { Goal, Milestone } from './goalTypes';

/**
 * Conta as conclusões dos hábitos vinculados à meta,
 * considerando só os dias a partir da criação da meta.
 */
export function countGoalCompletions(goal: Goal, habits: Habit[]): number {
  const linked = new Set(goal.habitIds);
  let total = 0;

  for (const habit of habits) {
    if (!linked.has(habit.id)) continue;

    // As datas 'YYYY-MM-DD' podem ser comparadas como texto.
    const validDays = new Set(habit.completedDates.filter((date) => date >= goal.createdAt));
    total += validDays.size;
  }

  return total;
}

export type MilestoneProgress = Milestone & { reached: boolean };

export type GoalProgress = {
  completed: number;
  target: number;
  /** Progresso de 0 a 1 (nunca passa de 1). */
  ratio: number;
  isComplete: boolean;
  milestones: MilestoneProgress[];
};

export function getGoalProgress(goal: Goal, habits: Habit[]): GoalProgress {
  const completed = countGoalCompletions(goal, habits);
  const ratio = goal.target > 0 ? Math.min(1, completed / goal.target) : 0;

  return {
    completed,
    target: goal.target,
    ratio,
    isComplete: goal.target > 0 && completed >= goal.target,
    milestones: goal.milestones.map((milestone) => ({
      ...milestone,
      reached: completed >= milestone.requiredCompletions,
    })),
  };
}

/**
 * Cria marcos automáticos em 25%, 50%, 75% e 100% da meta.
 * Em metas pequenas, marcos que cairiam no mesmo número são unidos (vale o de maior porcentagem).
 */
export function createDefaultMilestones(target: number): Milestone[] {
  const byRequired = new Map<number, Milestone>();

  for (const percent of [25, 50, 75, 100]) {
    const required = Math.ceil((target * percent) / 100);
    byRequired.set(required, {
      id: String(percent),
      title: `${percent}% da meta`,
      requiredCompletions: required,
    });
  }

  return Array.from(byRequired.values()).sort(
    (a, b) => a.requiredCompletions - b.requiredCompletions,
  );
}

/** Identificador único de um marco dentro de uma meta (usado para dar a recompensa uma vez só). */
export function milestoneKey(goalId: string, milestoneId: string): string {
  return `${goalId}:${milestoneId}`;
}

export type ReachedMilestone = {
  key: string;
  goalTitle: string;
  milestoneTitle: string;
};

/** Lista todos os marcos já atingidos, de todas as metas, na ordem das metas e dos marcos. */
export function getReachedMilestones(goals: Goal[], habits: Habit[]): ReachedMilestone[] {
  const reached: ReachedMilestone[] = [];

  for (const goal of goals) {
    const progress = getGoalProgress(goal, habits);

    for (const milestone of progress.milestones) {
      if (milestone.reached) {
        reached.push({
          key: milestoneKey(goal.id, milestone.id),
          goalTitle: goal.title,
          milestoneTitle: milestone.title,
        });
      }
    }
  }

  return reached;
}