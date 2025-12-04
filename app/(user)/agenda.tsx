import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logAddEventCalendar, logDeleteEventCalendar } from "@/lib/analytics";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown, { MarkdownNode } from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddEventModal } from "@/components/agenda/AddEventModal";
import { AgendaListView } from "@/components/agenda/AgendaListView";
import { DayTimelineView } from "@/components/agenda/DayTimelineView";
import { WeekSelector } from "@/components/agenda/WeekSelector";
import { useChat } from "@/contexts/ChatContext";
import { formatDate, getLocalDate, getWeekDays } from "@/lib/dateUtils";

// --- TIPO ATUALIZADO ---
export type Event = {
  id: string;
  title: string;
  time: string;
  date: string;
  duration: number;
  energy?: string; // Renomeado de 'disciplina' para 'energy'
  studyRecommendation?: string;
  recommendationGeneratedAt?: Timestamp;
};

export type EventsByDate = { [date: string]: Event[] };
type ViewMode = "agenda" | "day";

export default function AgendaScreen() {
  const currentUser = auth.currentUser;
  const { getChatModel } = useChat();

  const todayString = useMemo(() => getLocalDate(), []);

  const [selectedDate, setSelectedDate] = useState(todayString);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const [year, month, day] = todayString.split("-").map(Number);
    const initialDate = new Date(year, month - 1, day);
    const startOfWeek = getWeekDays(initialDate)[0];
    return startOfWeek;
  });
  const [events, setEvents] = useState<EventsByDate>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("agenda");

  const [recommendationResult, setRecommendationResult] = useState<
    string | null
  >(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const sectionListRef = useRef<SectionList<Event>>(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setEvents({});
      return;
    }
    setLoading(true);

    const q = query(
      collection(db, "users", currentUser.uid, "events"),
      orderBy("date", "asc"),
      orderBy("time", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userEvents: EventsByDate = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.date) return;

          // Mapeando do Banco (disciplinaNome) para o App (energy)
          const event: Event = {
            id: doc.id,
            title: data.title,
            time: data.time,
            date: data.date,
            duration: data.duration,
            studyRecommendation: data.studyRecommendation,
            recommendationGeneratedAt: data.recommendationGeneratedAt,
            energy: data.disciplinaNome, // <-- Mapeamento aqui
          };

          if (!userEvents[event.date]) userEvents[event.date] = [];
          userEvents[event.date].push(event);
        });
        setEvents(userEvents);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao buscar eventos: ", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    const startOfWeekForSelected = getWeekDays(selectedDateObj)[0];
    setCurrentWeekStart(startOfWeekForSelected);
  }, [selectedDate]);

  const generateEnergyRecommendations = useCallback(
    async (atividade: string, duration: number) => {
      setRecommendationLoading(true);
      setRecommendationResult(null);

      try {
        const prompt = `
          O usuário agendou: "${atividade}" (${duration} min).
          Atue como um especialista em energias, cristais e astrologia.
          Gere uma recomendação mística curta para potencializar este momento.
          
          A resposta deve conter:
          1. **Cristal**: Uma pedra sugerida.
          2. **Mantra/Intenção**: Uma frase curta.
          3. **Dica Astral**: Um conselho breve.

          Seja místico, acolhedor e direto. Use Markdown.
        `;

        const model = getChatModel();
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        setRecommendationResult(responseText);
        return responseText;
      } catch (error) {
        Alert.alert("Erro", "Os astros estão silenciosos no momento.");
        return null;
      } finally {
        setRecommendationLoading(false);
      }
    },
    [getChatModel]
  );

  const handleAddEvent = useCallback(
    async (eventData: {
      title: string;
      time: string;
      duration: number;
      energy?: string; // Alterado para energy
      recommend?: boolean;
    }) => {
      if (!currentUser) return;
      setRecommendationResult(null);
      setRecommendationLoading(false);

      try {
        const docData: any = {
          title: eventData.title,
          time: eventData.time,
          duration: eventData.duration,
          date: selectedDate,
          createdAt: serverTimestamp(),
        };

        // Salvamos como 'disciplinaNome' no banco para manter compatibilidade de dados,
        // mas no código tratamos como 'energy'
        if (eventData.energy) {
          docData.disciplinaNome = eventData.energy;
        }

        const docRef = await addDoc(
          collection(db, "users", currentUser.uid, "events"),
          docData
        );
        logAddEventCalendar();
        setModalVisible(false);

        if (eventData.recommend && eventData.energy) {
          const suggestions = await generateEnergyRecommendations(
            eventData.title + " - " + eventData.energy,
            eventData.duration
          );
          if (suggestions) {
            await updateDoc(docRef, {
              studyRecommendation: suggestions,
              recommendationGeneratedAt: serverTimestamp(),
            });
          }
        }
      } catch (error: any) {
        Alert.alert("Erro", "Não foi possível salvar o ritual.");
        setRecommendationLoading(false);
      }
    },
    [currentUser, selectedDate, generateEnergyRecommendations]
  );

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      if (!currentUser) return;
      Alert.alert("Desfazer Ritual", "Deseja remover este evento?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(
                doc(db, "users", currentUser.uid, "events", eventId)
              );
              logDeleteEventCalendar();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          },
        },
      ]);
    },
    [currentUser]
  );

  const handleWeekChange = (direction: "prev" | "next") => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const currentDateObj = new Date(year, month - 1, day);
    currentDateObj.setDate(
      currentDateObj.getDate() + (direction === "prev" ? -7 : 7)
    );
    setSelectedDate(formatDate(currentDateObj));
  };

  const markdownRules = useMemo(
    () => ({
      strong: (node: MarkdownNode, children: any) => (
        <Text
          key={node.key}
          style={{ fontWeight: "bold", color: themeColors.text, fontSize: 15 }}
        >
          {children}
        </Text>
      ),
      text: (node: MarkdownNode) => (
        <Text
          key={node.key}
          style={{ color: themeColors.text, fontSize: 15, lineHeight: 22 }}
        >
          {node.content}
        </Text>
      ),
      list_item: (node: MarkdownNode, children: any) => (
        <View key={node.key} style={{ flexDirection: "row", marginBottom: 5 }}>
          <Text style={{ color: themeColors.text, marginRight: 5 }}>•</Text>
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      ),
    }),
    [themeColors.text]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <View
            style={[
              styles.viewToggleContainer,
              { backgroundColor: themeColors.card },
            ]}
          >
            <TouchableOpacity
              onPress={() => setViewMode("agenda")}
              style={[
                styles.toggleButton,
                viewMode === "agenda" && {
                  backgroundColor: themeColors.accent,
                },
              ]}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  { color: viewMode === "agenda" ? "#fff" : themeColors.text },
                ]}
              >
                Rituais
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("day")}
              style={[
                styles.toggleButton,
                viewMode === "day" && { backgroundColor: themeColors.accent },
              ]}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  { color: viewMode === "day" ? "#fff" : themeColors.text },
                ]}
              >
                Ciclo
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: themeColors.accent }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <WeekSelector
          currentWeekStart={currentWeekStart}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onWeekChange={handleWeekChange}
        />

        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={themeColors.accent}
              style={styles.loadingIndicator}
            />
          ) : viewMode === "agenda" ? (
            <AgendaListView
              ref={sectionListRef}
              events={events}
              onDeleteEvent={handleDeleteEvent}
              todayString={todayString}
            />
          ) : (
            <DayTimelineView
              events={events}
              selectedDate={selectedDate}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
        </View>

        <AddEventModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAddEvent={handleAddEvent}
          selectedDate={selectedDate}
        />

        <Modal
          transparent
          animationType="fade"
          visible={!!recommendationResult || recommendationLoading}
          onRequestClose={() => setRecommendationResult(null)}
        >
          <View style={styles.recommendationModalBackdrop}>
            <ThemedView
              style={[
                styles.recommendationModalContent,
                { backgroundColor: themeColors.card },
              ]}
            >
              {recommendationLoading && (
                <>
                  <ActivityIndicator color={themeColors.accent} size="large" />
                  <ThemedText
                    style={[styles.recommendationTitle, { marginTop: 15 }]}
                  >
                    Consultando os astros...
                  </ThemedText>
                </>
              )}
              {recommendationResult && !recommendationLoading && (
                <>
                  <ScrollView style={styles.recommendationScrollView}>
                    <ThemedText
                      type="subtitle"
                      style={styles.recommendationTitle}
                    >
                      Orientação Cósmica:
                    </ThemedText>
                    <Markdown rules={markdownRules}>
                      {recommendationResult}
                    </Markdown>
                  </ScrollView>
                  <TouchableOpacity
                    style={[
                      styles.modalOkButton,
                      { backgroundColor: themeColors.accent },
                    ]}
                    onPress={() => setRecommendationResult(null)}
                  >
                    <Text style={styles.modalOkButtonText}>Gratidão</Text>
                  </TouchableOpacity>
                </>
              )}
            </ThemedView>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: "relative",
  },
  viewToggleContainer: {
    flexDirection: "row",
    borderRadius: 20,
    overflow: "hidden",
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 25, borderRadius: 16 },
  toggleButtonText: { fontWeight: "bold", fontSize: 14, textAlign: "center" },
  addButton: {
    position: "absolute",
    right: 20,
    top: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  addButtonText: {
    fontSize: 30,
    color: "white",
    lineHeight: 32,
    marginTop: -2,
  },
  contentContainer: { flex: 1 },
  loadingIndicator: { flex: 1, justifyContent: "center", alignItems: "center" },
  recommendationModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  recommendationModalContent: {
    width: "100%",
    maxHeight: "75%",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
  },
  recommendationScrollView: { width: "100%", marginBottom: 15 },
  recommendationTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
  },
  modalOkButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 10,
  },
  modalOkButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
