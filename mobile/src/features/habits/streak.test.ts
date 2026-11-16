import { getCurrentStreak } from './streak';

const TODAY = '2026-11-16';

describe('getCurrentStreak', () => {
  it('retorna 0 quando não há nenhum dia concluído', () => {
    expect(getCurrentStreak([], TODAY)).toBe(0);
  });

  it('conta 1 quando só hoje foi feito', () => {
    expect(getCurrentStreak(['2026-11-16'], TODAY)).toBe(1);
  });

  it('conta dias seguidos terminando hoje', () => {
    expect(getCurrentStreak(['2026-11-14', '2026-11-15', '2026-11-16'], TODAY)).toBe(3);
  });

  it('mantém a sequência viva quando hoje ainda não foi feito', () => {
    expect(getCurrentStreak(['2026-11-14', '2026-11-15'], TODAY)).toBe(2);
  });

  it('zera quando passou um dia inteiro sem fazer', () => {
    expect(getCurrentStreak(['2026-11-13', '2026-11-14'], TODAY)).toBe(0);
  });

  it('para no primeiro buraco da sequência', () => {
    const dates = ['2026-11-10', '2026-11-11', '2026-11-13', '2026-11-14', '2026-11-15'];
    expect(getCurrentStreak(dates, TODAY)).toBe(3);
  });

  it('atravessa a virada de mês', () => {
    expect(getCurrentStreak(['2026-10-30', '2026-10-31', '2026-11-01'], '2026-11-01')).toBe(3);
  });

  it('ignora datas repetidas', () => {
    expect(getCurrentStreak(['2026-11-15', '2026-11-15', '2026-11-16'], TODAY)).toBe(2);
  });

  it('não depende da ordem das datas', () => {
    expect(getCurrentStreak(['2026-11-16', '2026-11-14', '2026-11-15'], TODAY)).toBe(3);
  });
});