const removeDiacritics = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");

export const PROFILE_SIGNS = [
  { slug: "aries", label: "Áries" },
  { slug: "touro", label: "Touro" },
  { slug: "gemeos", label: "Gêmeos" },
  { slug: "cancer", label: "Câncer" },
  { slug: "leao", label: "Leão" },
  { slug: "virgem", label: "Virgem" },
  { slug: "libra", label: "Libra" },
  { slug: "escorpiao", label: "Escorpião" },
  { slug: "sagitario", label: "Sagitário" },
  { slug: "capricornio", label: "Capricórnio" },
  { slug: "aquario", label: "Aquário" },
  { slug: "peixes", label: "Peixes" },
] as const;

export type ProfileSign = (typeof PROFILE_SIGNS)[number];
export type ProfileSignSlug = ProfileSign["slug"];

const SIGN_LABEL_MAP = PROFILE_SIGNS.reduce(
  (acc, sign) => ({ ...acc, [sign.slug]: sign.label }),
  {} as Record<string, string>
);

export const getSignSlugFromName = (zodiacSign?: string | null) => {
  if (!zodiacSign) return "";
  return removeDiacritics(zodiacSign);
};

export const getSignLabelFromSlug = (slug: string) =>
  SIGN_LABEL_MAP[slug] || slug;

export const PROFILE_PICTURE_TIERS = [
  "common",
  "rare",
  "epic",
  "legendary",
] as const;

export type ProfilePictureTier = (typeof PROFILE_PICTURE_TIERS)[number];

export const getProfilePictureId = (
  zodiacSign?: string | null,
  tier: ProfilePictureTier = "common"
): string | null => {
  const slug = getSignSlugFromName(zodiacSign);
  if (!slug) return null;
  return `pfp_${slug}_${tier}`;
};

export const getDefaultProfilePictureId = (
  zodiacSign?: string | null
): string | null => {
  const slug = getSignSlugFromName(zodiacSign);
  if (!slug) return null;
  return `pfp_zodiac_${slug}`;
};
