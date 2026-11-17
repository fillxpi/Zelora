import { useCallback, useEffect, useState } from 'react';

import { toDateKey } from '../../lib/date';
import { createDefaultMilestones } from './goalLogic';
import { loadGoals, saveGoals } from './goalStorage';
import type { Goal } from './goalTypes';

export type NewGoalInput = {
  title: string;
  target: number;
  habitIds: string[];
};

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    loadGoals().then((stored) => {
      if (!active) return;
      setGoals(stored);
      setIsLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  // Salva sempre que a lista mudar, mas só depois de carregar.
  useEffect(() => {
    if (isLoaded) {
      saveGoals(goals);
    }
  }, [goals, isLoaded]);

  const addGoal = useCallback((input: NewGoalInput) => {
    const goal: Goal = {
      id: Date.now().toString(),
      title: input.title,
      habitIds: input.habitIds,
      target: input.target,
      createdAt: toDateKey(),
      milestones: createDefaultMilestones(input.target),
    };

    setGoals((current) => [...current, goal]);
  }, []);

  const removeGoal = useCallback((id: string) => {
    setGoals((current) => current.filter((goal) => goal.id !== id));
  }, []);

  return { goals, isLoaded, addGoal, removeGoal };
}