import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import { MILESTONE_COINS, MILESTONE_XP } from '../features/game/rules';
import { useGame } from '../features/game/useGame';
import { getReachedMilestones } from '../features/goals/goalLogic';
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
 * Também é aqui que as recompensas por marcos de metas são concedidas,
 * porque é o único lugar que enxerga hábitos, metas e jogo ao mesmo tempo.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const habitsState = useHabits();
  const goalsState = useGoals();

  const activeDates = habitsState.habits.flatMap((habit) => habit.completedDates);
  const gameState = useGame(activeDates, habitsState.isLoaded);

  const { habits } = habitsState;
  const { goals } = goalsState;
  const { claimedMilestones, claimMilestones } = gameState;

  const ready = habitsState.isLoaded && goalsState.isLoaded && gameState.isReady;

  // Marcos já anunciados nesta sessão (evita avisar duas vezes antes do estado atualizar).
  const announced = useRef(new Set<string>());

  useEffect(() => {
    if (!ready) return;

    const fresh = getReachedMilestones(goals, habits).filter(
      (milestone) =>
        !claimedMilestones.includes(milestone.key) && !announced.current.has(milestone.key),
    );

    if (fresh.length === 0) return;

    fresh.forEach((milestone) => announced.current.add(milestone.key));
    claimMilestones(fresh.map((milestone) => milestone.key));

    const lines = fresh
      .map((milestone) => `• ${milestone.goalTitle}: ${milestone.milestoneTitle}`)
      .join('\n');
    const totalCoins = fresh.length * MILESTONE_COINS;
    const totalXp = fresh.length * MILESTONE_XP;

    Alert.alert('Marco atingido! 🎉', `${lines}\n\n+${totalCoins} 🪙 e +${totalXp} XP`);
  }, [ready, goals, habits, claimedMilestones, claimMilestones]);

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