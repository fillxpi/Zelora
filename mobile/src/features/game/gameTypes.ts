export type GameState = {
  /** Moedas que o usuário tem para gastar. */
  coins: number;
  /** Experiência total acumulada, que define o nível. */
  xp: number;
  /** Quantas proteções de sequência (streak freezes) ele tem guardadas. */
  freezes: number;
  /** Dias perdidos que foram cobertos por uma proteção, no formato 'YYYY-MM-DD'. */
  frozenDates: string[];
  /** Último dia até o qual as proteções já foram verificadas. */
  lastCheckedDate: string | null;
  /** Marcos de metas que já deram recompensa (formato 'idDaMeta:idDoMarco'). */
  claimedMilestones: string[];
};