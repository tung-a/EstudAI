import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/hooks/use-auth"; // Import o hook de autenticação
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
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Componentes importados
import { AddEventModal } from "@/components/agenda/AddEventModal";
import { AgendaListView } from "@/components/agenda/AgendaListView";
import { DayTimelineView } from "@/components/agenda/DayTimelineView";
import { WeekSelector } from "@/components/agenda/WeekSelector";
import { formatDate, getLocalDate } from "@/lib/dateUtils";

// Tipos
export type Event = {
  id: string;
  title: string;
  time: string;
  date: string;
  duration: number;
};
export type EventsByDate = { [date: string]: Event[] };
type ViewMode = "agenda" | "day";

export default function AgendaScreen() {
  const today = useMemo(() => getLocalDate(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date(today));
  const [events, setEvents] = useState<EventsByDate>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("agenda");

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const { user } = useAuth(); // Pega o usuário (com timezone) do contexto de autenticação

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "users", user.uid, "events"),
      orderBy("date", "asc"),
      orderBy("time", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userEvents: EventsByDate = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Event, "id">;
        if (!data.date) return;
        const event: Event = { id: doc.id, ...data };
        if (!userEvents[event.date]) userEvents[event.date] = [];
        userEvents[event.date].push(event);
      });
      setEvents(userEvents);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    setCurrentWeekStart(new Date(year, month - 1, day));
  }, [selectedDate]);

  const handleAddEvent = async (eventData: {
    title: string;
    time: string;
    duration: number;
  }) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "events"), {
        ...eventData,
        date: selectedDate,
      });
      logAddEventCalendar();
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível salvar o evento.", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    Alert.alert("Confirmar Exclusão", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", user.uid, "events", eventId));
            logDeleteEventCalendar();
          } catch (error) {
            console.error("Erro ao deletar evento: ", error);
          }
        },
      },
    ]);
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const currentDateObj = new Date(year, month - 1, day);
    currentDateObj.setDate(
      currentDateObj.getDate() + (direction === "prev" ? -7 : 7)
    );
    setSelectedDate(formatDate(currentDateObj));
  };

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
                Agenda
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
                Dia
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
            <AgendaListView events={events} onDeleteEvent={handleDeleteEvent} />
          ) : (
            <DayTimelineView
              events={events}
              selectedDate={selectedDate}
              onDeleteEvent={handleDeleteEvent}
              // Passando o fuso horário do usuário para o componente
              timezone={user?.timezone || "America/Sao_Paulo"}
            />
          )}
        </View>

        <AddEventModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAddEvent={handleAddEvent}
          selectedDate={selectedDate}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // ... (seus estilos permanecem os mesmos da resposta anterior) ...
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  viewToggleContainer: {
    flexDirection: "row",
    borderRadius: 20,
    overflow: "hidden",
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 16,
  },
  toggleButtonText: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
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
  contentContainer: {
    flex: 1,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
