/** XP base da curva de níveis. Quanto maior, mais devagar se sobe de nível. */
const XP_BASE = 40;

export type LevelInfo = {
  level: number;
  /** XP acumulado dentro do nível atual. */
  xpIntoLevel: number;
  /** XP total necessário para completar o nível atual. */
  xpNeeded: number;
  /** Progresso no nível atual, de 0 a 1. */
  progress: number;
};

/**
 * XP total necessário para ALCANÇAR um nível.
 * Nível 1 = 0, nível 2 = 40, nível 3 = 160, nível 4 = 360...
 * Cada nível exige um pouco mais que o anterior.
 */
export function xpRequiredForLevel(level: number): number {
  return XP_BASE * (level - 1) ** 2;
}

export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, xp);

  let level = 1;
  while (safeXp >= xpRequiredForLevel(level + 1)) {
    level += 1;
  }

  const levelStart = xpRequiredForLevel(level);
  const nextLevelStart = xpRequiredForLevel(level + 1);
  const xpIntoLevel = safeXp - levelStart;
  const xpNeeded = nextLevelStart - levelStart;

  return { level, xpIntoLevel, xpNeeded, progress: xpIntoLevel / xpNeeded };
}

export type AvatarStage = {
  minLevel: number;
  emoji: string;
  name: string;
};

/** Estágios do avatar (uma plantinha que cresce). Depois dá para trocar por ilustrações próprias. */
const AVATAR_STAGES: AvatarStage[] = [
  { minLevel: 1, emoji: '🌱', name: 'Semente' },
  { minLevel: 3, emoji: '🌿', name: 'Broto' },
  { minLevel: 6, emoji: '🌳', name: 'Árvore' },
  { minLevel: 10, emoji: '🌸', name: 'Floração' },
];

export function getAvatarStage(level: number): AvatarStage {
  let current = AVATAR_STAGES[0];

  for (const stage of AVATAR_STAGES) {
    if (level >= stage.minLevel) {
      current = stage;
    }
  }

  return current;
}