import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
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

interface DashboardStats {
  totalEvents: number;
  uniqueUsers: number;
  eventsByType: { [key: string]: number };
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

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

      // Calculate stats
      const totalEvents = fetchedEvents.length;
      const uniqueUsers = new Set(fetchedEvents.map((e) => e.userId)).size;
      const eventsByType = fetchedEvents.reduce((acc, event) => {
        acc[event.eventName] = (acc[event.eventName] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      setEvents(fetchedEvents);
      setStats({ totalEvents, uniqueUsers, eventsByType });
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
  const sortedEventsByType = stats
    ? Object.entries(stats.eventsByType).sort(([, a], [, b]) => b - a)
    : [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title">Dashboard</ThemedText>
          <ThemedText style={styles.subtitle}>
            Análise de comportamento dos usuários em tempo real.
          </ThemedText>

          {stats && (
            <View style={styles.metricsContainer}>
              <ThemedView
                lightColor={Colors.light.card}
                darkColor={Colors.dark.card}
                style={styles.metricCard}
              >
                <MaterialIcons
                  name="show-chart"
                  size={24}
                  color={themeColors.icon}
                />
                <ThemedText style={styles.metricLabel}>
                  Total de Eventos
                </ThemedText>
                <ThemedText style={styles.metric}>
                  {stats.totalEvents}
                </ThemedText>
              </ThemedView>
              <ThemedView
                lightColor={Colors.light.card}
                darkColor={Colors.dark.card}
                style={styles.metricCard}
              >
                <MaterialIcons
                  name="people"
                  size={24}
                  color={themeColors.icon}
                />
                <ThemedText style={styles.metricLabel}>
                  Usuários Únicos
                </ThemedText>
                <ThemedText style={styles.metric}>
                  {stats.uniqueUsers}
                </ThemedText>
              </ThemedView>
            </View>
          )}

          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <ThemedText type="subtitle">Eventos por Categoria</ThemedText>
            {sortedEventsByType.length > 0 ? (
              sortedEventsByType.map(([name, count]) => (
                <View key={name} style={styles.eventItem}>
                  <ThemedText style={styles.eventName}>{name}</ThemedText>
                  <ThemedText style={styles.eventCount}>{count}</ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={styles.placeholderText}>
                Nenhum evento registrado.
              </ThemedText>
            )}
          </ThemedView>

          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <ThemedText type="subtitle">Últimas Atividades</ThemedText>
            {recentEvents.length > 0 ? (
              recentEvents.map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <ThemedText style={styles.eventName}>
                    {event.eventName}
                  </ThemedText>
                  <ThemedText style={styles.eventTime}>
                    {new Date(
                      event.createdAt?.seconds * 1000
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={styles.placeholderText}>
                Nenhum evento recente.
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
    gap: 10,
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
    marginBottom: 24,
  },
  metricsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
    gap: 8,
  },
  metricLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  metric: {
    fontSize: 28,
    fontWeight: "bold",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  placeholderText: {
    marginTop: 10,
    fontStyle: "italic",
    opacity: 0.6,
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  eventName: {
    fontSize: 16,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  eventCount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  eventTime: {
    fontSize: 14,
    opacity: 0.7,
  },
});
