import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useRouter } from "expo-router";
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

// Definindo o tipo para os eventos, igual ao da Agenda
type Event = {
  id: string;
  title: string;
  time: string;
  date: string;
};

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Efeito para observar a autenticação do usuário
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Efeito para buscar os eventos do dia do Firestore
  useEffect(() => {
    if (user) {
      const todayString = new Date().toISOString().split("T")[0];
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
          <View style={styles.header}>
            <ThemedText type="title">Olá, {userName}!</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Pronto para vencer nos estudos? 🚀 💥
            </ThemedText>
          </View>

          {/* Card de Agenda do Dia */}
          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <ThemedText type="subtitle">Sua agenda para hoje</ThemedText>
            {loading ? (
              <ActivityIndicator style={styles.cardContent} />
            ) : todaysEvents.length > 0 ? (
              todaysEvents.map((item) => (
                <View key={item.id} style={styles.eventItem}>
                  <ThemedText style={styles.eventTime}>{item.time}</ThemedText>
                  <ThemedText style={styles.eventTitle}>
                    {item.title}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={styles.cardContent}>
                Nenhum evento para hoje. Que tal planejar seus estudos?
              </ThemedText>
            )}
          </ThemedView>

          {/* Card de Ações Rápidas */}
          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <ThemedText type="subtitle">Ações Rápidas</ThemedText>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/chat")}
            >
              <ThemedText
                style={{ color: Colors.light.tint, fontWeight: "bold" }}
              >
                Tirar dúvida com a IA
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/agenda")}
            >
              <ThemedText
                style={{ color: Colors.light.tint, fontWeight: "bold" }}
              >
                Ver agenda completa
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerSubtitle: {
    fontSize: 18,
    color: "gray",
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardContent: {
    marginTop: 16,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  eventTime: {
    fontWeight: "bold",
    marginRight: 15,
    width: 50,
  },
  eventTitle: {
    fontSize: 16,
    flex: 1,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(10, 126, 164, 0.1)", // Cor baseada no tint
  },
});
