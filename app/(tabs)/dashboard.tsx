import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AnalyticsEvent {
  id: string;
  eventName: string;
  userId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    const q = query(
      collection(db, "analytics_events"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents: AnalyticsEvent[] = [];
      snapshot.forEach((doc) => {
        fetchedEvents.push({ id: doc.id, ...doc.data() } as AnalyticsEvent);
      });
      setEvents(fetchedEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <ThemedText>Carregando dados do dashboard...</ThemedText>
      </ThemedView>
    );
  }

  const recentEvents = events.slice(0, 10);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title">Dashboard do Administrador</ThemedText>
          <ThemedText style={styles.subtitle}>
            Acompanhe o comportamento dos usuários em tempo real.
          </ThemedText>
          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <ThemedText type="subtitle">Total de Eventos</ThemedText>
            <ThemedText style={styles.metric}>{events.length}</ThemedText>
          </ThemedView>
          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <ThemedText type="subtitle">Últimos Eventos</ThemedText>
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <ThemedView key={event.id} style={styles.eventItem}>
                  <ThemedText style={styles.eventName}>
                    {event.eventName}
                  </ThemedText>
                  <ThemedText style={styles.eventTime}>
                    {new Date(
                      event.createdAt?.seconds * 1000
                    ).toLocaleTimeString()}
                  </ThemedText>
                </ThemedView>
              ))
            ) : (
              <ThemedText style={styles.placeholderText}>
                Nenhum evento registrado ainda.
              </ThemedText>
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginVertical: 10,
    marginBottom: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  metric: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8,
  },
  placeholderText: {
    marginTop: 10,
    fontStyle: "italic",
    opacity: 0.6,
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  eventName: {
    fontSize: 16,
  },
  eventTime: {
    fontSize: 14,
    opacity: 0.7,
  },
});
