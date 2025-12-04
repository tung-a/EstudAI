import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import {
  COSMETIC_STYLES,
  MOCK_SHOP,
  Rarity,
  ShopItem,
  useCosmetics,
} from "@/contexts/CosmeticsContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PROFILE_PICTURE_IMAGE_MAP } from "@/lib/profilePictureAssets";
import { PROFILE_SIGNS } from "@/lib/profilePictures";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PROFILE_PICTURE_VARIANTS = [
  {
    key: "common",
    label: "Comum",
    price: 500,
    rarity: "common" as Rarity,
    colors: ["#5E60CE", "#4C46A0"],
  },
  {
    key: "rare",
    label: "Raro",
    price: 800,
    rarity: "rare" as Rarity,
    colors: ["#009FFD", "#2A2A72"],
  },
  {
    key: "epic",
    label: "Épico",
    price: 1200,
    rarity: "epic" as Rarity,
    colors: ["#FF6A88", "#FF99AC"],
  },
  {
    key: "legendary",
    label: "Lendário",
    price: 1800,
    rarity: "legendary" as Rarity,
    colors: ["#F9D423", "#FF4E50"],
  },
] as const;

const PROFILE_PICTURE_CATALOG = PROFILE_SIGNS.flatMap(({ slug, label }) =>
  PROFILE_PICTURE_VARIANTS.map(
    (variant) =>
      ({
        id: `pfp_${slug}_${variant.key}`,
        name: `Avatar ${label} • ${variant.label}`,
        type: "profile_picture",
        rarity: variant.rarity,
        price: variant.price,
        signSlug: slug,
        colors: variant.colors,
      } as ShopItem & { signSlug: string; colors: [string, string] })
  )
);

const PROFILE_PICTURE_COLOR_MAP = PROFILE_PICTURE_CATALOG.reduce(
  (acc, item) => ({ ...acc, [item.id]: item.colors }),
  {} as Record<string, [string, string]>
);

const ZODIAC_GRADIENTS: Record<string, [string, string]> = {
  aries: ["#FF6B6B", "#C44D58"],
  touro: ["#78C091", "#4E8D64"],
  gemeos: ["#56CCF2", "#2F80ED"],
  cancer: ["#9B8AFB", "#5C51C6"],
  leao: ["#FFB347", "#FF6F61"],
  virgem: ["#7BC6CC", "#3A6073"],
  libra: ["#F4E2D8", "#BA5370"],
  escorpiao: ["#A770EF", "#CF8BF3"],
  sagitario: ["#FDB99B", "#CF8BF3"],
  capricornio: ["#4B79A1", "#283E51"],
  aquario: ["#00B4DB", "#0083B0"],
  peixes: ["#89F7FE", "#66A6FF"],
};

PROFILE_SIGNS.forEach(({ slug }) => {
  PROFILE_PICTURE_COLOR_MAP[`pfp_zodiac_${slug}`] = ZODIAC_GRADIENTS[slug] || [
    "#2E004E",
    "#000000",
  ];
});

const DEFAULT_PROFILE_ITEMS: Record<string, ShopItem> = PROFILE_SIGNS.reduce(
  (acc, { slug, label }) => {
    const id = `pfp_zodiac_${slug}`;
    acc[id] = {
      id,
      name: `Avatar ${label} • Essência Zodiacal`,
      type: "profile_picture",
      rarity: "common",
      price: 0,
      image: PROFILE_PICTURE_IMAGE_MAP[id],
      description: "Avatar padrão inspirado no seu signo solar.",
    };
    return acc;
  },
  {} as Record<string, ShopItem>
);

const getItemImage = (id: string) => PROFILE_PICTURE_IMAGE_MAP[id];

export default function InventoryScreen() {
  const cosmetics = useCosmetics();
  const {
    inventory,
    equippedSkin,
    equippedBackground,
    equippedProfilePicture,
    equipItem,
  } = cosmetics;
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const router = useRouter();

  const [filter, setFilter] = useState<
    "card_skin" | "background" | "profile_picture"
  >("card_skin");

  const ownedItems = useMemo(() => {
    const base = MOCK_SHOP.filter((item) => inventory.includes(item.id));
    const avatars = PROFILE_PICTURE_CATALOG.filter((item) =>
      inventory.includes(item.id)
    ) as ShopItem[];
    const zodiacDefaults = inventory
      .map((id) => DEFAULT_PROFILE_ITEMS[id])
      .filter((item): item is ShopItem => Boolean(item));
    return [...zodiacDefaults, ...base, ...avatars];
  }, [inventory]);

  const filteredItems = useMemo(
    () => ownedItems.filter((item) => item.type === filter),
    [ownedItems, filter]
  );

  const getStyleForItem = (id: string) =>
    PROFILE_PICTURE_COLOR_MAP[id] ??
    COSMETIC_STYLES[id as keyof typeof COSMETIC_STYLES]?.colors ?? [
      "#333",
      "#000",
    ];

  const isEquipped = (itemId: string, type: string) =>
    type === "card_skin"
      ? equippedSkin === itemId
      : type === "background"
      ? equippedBackground === itemId
      : equippedProfilePicture === itemId;

  const handleEquip = async (item: ShopItem) => {
    await equipItem(item);
    Alert.alert("Equipado", `${item.name} agora está ativo.`);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons
              name="arrow-back"
              size={26}
              color={themeColors.text}
            />
          </TouchableOpacity>
          <ThemedText type="title" style={{ fontSize: 24 }}>
            Inventário
          </ThemedText>
          <View style={{ width: 26 }} />
        </View>

        {/* FILTROS (CORRIGIDO: flexGrow: 0 para não esticar) */}
        <View style={{ maxHeight: 60 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
            style={styles.filtersScroll}
          >
            {(
              [
                { label: "Peles de Tarot", value: "card_skin" },
                { label: "Ambientes Cósmicos", value: "background" },
                { label: "Avatares", value: "profile_picture" },
              ] as const
            ).map((tab) => {
              const active = filter === tab.value;
              return (
                <TouchableOpacity
                  key={tab.value}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: active
                        ? themeColors.accent
                        : themeColors.icon + "30",
                      backgroundColor: active
                        ? themeColors.accent + "20"
                        : "transparent",
                    },
                  ]}
                  onPress={() => setFilter(tab.value)}
                >
                  <Text
                    style={{
                      color: active ? themeColors.accent : themeColors.text,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* GRID DE ITENS */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
        >
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="auto-awesome"
                size={36}
                color={themeColors.icon + "80"}
              />
              <ThemedText
                style={{ textAlign: "center", opacity: 0.7, marginTop: 8 }}
              >
                Nenhum item encontrado aqui. Visite o Mercado Astral para
                adquirir novas relíquias.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredItems.map((item) => {
                const style = getStyleForItem(item.id);
                const equipped = isEquipped(item.id, item.type);
                const previewImage = getItemImage(item.id);

                // Lógica de Aspect Ratio (Quadrado para avatar, Retângulo para o resto)
                const isAvatar = item.type === "profile_picture";
                const itemAspectRatio = isAvatar ? 1 : 3 / 4;

                return (
                  <View key={item.id} style={styles.cardWrapper}>
                    <ThemedView
                      style={[
                        styles.card,
                        { backgroundColor: themeColors.card },
                      ]}
                    >
                      {/* Container da imagem com formato dinâmico */}
                      <View
                        style={[
                          styles.previewBox,
                          { aspectRatio: itemAspectRatio },
                        ]}
                      >
                        {previewImage ? (
                          <Image
                            source={previewImage}
                            resizeMode="cover"
                            style={styles.previewImage}
                          />
                        ) : (
                          <>
                            <LinearGradient
                              colors={style}
                              style={StyleSheet.absoluteFill}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            />
                            <MaterialIcons
                              name={
                                item.type === "card_skin"
                                  ? "style"
                                  : item.type === "background"
                                  ? "landscape"
                                  : "person"
                              }
                              size={42}
                              color="#FFF"
                            />
                          </>
                        )}
                      </View>

                      <ThemedText style={styles.cardTitle} numberOfLines={1}>
                        {item.name}
                      </ThemedText>
                      <ThemedText style={styles.cardSubtitle}>
                        {item.rarity}
                      </ThemedText>

                      <TouchableOpacity
                        style={[
                          styles.equipButton,
                          {
                            backgroundColor: equipped
                              ? themeColors.icon + "25"
                              : themeColors.accent,
                          },
                        ]}
                        onPress={() => handleEquip(item)}
                        disabled={equipped}
                      >
                        <Text
                          style={{
                            color: equipped ? themeColors.text : "#FFF",
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          {equipped ? "Equipado" : "Equipar"}
                        </Text>
                      </TouchableOpacity>
                    </ThemedView>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  // CORREÇÃO DOS FILTROS AQUI
  filtersScroll: {
    paddingLeft: 20,
    marginBottom: 12,
    flexGrow: 0, // Impede o ScrollView de crescer verticalmente
  },
  filtersRow: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 20,
    alignItems: "center", // Mantém os botões alinhados
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: "rgba(128,128,128,0.08)",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 16,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  previewBox: {
    width: "100%",
    // aspectRatio é definido inline agora
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1c1c1f",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginTop: 10,
  },
  cardSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  equipButton: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
});
