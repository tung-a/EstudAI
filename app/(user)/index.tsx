import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useChat } from "@/contexts/ChatContext"; // Importar contexto da IA
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
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
  ScrollView,
  StyleSheet,
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

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [userSign, setUserSign] = useState<string>(""); // Estado para o signo
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Horóscopo
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);

  const { getChatModel } = useChat(); // Hook da IA
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  // 1. Autenticação e Busca do Signo do Usuário
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Busca o signo salvo no perfil
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

  // 2. Gera o Horóscopo (apenas se tiver o signo)
  useEffect(() => {
    const generateHoroscope = async () => {
      if (!userSign || horoscope) return; // Evita recarregar se já tiver

      setHoroscopeLoading(true);
      try {
        const model = getChatModel();
        const prompt = `Gere um horóscopo do dia curto e inspirador para o signo de ${userSign}. 
        Foco: autoconhecimento e energia positiva. Máximo de 2 frases.`;

        const result = await model.generateContent(prompt);
        setHoroscope(result.response.text());
      } catch (error) {
        console.error("Erro no horóscopo:", error);
        setHoroscope("As estrelas estão se realinhando. Tente mais tarde.");
      } finally {
        setHoroscopeLoading(false);
      }
    };

    if (userSign) {
      generateHoroscope();
    }
  }, [userSign]);

  // 3. Busca Eventos (Agenda)
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
        snapshot.forEach((doc) => {
          events.push({ id: doc.id, ...doc.data() } as Event);
        });

        events.sort((a, b) => {
          const [aHour, aMinute] = a.time.split(":").map(Number);
          const [bHour, bMinute] = b.time.split(":").map(Number);
          if (aHour !== bHour) return aHour - bHour;
          return aMinute - bMinute;
        });

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

          {/* --- NOVO CARD: HORÓSCOPO DO DIA --- */}
          <ThemedView
            lightColor="#FFF3E0" // Um fundo levemente diferente para destaque
            darkColor="#3E2723"
            style={[
              styles.card,
              { borderColor: themeColors.accent, borderWidth: 0.5 },
            ]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="auto-awesome"
                size={22}
                color={themeColors.accent}
                style={styles.cardIcon}
              />
              <ThemedText type="subtitle" style={{ color: themeColors.accent }}>
                Horóscopo ({userSign})
              </ThemedText>
            </View>

            {horoscopeLoading ? (
              <ActivityIndicator color={themeColors.accent} />
            ) : (
              <ThemedText style={styles.horoscopeText}>
                {horoscope || "Conectando com os astros..."}
              </ThemedText>
            )}
          </ThemedView>
          {/* ----------------------------------- */}

          {/* Card Agenda */}
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
  horoscopeText: {
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.9,
  },
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
});
