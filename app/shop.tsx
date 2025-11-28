import { ShopCard } from "@/components/shop/ShopCard";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import {
  COSMETIC_STYLES,
  MOCK_SHOP,
  ShopItem,
  useCosmetics,
} from "@/contexts/CosmeticsContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

const CURRENCY_PACKS = [
  {
    id: "pile",
    amount: 500,
    price: "R$ 4,90",
    icon: "star-half" as MaterialIconName,
    color: "#FFD700",
  },
  {
    id: "bag",
    amount: 1200,
    price: "R$ 9,90",
    icon: "star" as MaterialIconName,
    color: "#FFA000",
  },
  {
    id: "chest",
    amount: 2500,
    price: "R$ 19,90",
    icon: "stars" as MaterialIconName,
    color: "#FF5722",
  },
];

export default function ShopScreen() {
  const {
    currency,
    inventory,
    buyItem,
    equipItem,
    addStardust,
    equippedSkin,
    equippedBackground,
  } = useCosmetics();

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const router = useRouter();

  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const previewStyle = selectedItem
    ? COSMETIC_STYLES[selectedItem.id as keyof typeof COSMETIC_STYLES]
    : null;

  const getIconColor = () => {
    if (previewStyle && "iconColor" in previewStyle) {
      return previewStyle.iconColor;
    }
    return "#FFF";
  };

  const handlePurchase = async () => {
    if (!selectedItem) return;
    const success = await buyItem(selectedItem);
    if (success) {
    }
  };

  const handleEquip = async () => {
    if (!selectedItem) return;
    await equipItem(selectedItem);
    setSelectedItem(null);
    Alert.alert("Equipado", `${selectedItem.name} agora está ativo.`);
  };

  const handleBuyPack = async (pack: (typeof CURRENCY_PACKS)[0]) => {
    await addStardust(pack.amount);
    setCurrencyModalVisible(false);
    Alert.alert(
      "Compra Realizada",
      `+${pack.amount} Poeira Estelar adicionada!`
    );
  };

  const skins = MOCK_SHOP.filter((i) => i.type === "card_skin");
  const backgrounds = MOCK_SHOP.filter((i) => i.type === "background");

  // Helper para buscar cores
  const getItemColors = (id: string) => {
    const style = COSMETIC_STYLES[id as keyof typeof COSMETIC_STYLES];
    return style ? style.colors : ["#333", "#000"];
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <MaterialIcons
                name="arrow-back"
                size={28}
                color={themeColors.text}
              />
            </TouchableOpacity>
            <ThemedText type="title" style={{ fontSize: 24 }}>
              Mercado
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.currencyBadge,
              { backgroundColor: themeColors.card },
            ]}
            onPress={() => setCurrencyModalVisible(true)}
          >
            <MaterialIcons name="auto-awesome" size={18} color="#FFD700" />
            <ThemedText style={styles.currencyText}>{currency}</ThemedText>
            <View style={styles.plusButton}>
              <MaterialIcons name="add" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="style" size={24} color={themeColors.accent} />
            <ThemedText type="subtitle">Peles de Tarot</ThemedText>
          </View>
          <View style={styles.grid}>
            {skins.map((item) => (
              <ShopCard
                key={item.id}
                item={item}
                isOwned={inventory.includes(item.id)}
                isEquipped={equippedSkin === item.id}
                // AQUI: Passamos a cor real do item
                itemColors={getItemColors(item.id)}
                onPress={() => setSelectedItem(item)}
              />
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="landscape"
              size={24}
              color={themeColors.accent}
            />
            <ThemedText type="subtitle">Ambientes Cósmicos</ThemedText>
          </View>
          <View style={styles.grid}>
            {backgrounds.map((item) => (
              <ShopCard
                key={item.id}
                item={item}
                isOwned={inventory.includes(item.id)}
                isEquipped={equippedBackground === item.id}
                itemColors={getItemColors(item.id)}
                onPress={() => setSelectedItem(item)}
              />
            ))}
          </View>
        </ScrollView>

        {/* ... Modais (Mantidos iguais, omitidos para brevidade) ... */}
        {/* Certifique-se de manter os modais de Item e Moedas aqui embaixo iguais ao código anterior */}
        <Modal
          visible={!!selectedItem}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedItem(null)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView
              style={[
                styles.modalContent,
                { backgroundColor: themeColors.card },
              ]}
            >
              {selectedItem && (
                <>
                  <View
                    style={[
                      styles.previewBox,
                      { backgroundColor: "#222", overflow: "hidden" },
                    ]}
                  >
                    {previewStyle && previewStyle.colors && (
                      <LinearGradient
                        colors={previewStyle.colors as [string, string]}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    )}
                    <MaterialIcons
                      name={
                        selectedItem.type === "card_skin"
                          ? "style"
                          : "landscape"
                      }
                      size={80}
                      color={getIconColor()}
                    />
                  </View>
                  <ThemedText
                    type="title"
                    style={{ marginTop: 15, textAlign: "center" }}
                  >
                    {selectedItem.name}
                  </ThemedText>
                  <ThemedText
                    style={{
                      opacity: 0.6,
                      marginBottom: 20,
                      fontSize: 14,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    {selectedItem.rarity}
                  </ThemedText>

                  {inventory.includes(selectedItem.id) ? (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor:
                            equippedSkin === selectedItem.id ||
                            equippedBackground === selectedItem.id
                              ? "#4CAF50"
                              : themeColors.accent,
                        },
                      ]}
                      onPress={handleEquip}
                      disabled={
                        equippedSkin === selectedItem.id ||
                        equippedBackground === selectedItem.id
                      }
                    >
                      <ThemedText style={styles.buttonText}>
                        {equippedSkin === selectedItem.id ||
                        equippedBackground === selectedItem.id
                          ? "EQUIPADO"
                          : "EQUIPAR"}
                      </ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#FFD700" },
                      ]}
                      onPress={handlePurchase}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <MaterialIcons
                          name="auto-awesome"
                          size={20}
                          color="#000"
                        />
                        <ThemedText
                          style={[styles.buttonText, { color: "#000" }]}
                        >
                          {selectedItem.price}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.closeButton]}
                    onPress={() => setSelectedItem(null)}
                  >
                    <ThemedText style={{ opacity: 0.7 }}>Cancelar</ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </ThemedView>
          </View>
        </Modal>

        <Modal
          visible={currencyModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCurrencyModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView
              style={[
                styles.modalContent,
                { backgroundColor: themeColors.card },
              ]}
            >
              <ThemedText type="title" style={{ marginBottom: 20 }}>
                Adquirir Poeira Estelar
              </ThemedText>
              <View style={{ width: "100%", gap: 12 }}>
                {CURRENCY_PACKS.map((pack) => (
                  <TouchableOpacity
                    key={pack.id}
                    style={[
                      styles.currencyPackButton,
                      { borderColor: pack.color },
                    ]}
                    onPress={() => handleBuyPack(pack)}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 15,
                      }}
                    >
                      <View
                        style={[
                          styles.packIcon,
                          { backgroundColor: pack.color + "20" },
                        ]}
                      >
                        <MaterialIcons
                          name={pack.icon}
                          size={24}
                          color={pack.color}
                        />
                      </View>
                      <View>
                        <ThemedText type="defaultSemiBold">
                          {pack.amount} Poeira
                        </ThemedText>
                        <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                          Simulação
                        </ThemedText>
                      </View>
                    </View>
                    <View
                      style={[styles.priceTag, { backgroundColor: pack.color }]}
                    >
                      <ThemedText style={{ fontWeight: "bold", color: "#FFF" }}>
                        {pack.price}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { marginTop: 20 }]}
                onPress={() => setCurrencyModalVisible(false)}
              >
                <ThemedText style={{ opacity: 0.7 }}>Fechar</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { padding: 4 },
  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.5)",
  },
  currencyText: { fontWeight: "bold", fontSize: 16 },
  plusButton: {
    backgroundColor: "#FFD700",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
    marginTop: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 30,
    alignItems: "center",
    minHeight: 400,
  },
  previewBox: {
    width: 160,
    height: 220,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 10,
  },
  actionButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 10,
  },
  buttonText: { fontWeight: "bold", fontSize: 18, color: "#FFF" },
  closeButton: { padding: 10 },
  currencyPackButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(128,128,128,0.05)",
  },
  packIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  priceTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
});
