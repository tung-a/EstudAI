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
  ScrollView, // Manter ScrollView
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ... (Interfaces AnalyticsEvent, DashboardStats, Period inalteradas) ...
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

// Componente BarChart (Com ScrollView Horizontal)
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
          // Aumentar a largura e margem do wrapper
          <View key={index} style={styles.barWrapper}>
            <View style={styles.barAndValue}>
              <ThemedText style={styles.barValue}>{item.value}</ThemedText>
              <View
                style={[
                  styles.bar,
                  {
                    // Altura base menor, altura mínima de 2px
                    height: Math.max(2, (item.value / maxValue) * 100), // Reduzir altura máxima
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
  // ... (estados e useEffect inalterados, remover screenWidth e isSmallScreen) ...
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
          <ThemedText type="title" style={styles.mainTitle}>
            Dashboard
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Análise de comportamento dos usuários.
          </ThemedText>

          {/* Seletor de período */}
          <View
            style={[
              styles.periodSelector,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon + "20",
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
                7 dias
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
                30 dias
              </Text>
            </TouchableOpacity>
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
                // Métricas sempre empilhadas
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
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricLabel}>
                      Total de Eventos
                    </ThemedText>
                    <ThemedText style={styles.metricValue}>
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
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricLabel}>
                      Usuários Únicos
                    </ThemedText>
                    <ThemedText style={styles.metricValue}>
                      {stats.uniqueUsers}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView
                    lightColor={Colors.light.card}
                    darkColor={Colors.dark.card}
                    style={styles.metricCard}
                  >
                    <MaterialIcons
                      name="today"
                      size={24}
                      color={themeColors.icon}
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricLabel}>
                      DAU (Hoje)
                    </ThemedText>
                    <ThemedText style={styles.metricValue}>
                      {stats.dau}
                    </ThemedText>
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
                      style={styles.metricIcon}
                    />
                    <ThemedText style={styles.metricLabel}>
                      MAU (Mês)
                    </ThemedText>
                    <ThemedText style={styles.metricValue}>
                      {stats.mau}
                    </ThemedText>
                  </ThemedView>
                </View>
              )}

              {/* Card Gráfico */}
              <ThemedView
                lightColor={Colors.light.card}
                darkColor={Colors.dark.card}
                style={styles.card}
              >
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  Eventos por Categoria
                </ThemedText>
                {chartData.length > 0 ? (
                  <BarChart data={chartData} color={themeColors.accent} />
                ) : (
                  <ThemedText style={styles.placeholderText}>
                    Nenhum evento registrado no período.
                  </ThemedText>
                )}
              </ThemedView>

              {/* Card Atividades Recentes */}
              <ThemedView
                lightColor={Colors.light.card}
                darkColor={Colors.dark.card}
                style={styles.card}
              >
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  Últimas Atividades
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
                    Nenhum evento recente no período.
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
  loadingIndicator: {
    marginTop: 50,
    alignSelf: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  mainTitle: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 2,
  },
  periodText: {
    fontWeight: "600",
    fontSize: 14,
  },
  // Métricas sempre empilhadas
  metricsContainer: {
    flexDirection: "column", // Alterado para coluna
    gap: 16, // Espaço entre os cards empilhados
    marginBottom: 16,
  },
  metricCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row", // Ícone e texto lado a lado
    alignItems: "center", // Alinha itens verticalmente
    gap: 12, // Espaço entre ícone e texto
  },
  metricIcon: {
    // Não precisa de margem agora
  },
  metricLabel: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1, // Ocupa espaço para empurrar valor para direita
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "right", // Alinha valor à direita
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 10,
    fontStyle: "italic",
    opacity: 0.6,
    textAlign: "center",
    paddingVertical: 20,
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)", // Cor mais explícita
  },
  eventName: {
    fontSize: 15,
    fontWeight: "500",
    textTransform: "capitalize",
    flexShrink: 1,
    marginRight: 10,
  },
  eventTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  chartContainer: {
    height: 160, // Reduzir altura total do container do gráfico
    marginTop: 10,
  },
  chartScrollContent: {
    paddingHorizontal: 10,
    alignItems: "flex-end", // Alinha os wrappers na base
  },
  barWrapper: {
    alignItems: "center",
    width: 75, // Aumentar largura para cada item (barra + label)
    marginHorizontal: 8, // Aumentar margem horizontal
    justifyContent: "flex-end", // Garante que labels fiquem na base
  },
  barAndValue: {
    alignItems: "center",
    flexDirection: "column-reverse", // Coloca o valor acima da barra
    width: "100%",
  },
  barValue: {
    fontSize: 11,
    marginTop: 4, // Espaço acima do valor
    opacity: 0.9,
  },
  bar: {
    width: 30, // Largura da barra
    borderRadius: 4,
    minHeight: 2,
  },
  barLabel: {
    marginTop: 8, // Aumentar espaço acima do label
    fontSize: 11,
    textAlign: "center",
    height: 30,
    opacity: 0.8,
  },
});
