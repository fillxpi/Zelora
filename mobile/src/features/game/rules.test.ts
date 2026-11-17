import { applyStreakFreezes, getDailyStreak } from './rules';

const TODAY = '2026-11-16';

describe('getDailyStreak', () => {
  it('retorna 0 sem nenhuma atividade', () => {
    expect(getDailyStreak([], [], TODAY)).toBe(0);
  });

  it('conta dias protegidos como parte da sequência', () => {
    expect(getDailyStreak(['2026-11-14', '2026-11-16'], ['2026-11-15'], TODAY)).toBe(3);
  });

  it('mantém a sequência viva quando hoje ainda não teve atividade', () => {
    expect(getDailyStreak(['2026-11-14'], ['2026-11-15'], TODAY)).toBe(2);
  });
});

describe('applyStreakFreezes', () => {
  it('na primeira execução só marca o ponto de partida', () => {
    const state = { freezes: 1, frozenDates: [], lastCheckedDate: null };

    expect(applyStreakFreezes(['2026-11-15'], state, TODAY)).toEqual({
      freezes: 1,
      frozenDates: [],
      lastCheckedDate: '2026-11-15',
    });
  });

  it('não gasta proteção quando não houve dia perdido', () => {
    const state = { freezes: 1, frozenDates: [], lastCheckedDate: '2026-11-14' };

    expect(applyStreakFreezes(['2026-11-15'], state, TODAY)).toEqual({
      freezes: 1,
      frozenDates: [],
      lastCheckedDate: '2026-11-15',
    });
  });

  it('gasta uma proteção para cobrir um dia perdido de quem tinha sequência', () => {
    const state = { freezes: 1, frozenDates: [], lastCheckedDate: '2026-11-13' };

    // Ativo no dia 13, perdeu o dia 14 e fez o dia 15.
    expect(applyStreakFreezes(['2026-11-13', '2026-11-15'], state, TODAY)).toEqual({
      freezes: 0,
      frozenDates: ['2026-11-14'],
      lastCheckedDate: '2026-11-15',
    });
  });

  it('não cobre o dia perdido quando não há proteções', () => {
    const state = { freezes: 0, frozenDates: [], lastCheckedDate: '2026-11-13' };

    expect(applyStreakFreezes(['2026-11-13'], state, TODAY)).toEqual({
      freezes: 0,
      frozenDates: [],
      lastCheckedDate: '2026-11-15',
    });
  });

  it('não gasta proteção quando o usuário não tinha sequência', () => {
    const state = { freezes: 2, frozenDates: [], lastCheckedDate: '2026-11-13' };

    expect(applyStreakFreezes([], state, TODAY)).toEqual({
      freezes: 2,
      frozenDates: [],
      lastCheckedDate: '2026-11-15',
    });
  });

  it('com uma proteção e dois dias perdidos, cobre só o primeiro', () => {
    const state = { freezes: 1, frozenDates: [], lastCheckedDate: '2026-11-13' };

    expect(applyStreakFreezes(['2026-11-13'], state, TODAY)).toEqual({
      freezes: 0,
      frozenDates: ['2026-11-14'],
      lastCheckedDate: '2026-11-15',
    });
  });

  it('com duas proteções e dois dias perdidos, cobre os dois', () => {
    const state = { freezes: 2, frozenDates: [], lastCheckedDate: '2026-11-13' };

    expect(applyStreakFreezes(['2026-11-13'], state, TODAY)).toEqual({
      freezes: 0,
      frozenDates: ['2026-11-14', '2026-11-15'],
      lastCheckedDate: '2026-11-15',
    });
  });

  it('chamar duas vezes no mesmo dia dá o mesmo resultado', () => {
    const state = { freezes: 1, frozenDates: [], lastCheckedDate: '2026-11-13' };
    const active = ['2026-11-13', '2026-11-15'];

    const once = applyStreakFreezes(active, state, TODAY);
    const twice = applyStreakFreezes(active, once, TODAY);

    expect(twice).toEqual(once);
  });
});