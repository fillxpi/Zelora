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

/**
 * Soma (ou subtrai, com número negativo) dias a uma data no formato 'YYYY-MM-DD'.
 * Usa o construtor de data local, então não sofre com horário de verão.
 */
export function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return toDateKey(new Date(year, month - 1, day + days));
}

/**
 * Retorna os últimos `count` dias, do mais antigo ao mais recente (o último é `endKey`, por padrão hoje).
 */
export function getLastDays(count: number, endKey: string = toDateKey()): string[] {
  return Array.from({ length: count }, (_, index) => shiftDateKey(endKey, index - (count - 1)));
}