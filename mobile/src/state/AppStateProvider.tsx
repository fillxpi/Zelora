import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import { useGame } from '../features/game/useGame';
import { useGoals } from '../features/goals/useGoals';
import { useHabits } from '../features/habits/useHabits';

type AppState = {
  habitsState: ReturnType<typeof useHabits>;
  goalsState: ReturnType<typeof useGoals>;
  gameState: ReturnType<typeof useGame>;
};

const AppStateContext = createContext<AppState | null>(null);

/**
 * Cria hábitos, metas e jogo UMA vez só e compartilha com todas as telas.
 * Assim, uma mudança em uma tela aparece na outra na hora.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const habitsState = useHabits();
  const goalsState = useGoals();

  const activeDates = habitsState.habits.flatMap((habit) => habit.completedDates);
  const gameState = useGame(activeDates, habitsState.isLoaded);

  return (
    <AppStateContext.Provider value={{ habitsState, goalsState, gameState }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState precisa ser usado dentro de <AppStateProvider>.');
  }

  return context;
}