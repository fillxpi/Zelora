import type { GameState } from '../game/gameTypes';
import { canonicalJson, canonicalize, isEmptySnapshot } from './syncLogic';
import type { Snapshot } from './syncLogic';

const game: GameState = {
  coins: 10,
  xp: 20,
  freezes: 1,
  frozenDates: ['2026-11-12', '2026-11-10'],
  lastCheckedDate: '2026-11-18',
  claimedMilestones: ['g1:m50', 'g1:m25'],
};

function makeSnapshot(): Snapshot {
  return {
    habits: [
      { id: 'h2', title: 'Estudar', completedDates: ['2026-11-18', '2026-11-17', '2026-11-18'] },
      { id: 'h1', title: 'Ler', completedDates: [] },
    ],
    goals: [
      {
        id: 'g1',
        title: 'Ler 30 dias',
        habitIds: ['h2', 'h1', 'h-removido'],
        target: 30,
        createdAt: '2026-11-18',
        milestones: [
          { id: 'm50', title: 'Metade', requiredCompletions: 15 },
          { id: 'm25', title: 'Começo', requiredCompletions: 8 },
        ],
      },
    ],
    game,
  };
}

describe('canonicalize', () => {
  it('ordena listas e remove repetidos', () => {
    const result = canonicalize(makeSnapshot());
    expect(result.habits[0].completedDates).toEqual(['2026-11-17', '2026-11-18']);
    expect(result.game.frozenDates).toEqual(['2026-11-10', '2026-11-12']);
    expect(result.game.claimedMilestones).toEqual(['g1:m25', 'g1:m50']);
    expect(result.goals[0].milestones.map((m) => m.id)).toEqual(['m25', 'm50']);
  });

  it('mantém a ordem dos hábitos e das metas', () => {
    const result = canonicalize(makeSnapshot());
    expect(result.habits.map((h) => h.id)).toEqual(['h2', 'h1']);
  });

  it('remove vínculos com hábitos que não existem mais', () => {
    const result = canonicalize(makeSnapshot());
    expect(result.goals[0].habitIds).toEqual(['h1', 'h2']);
  });

  it('gera o mesmo texto para dados iguais em ordens diferentes', () => {
    const other = makeSnapshot();
    other.habits[0].completedDates = ['2026-11-17', '2026-11-18'];
    expect(canonicalJson(other)).toBe(canonicalJson(makeSnapshot()));
  });

  it('gera textos diferentes quando algo muda', () => {
    const other = makeSnapshot();
    other.game = { ...game, coins: 11 };
    expect(canonicalJson(other)).not.toBe(canonicalJson(makeSnapshot()));
  });
});

describe('isEmptySnapshot', () => {
  it('é vazio sem hábitos e sem metas', () => {
    expect(isEmptySnapshot({ habits: [], goals: [], game })).toBe(true);
  });

  it('não é vazio com dados', () => {
    expect(isEmptySnapshot(makeSnapshot())).toBe(false);
  });
});