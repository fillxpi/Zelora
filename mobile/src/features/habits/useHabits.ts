import { useCallback, useEffect, useState } from 'react';

import { toDateKey } from '../../lib/date';
import { loadHabits, saveHabits } from './storage';
import type { Habit } from './types';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega os hábitos salvos quando a tela abre.
  useEffect(() => {
    let active = true;

    loadHabits().then((stored) => {
      if (!active) return;
      setHabits(stored);
      setIsLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  // Salva sempre que a lista mudar, mas só depois de carregar.
  // Sem essa checagem, a lista vazia inicial apagaria os dados salvos.
  useEffect(() => {
    if (isLoaded) {
      saveHabits(habits);
    }
  }, [habits, isLoaded]);

  const addHabit = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setHabits((current) => [
      ...current,
      { id: Date.now().toString(), title: trimmed, completedDates: [] },
    ]);
  }, []);

  const toggleHabit = useCallback((id: string) => {
    const today = toDateKey();

    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== id) return habit;

        const isDone = habit.completedDates.includes(today);
        return {
          ...habit,
          completedDates: isDone
            ? habit.completedDates.filter((date) => date !== today)
            : [...habit.completedDates, today],
        };
      }),
    );
  }, []);

  const removeHabit = useCallback((id: string) => {
    setHabits((current) => current.filter((habit) => habit.id !== id));
  }, []);

    return {
    habits,
    isLoaded,
    addHabit,
    toggleHabit,
    removeHabit,
    replaceHabits: setHabits,
  };
}