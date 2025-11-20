import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useChat } from "@/contexts/ChatContext";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Tipos
type AstralPosition = {
  planet: string;
  sign: string;
  house: string;
  element: string;
  summary: string;
};

type UserProfile = {
  name: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  astralMapJson?: string;
};

export default function AstralMapScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado do Mapa
  const [mapLoading, setMapLoading] = useState(false);
  const [astralMap, setAstralMap] = useState<AstralPosition[]>([]);

  const { getChatModel } = useChat();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  // 1. Carregar dados
  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);

        // Se já existe mapa salvo, carrega direto
        if (data.astralMapJson) {
          try {
            setAstralMap(JSON.parse(data.astralMapJson));
          } catch (e) {
            console.error("Erro parsing mapa", e);
          }
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // 2. Função para Gerar o Mapa (se não existir)
  const generateMap = async () => {
    if (!profile?.birthDate) {
      Alert.alert(
        "Dados Faltando",
        "Você precisa preencher seus dados de nascimento primeiro."
      );
      return;
    }

    setMapLoading(true);
    try {
      const model = getChatModel();
      const prompt = `
        Atue como um astrólogo profissional.
        Dados de nascimento: ${profile.birthPlace}, dia ${profile.birthDate} às ${profile.birthTime}.
        
        Calcule as posições planetárias (Sol, Lua, Ascendente, Mercúrio, Vênus, Marte).
        Retorne APENAS um JSON válido contendo uma lista de objetos:
        [{"planet": "Sol", "sign": "Leão", "house": "Casa 5", "element": "Fogo", "summary": "Frase curta sobre o significado."}]
        
        Não use markdown. Apenas o JSON cru.
      `;

      const result = await model.generateContent(prompt);
      let text = result.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const mapData = JSON.parse(text);
      setAstralMap(mapData);

      // Salvar
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          astralMapJson: JSON.stringify(mapData),
          zodiacSign: mapData.find((p: any) => p.planet === "Sol")?.sign,
        });
      }
    } catch (error) {
      Alert.alert("Erro", "Os astros estão nublados. Tente novamente.");
    } finally {
      setMapLoading(false);
    }
  };

  // Helper visual
  const getElementColor = (element: string) => {
    const el = element.toLowerCase();
    if (el.includes("fogo")) return "#FF5722";
    if (el.includes("água")) return "#2196F3";
    if (el.includes("ar")) return "#FFC107";
    if (el.includes("terra")) return "#4CAF50";
    return themeColors.text;
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={themeColors.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Cabeçalho da Seção */}
          <View style={styles.header}>
            <MaterialIcons
              name="auto-awesome"
              size={40}
              color={themeColors.accent}
            />
            <ThemedText type="title" style={{ marginTop: 10 }}>
              Mapa Astral
            </ThemedText>
            <ThemedText style={{ opacity: 0.7 }}>
              Sua impressão digital cósmica
            </ThemedText>
          </View>

          {/* Dados Básicos */}
          <View
            style={[
              styles.dataCard,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon + "20",
              },
            ]}
          >
            <View style={styles.dataRow}>
              <MaterialIcons name="cake" size={16} color={themeColors.icon} />
              <ThemedText style={styles.dataText}>
                {profile?.birthDate || "Data não definida"}
              </ThemedText>
            </View>
            <View style={styles.dataRow}>
              <MaterialIcons
                name="schedule"
                size={16}
                color={themeColors.icon}
              />
              <ThemedText style={styles.dataText}>
                {profile?.birthTime || "Hora não definida"}
              </ThemedText>
            </View>
            <View style={styles.dataRow}>
              <MaterialIcons name="place" size={16} color={themeColors.icon} />
              <ThemedText style={styles.dataText}>
                {profile?.birthPlace || "Local não definido"}
              </ThemedText>
            </View>
          </View>

          {/* Botão de Gerar (se lista vazia) ou Atualizar */}
          <TouchableOpacity
            style={[
              styles.generateButton,
              { backgroundColor: themeColors.accent },
            ]}
            onPress={generateMap}
            disabled={mapLoading}
          >
            {mapLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons
                  name={astralMap.length > 0 ? "refresh" : "star"}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.generateButtonText}>
                  {astralMap.length > 0
                    ? "Recalcular Mapa"
                    : "Revelar meu Mapa"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* LISTA DO MAPA */}
          <View style={styles.mapContainer}>
            {astralMap.map((item, index) => (
              <ThemedView
                key={index}
                style={[
                  styles.planetCard,
                  { backgroundColor: themeColors.card },
                ]}
              >
                <View style={styles.planetHeader}>
                  <ThemedText type="subtitle" style={{ fontSize: 18 }}>
                    {item.planet}
                  </ThemedText>
                  <View
                    style={[
                      styles.signBadge,
                      { borderColor: getElementColor(item.element) },
                    ]}
                  >
                    <Text
                      style={{
                        color: getElementColor(item.element),
                        fontWeight: "bold",
                      }}
                    >
                      {item.sign}
                    </Text>
                  </View>
                </View>

                <View style={styles.planetMeta}>
                  <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                    {item.house}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                    {" "}
                    •{" "}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                    {item.element}
                  </ThemedText>
                </View>

                <ThemedText style={styles.summary}>{item.summary}</ThemedText>
              </ThemedView>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20 },

  header: { alignItems: "center", marginBottom: 20 },

  dataCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  dataRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dataText: { fontSize: 12 },

  generateButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    gap: 8,
  },
  generateButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  mapContainer: { gap: 15 },
  planetCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  signBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  planetMeta: {
    flexDirection: "row",
    marginBottom: 10,
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
});
