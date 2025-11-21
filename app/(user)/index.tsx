import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useChat } from "@/contexts/ChatContext";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "expo-router"; // useNavigation do expo-router
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Event = {
  id: string;
  title: string;
  time: string;
  date: string;
};

const MAJOR_ARCANA = [
  "O Louco",
  "O Mago",
  "A Sacerdotisa",
  "A Imperatriz",
  "O Imperador",
  "O Hierofante",
  "Os Enamorados",
  "O Carro",
  "A Justiça",
  "O Eremita",
  "A Roda da Fortuna",
  "A Força",
  "O Enforcado",
  "A Morte",
  "A Temperança",
  "O Diabo",
  "A Torre",
  "A Estrela",
  "A Lua",
  "O Sol",
  "O Julgamento",
  "O Mundo",
];

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [userSign, setUserSign] = useState<string>("");
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);

  const [tarotCard, setTarotCard] = useState<{
    name: string;
    meaning: string;
  } | null>(null);
  const [tarotLoading, setTarotLoading] = useState(false);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    content: string;
    icon: any;
    type: "horoscope" | "tarot";
  }>({
    title: "",
    content: "",
    icon: "auto-awesome",
    type: "horoscope",
  });

  const { getChatModel } = useChat();

  // CORREÇÃO AQUI: Tipando como <any> para permitir navegação flexível
  const navigation = useNavigation<any>();

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserSign(docSnap.data().zodiacSign || "Geral");
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const generateHoroscope = async () => {
      if (!userSign || horoscope) return;
      setHoroscopeLoading(true);
      try {
        const model = getChatModel();
        const prompt = `Gere um horóscopo do dia curto e inspirador para o signo de ${userSign}. Foco: autoconhecimento. Máximo de 3 frases.`;
        const result = await model.generateContent(prompt);
        setHoroscope(result.response.text());
      } catch (error) {
        setHoroscope("As estrelas estão se realinhando. Tente mais tarde.");
      } finally {
        setHoroscopeLoading(false);
      }
    };

    if (userSign) {
      generateHoroscope();
    }
  }, [userSign]);

  const handleRevealTarot = async () => {
    if (tarotCard) return;
    setTarotLoading(true);
    try {
      const randomCard =
        MAJOR_ARCANA[Math.floor(Math.random() * MAJOR_ARCANA.length)];
      const model = getChatModel();
      const prompt = `O usuário tirou a carta de Tarot "${randomCard}" para o dia de hoje.
      Dê uma interpretação mística, direta e curta (2 a 3 frases) sobre o conselho dessa carta para o momento.
      Seja enigmático mas útil.`;

      const result = await model.generateContent(prompt);
      setTarotCard({
        name: randomCard,
        meaning: result.response.text().trim(),
      });
    } catch (error) {
      console.error("Erro no Tarot:", error);
    } finally {
      setTarotLoading(false);
    }
  };

  const openDetailsModal = (type: "horoscope" | "tarot") => {
    if (type === "horoscope") {
      if (!horoscope) return;
      setModalContent({
        title: `Horóscopo (${userSign})`,
        content: horoscope,
        icon: "auto-awesome",
        type: "horoscope",
      });
    } else {
      if (!tarotCard) return;
      setModalContent({
        title: tarotCard.name,
        content: tarotCard.meaning,
        icon: "style",
        type: "tarot",
      });
    }
    setDetailsModalVisible(true);
  };

  // --- CORREÇÃO: Chamada limpa do navigate ---
  const handleDiscussWithOracle = () => {
    setDetailsModalVisible(false);

    const initialPrompt = `Tirei a carta "${modalContent.title}" no Tarot de hoje, que diz: "${modalContent.content}". O que isso significa para o meu momento atual?`;

    setTimeout(() => {
      // Agora o TypeScript aceita por causa do <any>
      navigation.navigate("chat", { initialPrompt });
    }, 200);
  };
  // -------------------------------------------

  useEffect(() => {
    if (user) {
      const today = new Date();
      const todayString = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0];
      const eventsQuery = query(
        collection(db, "users", user.uid, "events"),
        where("date", "==", todayString)
      );

      const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
        const events: Event[] = [];
        snapshot.forEach((doc) =>
          events.push({ id: doc.id, ...doc.data() } as Event)
        );
        events.sort((a, b) => a.time.localeCompare(b.time));
        setTodaysEvents(events);
        setLoading(false);
      });

      return () => unsubscribeEvents();
    }
  }, [user]);

  const userName = user?.displayName?.split(" ")[0] || "Viajante";

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.greeting}>
              Olá, {userName}! ✨
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              O universo saúda sua jornada hoje.
            </ThemedText>
          </View>

          <View style={styles.gridContainer}>
            {/* Horóscopo */}
            <TouchableOpacity
              style={[
                styles.gridCard,
                {
                  borderColor: themeColors.accent,
                  borderWidth: 0.5,
                  backgroundColor: "#FFF3E0",
                },
              ]}
              onPress={() => openDetailsModal("horoscope")}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderSmall}>
                <MaterialIcons
                  name="auto-awesome"
                  size={18}
                  color={themeColors.accent}
                />
                <ThemedText
                  style={[styles.cardLabel, { color: themeColors.accent }]}
                >
                  {userSign || "Signo"}
                </ThemedText>
              </View>
              {horoscopeLoading ? (
                <ActivityIndicator size="small" color={themeColors.accent} />
              ) : (
                <>
                  <Text
                    style={[styles.miniText, { color: "#4E342E" }]}
                    numberOfLines={5}
                    ellipsizeMode="tail"
                  >
                    {horoscope || "Conectando..."}
                  </Text>
                  {!horoscopeLoading && horoscope && (
                    <Text
                      style={[styles.readMore, { color: themeColors.accent }]}
                    >
                      Ler completo
                    </Text>
                  )}
                </>
              )}
            </TouchableOpacity>

            {/* Tarot */}
            <TouchableOpacity
              style={[
                styles.gridCard,
                styles.tarotCardTouchable,
                tarotLoading || tarotCard
                  ? {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.accent,
                      borderWidth: 0.5,
                    }
                  : {
                      backgroundColor: themeColors.accent,
                      borderColor: "rgba(255,255,255,0.3)",
                      borderWidth: 1,
                    },
              ]}
              onPress={() => {
                if (tarotCard) {
                  openDetailsModal("tarot");
                } else {
                  handleRevealTarot();
                }
              }}
              disabled={tarotLoading}
              activeOpacity={0.9}
            >
              {tarotLoading ? (
                <ActivityIndicator color={themeColors.accent} />
              ) : tarotCard ? (
                <View style={styles.cardContent}>
                  <MaterialIcons
                    name="style"
                    size={28}
                    color={themeColors.accent}
                    style={{ marginBottom: 8 }}
                  />
                  <ThemedText
                    style={[styles.tarotName, { color: themeColors.text }]}
                  >
                    {tarotCard.name}
                  </ThemedText>
                  <ThemedText
                    style={[styles.miniText, { textAlign: "center" }]}
                    numberOfLines={3}
                  >
                    {tarotCard.meaning}
                  </ThemedText>
                  <ThemedText style={styles.readMore}>Ler completo</ThemedText>
                </View>
              ) : (
                <View style={styles.cardBackContent}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={40}
                    color="#FFF"
                    style={{ opacity: 0.9, marginBottom: 8 }}
                  />
                  <ThemedText style={styles.cardBackTitle}>
                    Carta do Dia
                  </ThemedText>
                  <ThemedText style={styles.cardBackSubtitle}>
                    Toque para revelar
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Agenda */}
          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="today"
                size={22}
                color={themeColors.icon}
                style={styles.cardIcon}
              />
              <ThemedText type="subtitle">Rituais de Hoje</ThemedText>
            </View>
            {loading ? (
              <ActivityIndicator
                style={styles.loadingIndicator}
                color={themeColors.accent}
              />
            ) : todaysEvents.length > 0 ? (
              <View style={styles.eventListContainer}>
                {todaysEvents.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.eventItemNew,
                      index < todaysEvents.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: themeColors.icon + "30",
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="brightness-1"
                      size={8}
                      color={themeColors.accent}
                      style={styles.eventIcon}
                    />
                    <View style={styles.eventTextContainer}>
                      <ThemedText style={styles.eventTitleNew}>
                        {item.title}
                      </ThemedText>
                      <ThemedText style={styles.eventTimeNew}>
                        {item.time}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCardContent}>
                <MaterialIcons
                  name="nights-stay"
                  size={30}
                  color={themeColors.icon + "80"}
                />
                <ThemedText style={styles.emptyText}>
                  O cosmos está calmo hoje.
                </ThemedText>
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => navigation.navigate("agenda" as never)}
                >
                  <ThemedText style={styles.emptyActionText}>
                    Agendar Ritual
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>

          {/* Ações Rápidas */}
          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="explore"
                size={22}
                color={themeColors.icon}
                style={styles.cardIcon}
              />
              <ThemedText type="subtitle">Jornada Interior</ThemedText>
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: themeColors.accent + "1A" },
                ]}
                onPress={() => navigation.navigate("chat" as never)}
              >
                <MaterialIcons
                  name="psychology"
                  size={20}
                  color={themeColors.accent}
                  style={styles.actionIcon}
                />
                <ThemedText
                  style={[styles.actionText, { color: themeColors.accent }]}
                >
                  Consultar o Oráculo
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: themeColors.accent + "1A" },
                ]}
                onPress={() => navigation.navigate("profile" as never)}
              >
                <MaterialIcons
                  name="stars"
                  size={20}
                  color={themeColors.accent}
                  style={styles.actionIcon}
                />
                <ThemedText
                  style={[styles.actionText, { color: themeColors.accent }]}
                >
                  Ver meu Mapa Astral
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>

      {/* Modal de Detalhes */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView
            style={[styles.modalContent, { backgroundColor: themeColors.card }]}
          >
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <MaterialIcons
                  name={modalContent.icon}
                  size={24}
                  color={themeColors.accent}
                />
                <ThemedText type="subtitle">{modalContent.title}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={themeColors.icon}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <ThemedText style={styles.modalText}>
                {modalContent.content}
              </ThemedText>
            </ScrollView>

            <View style={styles.modalActions}>
              {modalContent.type === "tarot" && (
                <TouchableOpacity
                  style={[
                    styles.modalButtonSecondary,
                    { borderColor: themeColors.accent },
                  ]}
                  onPress={handleDiscussWithOracle}
                >
                  <MaterialIcons
                    name="chat"
                    size={18}
                    color={themeColors.accent}
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText
                    style={[
                      styles.modalButtonText,
                      { color: themeColors.accent },
                    ]}
                  >
                    Conversar
                  </ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: themeColors.accent },
                ]}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: "#FFF" }]}>
                  Gratidão
                </Text>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 28 },
  headerSubtitle: { fontSize: 16, opacity: 0.7, marginTop: 6 },
  gridContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    padding: 15,
    minHeight: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLabel: { fontSize: 14, fontWeight: "bold", marginLeft: 6 },
  cardHeaderSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  miniText: { fontSize: 14, lineHeight: 20, opacity: 0.9 },
  readMore: {
    fontSize: 12,
    marginTop: 10,
    fontWeight: "bold",
    alignSelf: "flex-start",
  },
  tarotCardTouchable: { justifyContent: "center", alignItems: "center" },
  cardBackContent: { alignItems: "center", justifyContent: "center" },
  cardBackTitle: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardBackSubtitle: { color: "#FFF", fontSize: 11, opacity: 0.8, marginTop: 4 },
  cardContent: { alignItems: "center", width: "100%" },
  tarotName: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  cardIcon: { marginRight: 10 },
  loadingIndicator: { marginTop: 20, marginBottom: 10 },
  eventListContainer: { marginTop: 8 },
  eventItemNew: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  eventIcon: { marginRight: 12, marginLeft: 4 },
  eventTextContainer: { flex: 1 },
  eventTitleNew: { fontSize: 15, fontWeight: "500", marginBottom: 2 },
  eventTimeNew: { fontSize: 13, opacity: 0.7 },
  emptyCardContent: { alignItems: "center", paddingVertical: 20, gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center", opacity: 0.7 },
  emptyActionButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.light.tint + "1A",
  },
  emptyActionText: {
    color: Colors.light.tint,
    fontWeight: "600",
    fontSize: 14,
  },
  actionsContainer: { marginTop: 8, gap: 12 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionIcon: { marginRight: 12 },
  actionText: { fontWeight: "600", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "60%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  modalBody: { marginBottom: 20 },
  modalText: { fontSize: 16, lineHeight: 24, opacity: 0.9 },
  modalActions: { flexDirection: "row", gap: 15, justifyContent: "flex-end" },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
  },
  modalButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  modalButtonText: { fontWeight: "bold", fontSize: 15 },
});
