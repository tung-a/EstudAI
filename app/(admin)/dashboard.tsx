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
  createdAt: { seconds: number; nanoseconds: number };
}

interface DashboardStats {
  totalEvents: number;
  uniqueUsers: number;
  eventsByType: { [key: string]: number };
  dau: number;
  mau: number;
}

type Period = "today" | "week" | "month";

const BarChart = ({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color: string;
}) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  return (
    <View style={styles.chartContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScrollContent}
      >
        {data.map((item, index) => (
          <View key={index} style={styles.barWrapper}>
            <View style={styles.barAndValue}>
              <ThemedText style={styles.barValue}>{item.value}</ThemedText>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(4, (item.value / maxValue) * 100),
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <ThemedText style={styles.barLabel} numberOfLines={2}>
              {item.label.replace(/_/g, " ")}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
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
    setLoading(true);
    const getStartDate = () => {
      const now = new Date();
      if (period === "week")
        return Timestamp.fromDate(new Date(now.setDate(now.getDate() - 7)));
      if (period === "month")
        return Timestamp.fromDate(new Date(now.setMonth(now.getMonth() - 1)));
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
      snapshot.forEach((doc) =>
        fetchedEvents.push({ id: doc.id, ...doc.data() } as AnalyticsEvent)
      );

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
          <ThemedText type="title" style={styles.mainTitle}>
            Painel Astral
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Monitoramento de energias e fluxos.
          </ThemedText>

          <View
            style={[
              styles.periodSelector,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon + "20",
              },
            ]}
          >
            {(["today", "week", "month"] as Period[]).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  styles.periodButton,
                  period === p && { backgroundColor: themeColors.accent },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: period === p ? "#fff" : themeColors.text },
                  ]}
                >
                  {p === "today" ? "Hoje" : p === "week" ? "7 Luas" : "Ciclo"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={themeColors.accent}
              style={styles.loadingIndicator}
            />
          ) : (
            <>
              {stats && (
                <View style={styles.metricsContainer}>
                  <MetricCard
                    icon="auto-awesome"
                    label="Rituais Realizados"
                    value={stats.totalEvents}
                    color={themeColors.icon}
                  />
                  <MetricCard
                    icon="groups"
                    label="Almas Conectadas"
                    value={stats.uniqueUsers}
                    color={themeColors.icon}
                  />
                  <MetricCard
                    icon="sunny"
                    label="Ativos (Hoje)"
                    value={stats.dau}
                    color={themeColors.icon}
                  />
                  <MetricCard
                    icon="nightlight-round"
                    label="Ativos (Ciclo)"
                    value={stats.mau}
                    color={themeColors.icon}
                  />
                </View>
              )}

              <ThemedView
                lightColor={Colors.light.card}
                darkColor={Colors.dark.card}
                style={styles.card}
              >
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  Fluxo de Atividades
                </ThemedText>
                {chartData.length > 0 ? (
                  <BarChart data={chartData} color={themeColors.accent} />
                ) : (
                  <ThemedText style={styles.placeholderText}>
                    O silêncio impera.
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedView
                lightColor={Colors.light.card}
                darkColor={Colors.dark.card}
                style={styles.card}
              >
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  Últimas Manifestações
                </ThemedText>
                {recentEvents.length > 0 ? (
                  recentEvents.map((event, index) => (
                    <View
                      key={event.id}
                      style={[
                        styles.eventItem,
                        index === recentEvents.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                    >
                      <ThemedText style={styles.eventName}>
                        {event.eventName.replace(/_/g, " ")}
                      </ThemedText>
                      <ThemedText style={styles.eventTime}>
                        {new Date(
                          event.createdAt.seconds * 1000
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </ThemedText>
                    </View>
                  ))
                ) : (
                  <ThemedText style={styles.placeholderText}>
                    Nenhuma manifestação recente.
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

const MetricCard = ({ icon, label, value, color }: any) => (
  <ThemedView
    lightColor={Colors.light.card}
    darkColor={Colors.dark.card}
    style={styles.metricCard}
  >
    <MaterialIcons name={icon} size={24} color={color} />
    <ThemedText style={styles.metricLabel}>{label}</ThemedText>
    <ThemedText style={styles.metricValue}>{value}</ThemedText>
  </ThemedView>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingIndicator: { marginTop: 50 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  mainTitle: { marginBottom: 4 },
  subtitle: { fontSize: 16, opacity: 0.7, marginBottom: 24 },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  periodText: { fontWeight: "600", fontSize: 14 },
  metricsContainer: { flexDirection: "column", gap: 12, marginBottom: 20 },
  metricCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    elevation: 2,
  },
  metricLabel: { fontSize: 15, opacity: 0.8, flex: 1 },
  metricValue: { fontSize: 24, fontWeight: "bold" },
  card: { borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2 },
  cardTitle: { marginBottom: 20 },
  placeholderText: {
    fontStyle: "italic",
    opacity: 0.6,
    textAlign: "center",
    paddingVertical: 20,
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  eventName: { fontSize: 15, fontWeight: "500", textTransform: "capitalize" },
  eventTime: { fontSize: 14, opacity: 0.7 },
  chartContainer: { height: 180, marginTop: 10 },
  chartScrollContent: { paddingHorizontal: 10, alignItems: "flex-end" },
  barWrapper: {
    alignItems: "center",
    width: 70,
    marginHorizontal: 6,
    justifyContent: "flex-end",
  },
  barAndValue: {
    alignItems: "center",
    flexDirection: "column-reverse",
    width: "100%",
  },
  barValue: { fontSize: 11, marginTop: 4, opacity: 0.8 },
  bar: { width: 24, borderRadius: 6, minHeight: 4 },
  barLabel: {
    marginTop: 8,
    fontSize: 11,
    textAlign: "center",
    height: 30,
    opacity: 0.7,
  },
});
