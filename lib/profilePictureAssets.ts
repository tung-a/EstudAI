import { ZodiacImages } from "@/lib/astrology";
import {
    PROFILE_SIGNS,
    getSignLabelFromSlug,
} from "@/lib/profilePictures";

export const PROFILE_PICTURE_IMAGE_MAP: Record<string, any> = {
  pfp_aries_common: require("@/assets/images/profile-pictures/aries/common.png"),
  pfp_aries_rare: require("@/assets/images/profile-pictures/aries/rare.png"),
  pfp_aries_epic: require("@/assets/images/profile-pictures/aries/epic.png"),
  pfp_aries_legendary: require("@/assets/images/profile-pictures/aries/legendary.png"),
  pfp_touro_common: require("@/assets/images/profile-pictures/touro/common.png"),
  pfp_touro_rare: require("@/assets/images/profile-pictures/touro/rare.png"),
  pfp_touro_epic: require("@/assets/images/profile-pictures/touro/epic.png"),
  pfp_touro_legendary: require("@/assets/images/profile-pictures/touro/legendary.png"),
  pfp_gemeos_common: require("@/assets/images/profile-pictures/gemeos/common.png"),
  pfp_gemeos_rare: require("@/assets/images/profile-pictures/gemeos/rare.png"),
  pfp_gemeos_epic: require("@/assets/images/profile-pictures/gemeos/epic.png"),
  pfp_gemeos_legendary: require("@/assets/images/profile-pictures/gemeos/legendary.png"),
  pfp_cancer_common: require("@/assets/images/profile-pictures/cancer/common.png"),
  pfp_cancer_rare: require("@/assets/images/profile-pictures/cancer/rare.png"),
  pfp_cancer_epic: require("@/assets/images/profile-pictures/cancer/epic.png"),
  pfp_cancer_legendary: require("@/assets/images/profile-pictures/cancer/legendary.png"),
  pfp_leao_common: require("@/assets/images/profile-pictures/leao/common.png"),
  pfp_leao_rare: require("@/assets/images/profile-pictures/leao/rare.png"),
  pfp_leao_epic: require("@/assets/images/profile-pictures/leao/epic.png"),
  pfp_leao_legendary: require("@/assets/images/profile-pictures/leao/legendary.png"),
  pfp_virgem_common: require("@/assets/images/profile-pictures/virgem/common.png"),
  pfp_virgem_rare: require("@/assets/images/profile-pictures/virgem/rare.png"),
  pfp_virgem_epic: require("@/assets/images/profile-pictures/virgem/epic.png"),
  pfp_virgem_legendary: require("@/assets/images/profile-pictures/virgem/legendary.png"),
  pfp_libra_common: require("@/assets/images/profile-pictures/libra/common.png"),
  pfp_libra_rare: require("@/assets/images/profile-pictures/libra/rare.png"),
  pfp_libra_epic: require("@/assets/images/profile-pictures/libra/epic.png"),
  pfp_libra_legendary: require("@/assets/images/profile-pictures/libra/legendary.png"),
  pfp_escorpiao_common: require("@/assets/images/profile-pictures/escorpiao/common.png"),
  pfp_escorpiao_rare: require("@/assets/images/profile-pictures/escorpiao/rare.png"),
  pfp_escorpiao_epic: require("@/assets/images/profile-pictures/escorpiao/epic.png"),
  pfp_escorpiao_legendary: require("@/assets/images/profile-pictures/escorpiao/legendary.png"),
  pfp_sagitario_common: require("@/assets/images/profile-pictures/sagitario/common.png"),
  pfp_sagitario_rare: require("@/assets/images/profile-pictures/sagitario/rare.png"),
  pfp_sagitario_epic: require("@/assets/images/profile-pictures/sagitario/epic.png"),
  pfp_sagitario_legendary: require("@/assets/images/profile-pictures/sagitario/legendary.png"),
  pfp_capricornio_common: require("@/assets/images/profile-pictures/capricornio/common.png"),
  pfp_capricornio_rare: require("@/assets/images/profile-pictures/capricornio/rare.png"),
  pfp_capricornio_epic: require("@/assets/images/profile-pictures/capricornio/epic.png"),
  pfp_capricornio_legendary: require("@/assets/images/profile-pictures/capricornio/legendary.png"),
  pfp_aquario_common: require("@/assets/images/profile-pictures/aquario/common.png"),
  pfp_aquario_rare: require("@/assets/images/profile-pictures/aquario/rare.png"),
  pfp_aquario_epic: require("@/assets/images/profile-pictures/aquario/epic.png"),
  pfp_aquario_legendary: require("@/assets/images/profile-pictures/aquario/legendary.png"),
  pfp_peixes_common: require("@/assets/images/profile-pictures/peixes/common.png"),
  pfp_peixes_rare: require("@/assets/images/profile-pictures/peixes/rare.png"),
  pfp_peixes_epic: require("@/assets/images/profile-pictures/peixes/epic.png"),
  pfp_peixes_legendary: require("@/assets/images/profile-pictures/peixes/legendary.png"),
};

PROFILE_SIGNS.forEach(({ slug, label }) => {
  const zodiacImage = ZodiacImages[label];
  if (zodiacImage) {
    PROFILE_PICTURE_IMAGE_MAP[`pfp_zodiac_${slug}`] = zodiacImage;
  }
});

export const getProfilePictureImageSource = (
  pictureId?: string | null,
  zodiacSign?: string | null
) => {
  if (pictureId && PROFILE_PICTURE_IMAGE_MAP[pictureId]) {
    return PROFILE_PICTURE_IMAGE_MAP[pictureId];
  }

  if (pictureId?.startsWith("pfp_zodiac_")) {
    const slug = pictureId.replace("pfp_zodiac_", "");
    const label = getSignLabelFromSlug(slug);
    if (label && ZodiacImages[label]) {
      return ZodiacImages[label];
    }
  }

  if (zodiacSign && ZodiacImages[zodiacSign]) {
    return ZodiacImages[zodiacSign];
  }

  return null;
};
