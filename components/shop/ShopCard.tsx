import { ThemedText } from "@/components/themed-text";
import { ShopItem } from "@/contexts/CosmeticsContext";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 24;

interface ShopCardProps {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  // Adicionamos as cores reais do item como prop
  itemColors: string[];
  onPress: () => void;
}

export const ShopCard = ({
  item,
  isOwned,
  isEquipped,
  itemColors,
  onPress,
}: ShopCardProps) => {
  // Se as cores não forem passadas (ex: bg transparente), usa um fallback escuro para dar contraste
  const displayColors =
    itemColors && itemColors[0] !== "transparent"
      ? itemColors
      : ["#2C2C2C", "#1A1A1A"];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View
        style={[
          styles.container,
          isEquipped && { borderColor: "#4CAF50", borderWidth: 2 },
        ]}
      >
        {/* Agora usamos as cores DO ITEM, não da raridade */}
        <LinearGradient
          colors={displayColors as any}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {item.type === "card_skin" ? (
              <MaterialIcons name="style" size={60} color="#FFF" />
            ) : (
              <MaterialIcons name="image" size={60} color="#FFF" />
            )}
          </View>

          <View
            style={[
              styles.footer,
              isEquipped && { backgroundColor: "#4CAF50" },
            ]}
          >
            <View>
              <ThemedText style={styles.itemName} numberOfLines={1}>
                {item.name}
              </ThemedText>
              {/* Mostramos a raridade aqui embaixo em texto pequeno */}
              <ThemedText style={styles.rarityText}>{item.rarity}</ThemedText>
            </View>

            {isEquipped ? (
              <MaterialIcons name="check-circle" size={16} color="#FFF" />
            ) : isOwned ? (
              <MaterialIcons name="check" size={16} color="#FFF" />
            ) : (
              <View style={styles.priceContainer}>
                <MaterialIcons name="auto-awesome" size={12} color="#FFD700" />
                <ThemedText style={styles.priceText}>{item.price}</ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: "#222",
    borderWidth: 0,
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 1, // Aumentei a opacidade para ver a cor real
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 8,
  },
  iconContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "-5deg" }],
  },
  footer: {
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 2,
  },
  rarityText: {
    color: "#CCC",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 12,
  },
});
