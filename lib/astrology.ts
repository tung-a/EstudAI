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
 */
export const getSunSign = (day: number, month: number): string => {
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
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  return { day, month, year };
};

export const ZodiacImages: Record<string, any> = {
  Áries: require("@/assets/images/zodiac/Aries_pfp.png"),
  Touro: require("@/assets/images/zodiac/Taurus_pfp.png"),
  Gêmeos: require("@/assets/images/zodiac/Gemini_pfp.png"),
  Câncer: require("@/assets/images/zodiac/Cancer_pfp.png"),
  Leão: require("@/assets/images/zodiac/Leo_pfp.png"),
  Virgem: require("@/assets/images/zodiac/Virgo_pfp.png"),
  Libra: require("@/assets/images/zodiac/Libra_pfp.png"),
  Escorpião: require("@/assets/images/zodiac/Scorpio_pfp.png"),
  Sagitário: require("@/assets/images/zodiac/Sagittarius_pfp.png"),
  Capricórnio: require("@/assets/images/zodiac/Capricorn_pfp.png"),
  Aquário: require("@/assets/images/zodiac/Aquarius_pfp.png"),
  Peixes: require("@/assets/images/zodiac/Pisces_pfp.png"),
};

// --- SINERGIA ASTRAL (Atualizada para Astrum) ---

const SignsElements: Record<string, "Fogo" | "Terra" | "Ar" | "Água"> = {
  Áries: "Fogo",
  Leão: "Fogo",
  Sagitário: "Fogo",
  Touro: "Terra",
  Virgem: "Terra",
  Capricórnio: "Terra",
  Gêmeos: "Ar",
  Libra: "Ar",
  Aquário: "Ar",
  Câncer: "Água",
  Escorpião: "Água",
  Peixes: "Água",
};

export type SynergyResult = {
  title: string;
  description: string;
  score: number; // 1 a 5
  elementA: string;
  elementB: string;
};

export const getSignElement = (sign: string): string => {
  return SignsElements[sign] || "Mistério";
};

// Renomeado de getStudySynergy para getAstralSynergy
export const getAstralSynergy = (
  sign1: string,
  sign2: string
): SynergyResult => {
  const el1 = SignsElements[sign1];
  const el2 = SignsElements[sign2];

  if (!el1 || !el2)
    return {
      title: "Energia Misteriosa",
      description:
        "Os astros ainda não revelaram a conexão completa entre esses signos. Caminhem com curiosidade.",
      score: 3,
      elementA: el1 || "?",
      elementB: el2 || "?",
    };

  // 1. Mesmo Elemento (Identidade)
  if (el1 === el2)
    return {
      title: "Espelhos da Alma",
      description: `Ambos vibram no elemento ${el1}. A compreensão é instantânea e a convivência flui naturalmente. Cuidado apenas para não intensificarem demais os mesmos padrões emocionais.`,
      score: 5,
      elementA: el1,
      elementB: el2,
    };

  // 2. Combinações Harmônicas (Fogo+Ar ou Terra+Água)
  if ((el1 === "Fogo" && el2 === "Ar") || (el1 === "Ar" && el2 === "Fogo"))
    return {
      title: "Expansão e Movimento",
      description:
        "O Ar alimenta o Fogo. Uma conexão cheia de entusiasmo, conversas longas e aventuras. Juntos, vocês inspiram um ao outro a ir mais longe.",
      score: 4,
      elementA: el1,
      elementB: el2,
    };

  if (
    (el1 === "Terra" && el2 === "Água") ||
    (el1 === "Água" && el2 === "Terra")
  )
    return {
      title: "Jardim Fértil",
      description:
        "A Água nutre a Terra. Uma relação de apoio profundo e acolhimento. Um traz a segurança, o outro traz a sensibilidade. Conexão que cria raízes fortes.",
      score: 4,
      elementA: el1,
      elementB: el2,
    };

  // 3. Opostos Complementares ou Desafiadores (Fogo+Água ou Terra+Ar)
  if ((el1 === "Fogo" && el2 === "Água") || (el1 === "Água" && el2 === "Fogo"))
    return {
      title: "Vapor e Intensidade",
      description:
        "Emoção versus Ação. Podem criar uma atmosfera apaixonante ou conflituosa. Exige sabedoria: a água não pode apagar o fogo, e o fogo não deve secar a água.",
      score: 3,
      elementA: el1,
      elementB: el2,
    };

  if ((el1 === "Terra" && el2 === "Ar") || (el1 === "Ar" && el2 === "Terra"))
    return {
      title: "Céu e Terra",
      description:
        "O Ar sonha, a Terra constrói. Podem parecer distantes no início, mas se aprenderem a traduzir suas linguagens, realizam o impossível juntos.",
      score: 3,
      elementA: el1,
      elementB: el2,
    };

  // 4. Fricção (Fogo+Terra ou Ar+Água)
  return {
    title: "Encontro de Forças",
    description:
      "Elementos distintos que trazem grandes lições. A convivência exige adaptação, mas é justamente nas diferenças que vocês mais evoluem espiritualmente.",
    score: 2,
    elementA: el1,
    elementB: el2,
  };
};

export type TarotAuraType =
  | "expansion"
  | "introspection"
  | "challenge"
  | "neutral";

export const getTarotAura = (
  cardName?: string
): { type: TarotAuraType; color: string } => {
  if (!cardName) return { type: "neutral", color: "transparent" };

  const expansionCards = [
    "O Mago",
    "A Imperatriz",
    "O Imperador",
    "O Carro",
    "A Roda da Fortuna",
    "A Força",
    "A Estrela",
    "O Sol",
    "O Julgamento",
    "O Mundo",
  ];

  const introspectionCards = [
    "A Sacerdotisa",
    "O Hierofante",
    "O Eremita",
    "O Enforcado",
    "A Temperança",
    "A Lua",
  ];

  const challengeCards = [
    "O Louco",
    "Os Enamorados",
    "A Justiça",
    "A Morte",
    "O Diabo",
    "A Torre",
  ];

  if (expansionCards.includes(cardName)) {
    return { type: "expansion", color: "#FFD700" }; // Dourado
  }
  if (introspectionCards.includes(cardName)) {
    return { type: "introspection", color: "#B0BEC5" }; // Prateado/Cinza Azulado
  }
  if (challengeCards.includes(cardName)) {
    return { type: "challenge", color: "#FF5722" }; // Laranja Intenso
  }

  return { type: "neutral", color: "transparent" };
};
