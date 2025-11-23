// lib/astrology.ts

export const ZodiacSigns = [
  "Áries",
  "Touro",
  "Gêmeos",
  "Câncer",
  "Leão",
  "Virgem",
  "Libra",
  "Escorpião",
  "Sagitário",
  "Capricórnio",
  "Aquário",
  "Peixes",
] as const;

export type ZodiacSign = (typeof ZodiacSigns)[number];

/**
 * Calcula o Signo Solar baseado no dia e mês.
 * As datas de corte podem variar levemente dependendo do ano e fuso,
 * mas esta é a tabela padrão usada na maioria dos horóscopos populares.
 */
export const getSunSign = (day: number, month: number): string => {
  // Mês 1 = Janeiro, Mês 12 = Dezembro

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
    return "Aquário";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Peixes";
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Áries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Touro";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gêmeos";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Câncer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leão";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgem";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
    return "Escorpião";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
    return "Sagitário";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
    return "Capricórnio";

  return "Desconhecido";
};

/**
 * Função auxiliar para parsear a string de data "DD/MM/AAAA"
 */
export const parseDateString = (
  dateString: string
): { day: number; month: number; year: number } | null => {
  const parts = dateString.split("/");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  // Validação básica
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  return { day, month, year };
};

export const ZodiacImages: Record<string, any> = {
  "Áries": require("@/assets/images/zodiac/Aries_pfp.png"),
  "Touro": require("@/assets/images/zodiac/Taurus_pfp.png"),
  "Gêmeos": require("@/assets/images/zodiac/Gemini_pfp.png"),
  "Câncer": require("@/assets/images/zodiac/Cancer_pfp.png"),
  "Leão": require("@/assets/images/zodiac/Leo_pfp.png"),
  "Virgem": require("@/assets/images/zodiac/Virgo_pfp.png"),
  "Libra": require("@/assets/images/zodiac/Libra_pfp.png"),
  "Escorpião": require("@/assets/images/zodiac/Scorpio_pfp.png"),
  "Sagitário": require("@/assets/images/zodiac/Sagittarius_pfp.png"),
  "Capricórnio": require("@/assets/images/zodiac/Capricorn_pfp.png"),
  "Aquário": require("@/assets/images/zodiac/Aquarius_pfp.png"),
  "Peixes": require("@/assets/images/zodiac/Pisces_pfp.png"),
};
