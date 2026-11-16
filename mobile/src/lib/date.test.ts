import { getLastDays, shiftDateKey, toDateKey } from './date';

describe('toDateKey', () => {
  it('formata a data como YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 10, 16))).toBe('2026-11-16');
  });

  it('completa mês e dia com zero à esquerda', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('shiftDateKey', () => {
  it('soma dias dentro do mesmo mês', () => {
    expect(shiftDateKey('2026-11-16', 3)).toBe('2026-11-19');
  });

  it('volta dias atravessando a virada de mês', () => {
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('avança atravessando a virada de ano', () => {
    expect(shiftDateKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('considera ano bissexto', () => {
    expect(shiftDateKey('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('não altera a data quando soma zero dias', () => {
    expect(shiftDateKey('2026-11-16', 0)).toBe('2026-11-16');
  });
});

describe('getLastDays', () => {
  it('retorna os dias em ordem crescente, terminando no dia informado', () => {
    expect(getLastDays(3, '2026-11-16')).toEqual(['2026-11-14', '2026-11-15', '2026-11-16']);
  });

  it('atravessa a virada de mês', () => {
    expect(getLastDays(3, '2026-12-01')).toEqual(['2026-11-29', '2026-11-30', '2026-12-01']);
  });

  it('retorna uma lista vazia quando o total é zero', () => {
    expect(getLastDays(0, '2026-11-16')).toEqual([]);
  });
});