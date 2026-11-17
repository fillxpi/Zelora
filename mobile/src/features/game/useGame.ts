import { useCallback, useEffect, useRef, useState } from 'react';

import { toDateKey } from '../../lib/date';
import { DEFAULT_GAME_STATE, loadGameState, saveGameState } from './gameStorage';
import type { GameState } from './gameTypes';
import { getLevelInfo } from './level';
import {
  applyStreakFreezes,
  COINS_PER_COMPLETION,
  FREEZE_COST,
  getDailyStreak,
  MAX_FREEZES,
  XP_PER_COMPLETION,
} from './rules';

/**
 * @param activeDates todos os dias em que algum hábito foi concluído
 * @param habitsLoaded true quando os hábitos já foram carregados do armazenamento
 */
export function useGame(activeDates: string[], habitsLoaded: boolean) {
  const [game, setGame] = useState<GameState>(DEFAULT_GAME_STATE);
  const [gameLoaded, setGameLoaded] = useState(false);

  // Guarda sempre a lista mais recente, para usar dentro do efeito abaixo
  // sem que ele rode de novo a cada mudança nos hábitos.
  const activeDatesRef = useRef(activeDates);
  useEffect(() => {
    activeDatesRef.current = activeDates;
  });

  useEffect(() => {
    let active = true;

    loadGameState().then((stored) => {
      if (!active) return;
      setGame(stored);
      setGameLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const ready = gameLoaded && habitsLoaded;

  // Quando tudo estiver carregado, aplica as proteções aos dias perdidos.
  useEffect(() => {
    if (!ready) return;

    setGame((current) => ({
      ...current,
      ...applyStreakFreezes(activeDatesRef.current, current, toDateKey()),
    }));
  }, [ready]);

  // Salva sempre que o estado mudar, mas só depois de carregar.
  useEffect(() => {
    if (gameLoaded) {
      saveGameState(game);
    }
  }, [game, gameLoaded]);

  /**
   * Chamada quando um hábito é marcado (completed = true) ou desmarcado (completed = false).
   * Marcar dá moedas e XP; desmarcar devolve, para não dar para "farmar" recompensas.
   */
  const registerCompletion = useCallback((completed: boolean) => {
    const sign = completed ? 1 : -1;

    setGame((current) => ({
      ...current,
      coins: Math.max(0, current.coins + sign * COINS_PER_COMPLETION),
      xp: Math.max(0, current.xp + sign * XP_PER_COMPLETION),
    }));
  }, []);

  const buyFreeze = useCallback(() => {
    setGame((current) => {
      if (current.coins < FREEZE_COST || current.freezes >= MAX_FREEZES) return current;
      return { ...current, coins: current.coins - FREEZE_COST, freezes: current.freezes + 1 };
    });
  }, []);

  const dailyStreak = getDailyStreak(activeDates, game.frozenDates, toDateKey());
  const canBuyFreeze = game.coins >= FREEZE_COST && game.freezes < MAX_FREEZES;

  return {
    isReady: gameLoaded,
    coins: game.coins,
    freezes: game.freezes,
    levelInfo: getLevelInfo(game.xp),
    dailyStreak,
    canBuyFreeze,
    registerCompletion,
    buyFreeze,
  };
}