export type Milestone = {
  id: string;
  title: string;
  /** Quantas conclusões somadas são necessárias para atingir este marco. */
  requiredCompletions: number;
};

export type Goal = {
  id: string;
  title: string;
  /** Hábitos que contam para o progresso desta meta. */
  habitIds: string[];
  /** Total de conclusões (somando os hábitos vinculados) para completar a meta. */
  target: number;
  /** Dia em que a meta foi criada, no formato 'YYYY-MM-DD'. Só conclusões a partir dele contam. */
  createdAt: string;
  milestones: Milestone[];
};