/**
 * Converte uma data para o formato 'YYYY-MM-DD' usando o fuso horário LOCAL do usuário.
 * Isso importa para o streak: "hoje" precisa ser o dia do usuário, não o dia em UTC.
 */
export function toDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}