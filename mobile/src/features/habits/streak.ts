import { shiftDateKey } from '../../lib/date';

/**
 * Calcula a sequência atual de dias seguidos de um hábito.
 *
 * Regra: se o hábito já foi feito hoje, a contagem começa em hoje.
 * Se ainda não foi feito hoje, a sequência continua "viva" e a contagem começa em ontem,
 * porque o usuário ainda tem o dia todo para concluir.
 */
export function getCurrentStreak(completedDates: string[], today: string): number {
  const done = new Set(completedDates);

  let cursor = done.has(today) ? today : shiftDateKey(today, -1);
  let streak = 0;

  while (done.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}