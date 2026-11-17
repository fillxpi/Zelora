import { shiftDateKey } from '../../lib/date';
import { getCurrentStreak } from '../habits/streak';
import type { GameState } from './gameTypes';

export const COINS_PER_COMPLETION = 10;
export const XP_PER_COMPLETION = 10;
export const MILESTONE_COINS = 30;
export const MILESTONE_XP = 30;
export const FREEZE_COST = 50;
export const MAX_FREEZES = 2;

export type FreezeState = Pick<GameState, 'freezes' | 'frozenDates' | 'lastCheckedDate'>;

/**
 * Sequência geral de dias seguidos.
 * Um dia conta se o usuário concluiu pelo menos um hábito nele
 * ou se ele foi coberto por uma proteção de sequência.
 */
export function getDailyStreak(
  activeDates: string[],
  frozenDates: string[],
  today: string,
): number {
  return getCurrentStreak([...activeDates, ...frozenDates], today);
}

/**
 * Aplica as proteções de sequência aos dias que passaram sem atividade.
 *
 * Para cada dia perdido entre a última verificação e ontem:
 * - se o dia anterior estava protegido (ou seja, havia uma sequência) e o usuário
 *   ainda tem proteções, uma delas é gasta e o dia fica coberto;
 * - caso contrário, nada é gasto (sem sequência não há o que proteger).
 *
 * Chamar a função de novo no mesmo dia não muda nada.
 */
export function applyStreakFreezes(
  activeDates: string[],
  state: FreezeState,
  today: string,
): FreezeState {
  const yesterday = shiftDateKey(today, -1);
  const lastChecked = state.lastCheckedDate;

  // Primeira execução: só marca o ponto de partida.
  if (lastChecked === null) {
    return { ...state, lastCheckedDate: yesterday };
  }

  let freezes = state.freezes;
  const frozenDates = [...state.frozenDates];
  const active = new Set(activeDates);

  let cursor = shiftDateKey(lastChecked, 1);

  // As datas 'YYYY-MM-DD' podem ser comparadas como texto.
  while (cursor <= yesterday) {
    const isProtected = (day: string) => active.has(day) || frozenDates.includes(day);

    if (!isProtected(cursor)) {
      const hadStreak = isProtected(shiftDateKey(cursor, -1));
      if (hadStreak && freezes > 0) {
        frozenDates.push(cursor);
        freezes -= 1;
      }
    }

    cursor = shiftDateKey(cursor, 1);
  }

  return { freezes, frozenDates, lastCheckedDate: yesterday };
}