/** Retorna a data local atual no formato "YYYY-MM-DD" */
export const getLocalDate = (): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

/** Retorna um array com os 7 objetos Date para a semana de uma data */
export const getWeekDays = (referenceDate: Date): Date[] => {
  const date = new Date(referenceDate);
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda...
  const diff = date.getDate() - dayOfWeek;
  const startOfWeek = new Date(date.setDate(diff));

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(startOfWeek);
    nextDay.setDate(startOfWeek.getDate() + i);
    week.push(nextDay);
  }
  return week;
};

/** Formata um objeto Date para "YYYY-MM-DD" */
export const formatDate = (date: Date): string => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

/** Formata o cabeçalho para "Hoje", "Amanhã", etc. */
export const formatHeaderTitle = (dateString: string): string => {
  const today = new Date(getLocalDate());
  const [year, month, day] = dateString.split("-").map(Number);
  const eventDate = new Date(year, month - 1, day);

  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  const dateLabel = eventDate.toLocaleDateString("pt-BR", options);

  if (diffDays === 0) return `Hoje, ${dateLabel}`;
  if (diffDays === 1) return `Amanhã, ${dateLabel}`;
  if (diffDays === -1) return `Ontem, ${dateLabel}`;

  const weekdayOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    ...options,
  };
  return eventDate.toLocaleDateString("pt-BR", weekdayOptions);
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
};
