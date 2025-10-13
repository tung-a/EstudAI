import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  dau: number;
  mau: number;
}

type Period = "today" | "week" | "month";

// Simple Bar Chart Component
const BarChart = ({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color: string;
}) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1); // Garante que não seja 0 para evitar divisão por zero
  return (
    <View style={styles.chartContainer}>
      {data.map((item, index) => (
        <View key={index} style={styles.barWrapper}>
          <View style={styles.barAndValue}>
            <ThemedText style={styles.barValue}>{item.value}</ThemedText>
            <View
              style={[
                styles.bar,
                {
                  height: (item.value / maxValue) * 150,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <ThemedText style={styles.barLabel}>
            {item.label.replace(/_/g, " ")}
          </ThemedText>
        </View>
      ))}
    </View>
  );
};

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<Period>("today");

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    setLoading(true); // Mostra o loading ao trocar de período
    const getStartDate = () => {
      const now = new Date();
      if (period === "week") {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return Timestamp.fromDate(weekAgo);
      }
      if (period === "month") {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return Timestamp.fromDate(monthAgo);
      }
      // today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return Timestamp.fromDate(todayStart);
    };

    const q = query(
      collection(db, "analytics_events"),
      orderBy("createdAt", "desc"),
      where("createdAt", ">=", getStartDate())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents: AnalyticsEvent[] = [];
      snapshot.forEach((doc) => {
        fetchedEvents.push({ id: doc.id, ...doc.data() } as AnalyticsEvent);
      });

      const totalEvents = fetchedEvents.length;
      const uniqueUsers = new Set(fetchedEvents.map((e) => e.userId)).size;

      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).getTime();

      const dailyUsers = new Set(
        fetchedEvents
          .filter((e) => e.createdAt.seconds * 1000 >= todayStart)
          .map((e) => e.userId)
      );
      const monthlyUsers = new Set(
        fetchedEvents
          .filter((e) => e.createdAt.seconds * 1000 >= monthStart)
          .map((e) => e.userId)
      );

      const eventsByType = fetchedEvents.reduce((acc, event) => {
        acc[event.eventName] = (acc[event.eventName] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      setEvents(fetchedEvents);
      setStats({
        totalEvents,
        uniqueUsers,
        eventsByType,
        dau: dailyUsers.size,
        mau: monthlyUsers.size,
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [period]);

  const recentEvents = events.slice(0, 10);
  const chartData = stats
    ? Object.entries(stats.eventsByType)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title">Dashboard</ThemedText>
          <ThemedText style={styles.subtitle}>
            Análise de comportamento dos usuários.
          </ThemedText>

          {/* Novo seletor de período */}
          <View
            style={[
              styles.periodSelector,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setPeriod("today")}
              style={[
                styles.periodButton,
                period === "today" && { backgroundColor: themeColors.accent },
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: themeColors.text },
                  period === "today" && { color: "#fff" },
                ]}
              >
                Hoje
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPeriod("week")}
              style={[
                styles.periodButton,
                period === "week" && { backgroundColor: themeColors.accent },
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: themeColors.text },
                  period === "week" && { color: "#fff" },
                ]}
              >
                Semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPeriod("month")}
              style={[
                styles.periodButton,
                period === "month" && { backgroundColor: themeColors.accent },
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: themeColors.text },
                  period === "month" && { color: "#fff" },
                ]}
              >
                Mês
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={themeColors.accent}
              style={{ marginTop: 50 }}
            />
          ) : (
            <>
              {stats && (
                <>
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

                  <View style={styles.metricsContainer}>
                    <ThemedView
                      lightColor={Colors.light.card}
                      darkColor={Colors.dark.card}
                      style={styles.metricCard}
                    >
                      <MaterialIcons
                        name="today"
                        size={24}
                        color={themeColors.icon}
                      />
                      <ThemedText style={styles.metricLabel}>
                        Usuários Ativos Hoje (DAU)
                      </ThemedText>
                      <ThemedText style={styles.metric}>{stats.dau}</ThemedText>
                    </ThemedView>
                    <ThemedView
                      lightColor={Colors.light.card}
                      darkColor={Colors.dark.card}
                      style={styles.metricCard}
                    >
                      <MaterialIcons
                        name="date-range"
                        size={24}
                        color={themeColors.icon}
                      />
                      <ThemedText style={styles.metricLabel}>
                        Usuários Ativos no Mês (MAU)
                      </ThemedText>
                      <ThemedText style={styles.metric}>{stats.mau}</ThemedText>
                    </ThemedView>
                  </View>
                </>
              )}

              <ThemedView
                lightColor={Colors.light.card}
                darkColor={Colors.dark.card}
                style={styles.card}
              >
                <ThemedText type="subtitle">Eventos por Categoria</ThemedText>
                {chartData.length > 0 ? (
                  <BarChart data={chartData} color={themeColors.accent} />
                ) : (
                  <ThemedText style={styles.placeholderText}>
                    Nenhum evento registrado no período.
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
                        {event.eventName.replace(/_/g, " ")}
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
            </>
          )}
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
  periodSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  periodText: {
    fontWeight: "bold",
  },
  metricsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
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
    textAlign: "center",
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
  eventTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    height: 200,
    alignItems: "flex-end",
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 4, // Espaçamento entre as barras
  },
  barAndValue: {
    alignItems: "center",
  },
  barValue: {
    fontSize: 12,
    marginBottom: 4,
  },
  bar: {
    width: 25,
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
    flexWrap: "wrap", // Permite que o texto quebre a linha
    height: 30, // Altura fixa para alinhar
  },
});
