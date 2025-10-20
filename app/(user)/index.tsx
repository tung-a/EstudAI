// app/(user)/index.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ... (tipo Event inalterado) ...
type Event = {
  id: string;
  title: string;
  time: string;
  date: string;
};

export default function HomeScreen() {
  // ... (hooks e estados inalterados) ...
  const [user, setUser] = useState<User | null>(null);
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  // ... (useEffect para auth e events inalterados) ...
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

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

        // Ordena os eventos pelo horário
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

  const userName = user?.displayName?.split(" ")[0] || "Estudante";

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header (inalterado) */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.greeting}>
              Olá, {userName}! 👋
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Pronto para mais um dia de estudos? 🚀💥
            </ThemedText>
          </View>

          {/* Card de Agenda do Dia Atualizado */}
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
              <ThemedText type="subtitle">Agenda de Hoje</ThemedText>
            </View>
            {loading ? (
              <ActivityIndicator
                style={styles.loadingIndicator}
                color={themeColors.accent}
              />
            ) : todaysEvents.length > 0 ? (
              // Nova View para a lista de eventos com separadores
              <View style={styles.eventListContainer}>
                {todaysEvents.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.eventItemNew, // Novo estilo para o item
                      // Não adiciona borda inferior no último item
                      index < todaysEvents.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: themeColors.icon + "30", // Cor sutil
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="fiber-manual-record" // Ícone de ponto
                      size={10} // Tamanho pequeno
                      color={themeColors.accent} // Cor do accent
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
              // Conteúdo vazio (inalterado)
              <View style={styles.emptyCardContent}>
                <MaterialIcons
                  name="sentiment-satisfied"
                  size={30}
                  color={themeColors.icon + "80"}
                />
                <ThemedText style={styles.emptyText}>
                  Nenhum evento para hoje.
                </ThemedText>
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => navigation.navigate("agenda" as never)}
                >
                  <ThemedText style={styles.emptyActionText}>
                    Planejar seus estudos
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>

          {/* Card de Ações Rápidas (inalterado) */}
          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="bolt"
                size={22}
                color={themeColors.icon}
                style={styles.cardIcon}
              />
              <ThemedText type="subtitle">Ações Rápidas</ThemedText>
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
                  name="chat-bubble-outline"
                  size={20}
                  color={themeColors.accent}
                  style={styles.actionIcon}
                />
                <ThemedText
                  style={[styles.actionText, { color: themeColors.accent }]}
                >
                  Tirar dúvida com a IA
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: themeColors.accent + "1A" },
                ]}
                onPress={() => navigation.navigate("agenda" as never)}
              >
                <MaterialIcons
                  name="event-note"
                  size={20}
                  color={themeColors.accent}
                  style={styles.actionIcon}
                />
                <ThemedText
                  style={[styles.actionText, { color: themeColors.accent }]}
                >
                  Ver agenda completa
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
  // ... (outros estilos inalterados) ...
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24, // Aumenta o padding geral
    paddingBottom: 40, // Espaço extra no final
  },
  header: {
    marginBottom: 32, // Mais espaço abaixo do header
  },
  greeting: {
    fontSize: 28, // Um pouco menor que o title padrão
  },
  headerSubtitle: {
    fontSize: 16, // Tamanho padrão
    opacity: 0.7, // Um pouco mais suave
    marginTop: 6,
  },
  card: {
    borderRadius: 16, // Bordas mais arredondadas
    padding: 20, // Padding interno maior
    marginBottom: 24, // Mais espaço entre os cards
    // Sombra mais suave (ajuste conforme preferir)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Opacidade menor
    shadowRadius: 10, // Raio maior para suavizar
    elevation: 3, // Elevação para Android
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16, // Espaço abaixo do header do card
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)", // Linha separadora sutil
  },
  cardIcon: {
    marginRight: 10,
  },
  loadingIndicator: {
    marginTop: 20,
    marginBottom: 10,
  },
  // eventList: { // Estilo antigo removido
  //   marginTop: 8,
  // },
  // eventItem: { // Estilo antigo renomeado/removido
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginBottom: 12,
  //   paddingVertical: 4,
  // },
  // eventTimeBadge: { // Estilo antigo removido
  //   paddingHorizontal: 10,
  //   paddingVertical: 5,
  //   borderRadius: 12,
  //   marginRight: 12,
  //   minWidth: 60,
  //   alignItems: "center",
  // },
  // eventTimeText: { // Estilo antigo removido
  //   fontWeight: "bold",
  //   fontSize: 14,
  // },
  // eventTitle: { // Estilo antigo removido
  //   fontSize: 15,
  //   flex: 1,
  // },

  // --- Novos estilos para a lista de eventos ---
  eventListContainer: {
    marginTop: 8, // Espaço após o header do card
  },
  eventItemNew: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12, // Padding vertical para cada item
  },
  eventIcon: {
    marginRight: 12, // Espaço entre o ícone e o texto
    marginLeft: 4, // Pequeno espaço à esquerda do ícone
  },
  eventTextContainer: {
    flex: 1, // Ocupa o restante do espaço
  },
  eventTitleNew: {
    fontSize: 15,
    fontWeight: "500", // Peso médio para o título
    marginBottom: 2, // Pequeno espaço abaixo do título
  },
  eventTimeNew: {
    fontSize: 13,
    opacity: 0.7, // Cor mais suave para o horário
  },
  // --- Fim dos novos estilos ---

  emptyCardContent: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.7,
  },
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
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontWeight: "600",
    fontSize: 15,
  },
});
