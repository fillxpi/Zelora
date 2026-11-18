import type { GameState } from '../game/gameTypes';
import type { Goal } from '../goals/goalTypes';
import type { Habit } from '../habits/types';

export type Snapshot = {
  habits: Habit[];
  goals: Goal[];
  game: GameState;
};

export type ServerSnapshot = Snapshot & { revision: number };

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

/**
 * Deixa os dados num formato padronizado (listas ordenadas, sem repetidos,
 * metas só ligadas a hábitos que existem). A ordem dos hábitos e das metas é mantida.
 * Serve para comparar dados e para montar o que vai para o servidor.
 */
export function canonicalize(snapshot: Snapshot): Snapshot {
  const habitIds = new Set(snapshot.habits.map((habit) => habit.id));

  return {
    habits: snapshot.habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      completedDates: unique(habit.completedDates).sort(),
    })),
    goals: snapshot.goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      habitIds: unique(goal.habitIds.filter((id) => habitIds.has(id))).sort(),
      target: goal.target,
      createdAt: goal.createdAt,
      milestones: goal.milestones
        .map((m) => ({ id: m.id, title: m.title, requiredCompletions: m.requiredCompletions }))
        .sort((a, b) => a.requiredCompletions - b.requiredCompletions || a.id.localeCompare(b.id)),
    })),
    game: {
      coins: snapshot.game.coins,
      xp: snapshot.game.xp,
      freezes: snapshot.game.freezes,
      frozenDates: unique(snapshot.game.frozenDates).sort(),
      lastCheckedDate: snapshot.game.lastCheckedDate,
      claimedMilestones: unique(snapshot.game.claimedMilestones).sort(),
    },
  };
}

export function canonicalJson(snapshot: Snapshot): string {
  return JSON.stringify(canonicalize(snapshot));
}

/** Sem hábitos e sem metas, consideramos que não há dados de verdade. */
export function isEmptySnapshot(snapshot: Snapshot): boolean {
  return snapshot.habits.length === 0 && snapshot.goals.length === 0;
}