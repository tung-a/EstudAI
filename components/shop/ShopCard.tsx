import { ThemedText } from "@/components/themed-text";
import { ShopItem } from "@/contexts/CosmeticsContext";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 24;

interface ShopCardProps {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  itemColors?: string[];
  previewImage?: any; // Nova prop para imagem
  onPress: () => void;
}

export const ShopCard = ({
  item,
  isOwned,
  isEquipped,
  itemColors,
  previewImage,
  onPress,
}: ShopCardProps) => {
  const displayColors =
    itemColors && itemColors[0] !== "transparent"
      ? itemColors
      : ["#2C2C2C", "#1A1A1A"];

  // Ajusta altura: Quadrado para Avatares, Retângulo para Cartas
  const isAvatar = item.type === "profile_picture";
  const cardHeight = isAvatar ? CARD_WIDTH + 20 : CARD_WIDTH * 1.3;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View
        style={[
          styles.container,
          { height: cardHeight }, // Altura dinâmica
          isEquipped && { borderColor: "#4CAF50", borderWidth: 2 },
        ]}
      >
        {/* Renderiza Imagem se houver (Avatar), senão Gradiente (Skin) */}
        {previewImage ? (
          <Image
            source={previewImage}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={displayColors as any}
            style={styles.background}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {/* Só mostra ícone se NÃO tiver imagem de preview */}
            {!previewImage &&
              (item.type === "card_skin" ? (
                <MaterialIcons name="style" size={60} color="#FFF" />
              ) : (
                <MaterialIcons name="image" size={60} color="#FFF" />
              ))}
          </View>

          <View
            style={[
              styles.footer,
              isEquipped && { backgroundColor: "#4CAF50" },
            ]}
          >
            {/* CORREÇÃO DE ALINHAMENTO: flex: 1 para o texto não empurrar o preço */}
            <View style={styles.textContainer}>
              <ThemedText style={styles.itemName} numberOfLines={1}>
                {item.name}
              </ThemedText>
              <ThemedText style={styles.rarityText}>{item.rarity}</ThemedText>
            </View>

            {/* Lado Direito (Preço ou Check) fixo */}
            <View style={styles.statusContainer}>
              {isEquipped ? (
                <MaterialIcons name="check-circle" size={16} color="#FFF" />
              ) : isOwned ? (
                <MaterialIcons name="check" size={16} color="#FFF" />
              ) : (
                <View style={styles.priceContainer}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={12}
                    color="#FFD700"
                  />
                  <ThemedText style={styles.priceText}>{item.price}</ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    // height é definido inline agora
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
    opacity: 1,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
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
  // --- CORREÇÕES DE ESTILO ---
  textContainer: {
    flex: 1, // Ocupa o espaço disponível
    marginRight: 8, // Espaço para não colar no preço
  },
  statusContainer: {
    flexShrink: 0, // Garante que o preço/ícone não encolha
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
