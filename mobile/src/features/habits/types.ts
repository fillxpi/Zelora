export type Habit = {
  id: string;
  title: string;
  /** Dias em que o hábito foi concluído, no formato 'YYYY-MM-DD'. */
  completedDates: string[];
};