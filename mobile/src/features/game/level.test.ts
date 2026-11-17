import { getAvatarStage, getLevelInfo, xpRequiredForLevel } from './level';

describe('xpRequiredForLevel', () => {
  it('nível 1 não exige XP', () => {
    expect(xpRequiredForLevel(1)).toBe(0);
  });

  it('cada nível exige mais XP que o anterior', () => {
    expect(xpRequiredForLevel(2)).toBe(40);
    expect(xpRequiredForLevel(3)).toBe(160);
    expect(xpRequiredForLevel(4)).toBe(360);
  });
});

describe('getLevelInfo', () => {
  it('começa no nível 1 com 0 de progresso', () => {
    expect(getLevelInfo(0)).toEqual({ level: 1, xpIntoLevel: 0, xpNeeded: 40, progress: 0 });
  });

  it('continua no nível 1 um XP antes de subir', () => {
    const info = getLevelInfo(39);

    expect(info.level).toBe(1);
    expect(info.xpIntoLevel).toBe(39);
    expect(info.progress).toBeCloseTo(0.975);
  });

  it('sobe para o nível 2 exatamente em 40 XP', () => {
    expect(getLevelInfo(40)).toEqual({ level: 2, xpIntoLevel: 0, xpNeeded: 120, progress: 0 });
  });

  it('continua no nível 2 um XP antes do nível 3', () => {
    const info = getLevelInfo(159);

    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(119);
    expect(info.xpNeeded).toBe(120);
  });

  it('sobe para o nível 3 exatamente em 160 XP', () => {
    expect(getLevelInfo(160).level).toBe(3);
  });

  it('trata XP negativo como zero', () => {
    expect(getLevelInfo(-10)).toEqual({ level: 1, xpIntoLevel: 0, xpNeeded: 40, progress: 0 });
  });
});

describe('getAvatarStage', () => {
  it('usa a semente nos níveis iniciais', () => {
    expect(getAvatarStage(1).name).toBe('Semente');
    expect(getAvatarStage(2).name).toBe('Semente');
  });

  it('evolui para broto a partir do nível 3', () => {
    expect(getAvatarStage(3).name).toBe('Broto');
    expect(getAvatarStage(5).name).toBe('Broto');
  });

  it('evolui para árvore a partir do nível 6', () => {
    expect(getAvatarStage(6).name).toBe('Árvore');
  });

  it('mantém o último estágio nos níveis mais altos', () => {
    expect(getAvatarStage(10).name).toBe('Floração');
    expect(getAvatarStage(50).name).toBe('Floração');
  });
});