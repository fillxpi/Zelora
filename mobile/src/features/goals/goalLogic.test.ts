import type { Habit } from '../habits/types';
import {
  countGoalCompletions,
  createDefaultMilestones,
  getGoalProgress,
  getReachedMilestones,
  milestoneKey,
} from './goalLogic';
import type { Goal } from './goalTypes';

const habits: Habit[] = [
  { id: 'h1', title: 'Estudar', completedDates: ['2026-11-08', '2026-11-10', '2026-11-11'] },
  { id: 'h2', title: 'Exercício', completedDates: ['2026-11-12'] },
  { id: 'h3', title: 'Meditar', completedDates: ['2026-11-12', '2026-11-13'] },
];

const goal: Goal = {
  id: 'g1',
  title: 'Rotina de estudos',
  habitIds: ['h1', 'h2'],
  target: 10,
  createdAt: '2026-11-10',
  milestones: createDefaultMilestones(10),
};

describe('countGoalCompletions', () => {
  it('soma só as conclusões dos hábitos vinculados', () => {
    // h1: 10 e 11 (o dia 08 é anterior à meta) + h2: 12 = 3. O h3 não está vinculado.
    expect(countGoalCompletions(goal, habits)).toBe(3);
  });

  it('conta o próprio dia de criação da meta', () => {
    const sameDay = { ...goal, createdAt: '2026-11-11', habitIds: ['h1'] };
    expect(countGoalCompletions(sameDay, habits)).toBe(1);
  });

  it('retorna 0 quando nenhum hábito vinculado existe mais', () => {
    expect(countGoalCompletions({ ...goal, habitIds: ['removido'] }, habits)).toBe(0);
  });

  it('não conta datas repetidas duas vezes', () => {
    const repeated: Habit[] = [
      { id: 'h1', title: 'Estudar', completedDates: ['2026-11-11', '2026-11-11'] },
    ];
    expect(countGoalCompletions({ ...goal, habitIds: ['h1'] }, repeated)).toBe(1);
  });
});

describe('getGoalProgress', () => {
  it('calcula o progresso e quais marcos já foram atingidos', () => {
    const progress = getGoalProgress(goal, habits);

    expect(progress.completed).toBe(3);
    expect(progress.target).toBe(10);
    expect(progress.ratio).toBeCloseTo(0.3);
    expect(progress.isComplete).toBe(false);
    // Marcos de uma meta de 10: 3, 5, 8 e 10.
    expect(progress.milestones.map((m) => m.reached)).toEqual([true, false, false, false]);
  });

  it('limita o progresso em 100% e marca a meta como concluída', () => {
    const small = { ...goal, target: 2 };
    const progress = getGoalProgress(small, habits);

    expect(progress.completed).toBe(3);
    expect(progress.ratio).toBe(1);
    expect(progress.isComplete).toBe(true);
  });

  it('não quebra com meta de valor zero', () => {
    const progress = getGoalProgress({ ...goal, target: 0, milestones: [] }, habits);

    expect(progress.ratio).toBe(0);
    expect(progress.isComplete).toBe(false);
  });
});

describe('createDefaultMilestones', () => {
  it('cria marcos em 25%, 50%, 75% e 100%', () => {
    const milestones = createDefaultMilestones(100);

    expect(milestones.map((m) => m.requiredCompletions)).toEqual([25, 50, 75, 100]);
  });

  it('arredonda para cima em metas que não dividem certo', () => {
    const milestones = createDefaultMilestones(10);

    expect(milestones.map((m) => m.requiredCompletions)).toEqual([3, 5, 8, 10]);
  });

  it('une marcos repetidos em metas pequenas, mantendo o de maior porcentagem', () => {
    const milestones = createDefaultMilestones(3);

    expect(milestones.map((m) => m.requiredCompletions)).toEqual([1, 2, 3]);
    expect(milestones[2].title).toBe('100% da meta');
  });
});

describe('milestoneKey', () => {
  it('junta o id da meta e o id do marco', () => {
    expect(milestoneKey('g1', '25')).toBe('g1:25');
  });
});

describe('getReachedMilestones', () => {
  const secondGoal: Goal = {
    id: 'g2',
    title: 'Calma',
    habitIds: ['h3'],
    target: 4,
    createdAt: '2026-11-10',
    milestones: createDefaultMilestones(4),
  };

  it('retorna uma lista vazia quando não há metas', () => {
    expect(getReachedMilestones([], habits)).toEqual([]);
  });

  it('retorna só os marcos já atingidos de uma meta', () => {
    // A meta g1 tem 3 conclusões, então só o marco de 25% (3 conclusões) foi atingido.
    expect(getReachedMilestones([goal], habits)).toEqual([
      { key: 'g1:25', goalTitle: 'Rotina de estudos', milestoneTitle: '25% da meta' },
    ]);
  });

  it('junta os marcos de várias metas, na ordem das metas', () => {
    // A meta g2 tem 2 conclusões (h3), então atingiu os marcos de 1 e 2 (25% e 50%).
    expect(getReachedMilestones([goal, secondGoal], habits).map((m) => m.key)).toEqual([
      'g1:25',
      'g2:25',
      'g2:50',
    ]);
  });

  it('não retorna marcos de metas sem progresso', () => {
    const noProgress = { ...goal, habitIds: ['removido'] };

    expect(getReachedMilestones([noProgress], habits)).toEqual([]);
  });
});