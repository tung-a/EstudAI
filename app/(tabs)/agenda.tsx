import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Calendar,
  CalendarProvider,
  LocaleConfig,
  WeekCalendar,
} from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

// Configuração do idioma
LocaleConfig.locales["pt-br"] = {
  monthNames: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],
  monthNamesShort: [
    "Jan.",
    "Fev.",
    "Mar.",
    "Abr.",
    "Mai.",
    "Jun.",
    "Jul.",
    "Ago.",
    "Set.",
    "Out.",
    "Nov.",
    "Dez.",
  ],
  dayNames: [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  today: "Hoje",
};
LocaleConfig.defaultLocale = "pt-br";

type Event = { id: string; title: string; time: string; date: string };
type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
  };
};
type CalendarView = "month" | "week";
const eventColors = ["#a29bfe", "#74b9ff", "#55efc4", "#ff7675"];

export default function AgendaScreen() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<{ [date: string]: Event[] }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");

  const colorScheme = useColorScheme() ?? "light";
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "users", user.uid, "events"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userEvents: { [date: string]: Event[] } = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Event, "id">;
        const event: Event = { id: doc.id, ...data };
        if (!userEvents[event.date]) {
          userEvents[event.date] = [];
        }
        userEvents[event.date].push(event);
      });
      for (const date in userEvents) {
        userEvents[date].sort((a, b) => {
          const [aHour, aMinute] = a.time.split(":").map(Number);
          const [bHour, bMinute] = b.time.split(":").map(Number);
          if (aHour !== bHour) return aHour - bHour;
          return aMinute - bMinute;
        });
      }
      setEvents(userEvents);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddEvent = async () => {
    if (!eventTitle || !eventTime || !user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "events"), {
        title: eventTitle,
        time: eventTime,
        date: selectedDate,
      });
      setEventTitle("");
      setEventTime("");
      setModalVisible(false);
    } catch (error) {
      console.error("Erro ao adicionar evento: ", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "events", eventId));
    } catch (error) {
      console.error("Erro ao deletar evento: ", error);
    }
  };

  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};
    // Aplica o ponto para dias com eventos
    Object.keys(events).forEach((date) => {
      if (events[date]?.length > 0) {
        marks[date] = {
          ...marks[date],
          marked: true,
          dotColor: Colors[colorScheme].accent,
        };
      }
    });

    // Aplica o estilo de dia selecionado (círculo suave)
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: `${Colors[colorScheme].accent}80`, // Cor com 50% de opacidade
      selectedTextColor: colorScheme === "dark" ? "#FFFFFF" : "#000000",
    };

    // Aplica o estilo de HOJE (círculo sólido), que sobrescreve o de selecionado se for o mesmo dia
    marks[today] = {
      ...marks[today],
      selected: true,
      selectedColor: Colors[colorScheme].accent,
      selectedTextColor: "#FFFFFF",
    };

    return marks;
  }, [events, selectedDate, today, colorScheme]);

  const calendarTheme = {
    backgroundColor: "transparent",
    calendarBackground: "transparent",
    textSectionTitleColor: colorScheme === "dark" ? "#9BA1A6" : "#687076",
    // Cor para Sábado e Domingo
    textSectionTitleDisabledColor: Colors.light.destructive,
    selectedDayTextColor: "#FFFFFF",
    dayTextColor: Colors[colorScheme].text,
    textDisabledColor: colorScheme === "dark" ? "#555" : "#d9e1e8",
    dotColor: Colors[colorScheme].accent,
    selectedDotColor: "#FFFFFF",
    arrowColor: Colors[colorScheme].accent,
    monthTextColor: Colors[colorScheme].text,
    textDayFontWeight: "300" as const,
    textMonthFontWeight: "bold" as const,
    textDayHeaderFontWeight: "300" as const,
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 16,
  };

  const getHeaderTitle = () => {
    if (!selectedDate) return "Eventos";
    if (selectedDate === today) return "Eventos de Hoje";
    const date = new Date(selectedDate + "T12:00:00Z");
    return `Eventos de ${
      LocaleConfig.locales["pt-br"].dayNames[date.getDay()]
    }`;
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>
        <CalendarProvider date={selectedDate} onDateChanged={setSelectedDate}>
          <View style={styles.viewToggle}>
            <TouchableOpacity onPress={() => setCalendarView("month")}>
              <ThemedText
                style={[
                  styles.toggleText,
                  calendarView === "month" && styles.activeToggle,
                ]}
              >
                Mês
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCalendarView("week")}>
              <ThemedText
                style={[
                  styles.toggleText,
                  calendarView === "week" && styles.activeToggle,
                ]}
              >
                Semana
              </ThemedText>
            </TouchableOpacity>
          </View>
          {calendarView === "month" ? (
            <Calendar
              key="month"
              markedDates={markedDates}
              theme={calendarTheme}
            />
          ) : (
            <WeekCalendar
              key="week"
              markedDates={markedDates}
              theme={calendarTheme}
            />
          )}
          {loading ? (
            <ActivityIndicator
              style={{ flex: 1 }}
              color={Colors[colorScheme].accent}
            />
          ) : (
            <FlatList
              style={styles.list}
              data={events[selectedDate] || []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContentContainer}
              ListHeaderComponent={
                <ThemedText type="subtitle" style={styles.eventsHeader}>
                  {getHeaderTitle()}
                </ThemedText>
              }
              renderItem={({ item, index }) => {
                const cardColor = eventColors[index % eventColors.length];
                return (
                  <ThemedView
                    lightColor={Colors.light.card}
                    darkColor={Colors.dark.card}
                    style={styles.eventItem}
                  >
                    <View
                      style={[styles.colorBar, { backgroundColor: cardColor }]}
                    />
                    <View style={styles.eventDetails}>
                      <ThemedText style={styles.eventTitle}>
                        {item.title}
                      </ThemedText>
                      <ThemedText style={styles.eventTime}>
                        {item.time}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteEvent(item.id)}
                    >
                      <ThemedText style={styles.deleteButton}>✕</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                );
              }}
              ListEmptyComponent={
                <ThemedText style={styles.noEventsText}>
                  Nenhum evento para este dia.
                </ThemedText>
              }
            />
          )}

          <TouchableOpacity
            style={[
              styles.fab,
              { backgroundColor: Colors[colorScheme].accent },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>

          <Modal
            animationType="slide"
            transparent
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: Colors[colorScheme].background },
                ]}
              >
                <ThemedText type="subtitle">Adicionar Evento</ThemedText>
                <TextInput
                  placeholder="Título do Evento"
                  style={[
                    styles.input,
                    {
                      color: Colors[colorScheme].text,
                      borderColor: Colors[colorScheme].icon,
                    },
                  ]}
                  placeholderTextColor={Colors[colorScheme].icon}
                  value={eventTitle}
                  onChangeText={setEventTitle}
                />
                <TextInput
                  placeholder="Horário (ex: 14:00)"
                  style={[
                    styles.input,
                    {
                      color: Colors[colorScheme].text,
                      borderColor: Colors[colorScheme].icon,
                    },
                  ]}
                  placeholderTextColor={Colors[colorScheme].icon}
                  value={eventTime}
                  onChangeText={setEventTime}
                />
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: Colors[colorScheme].accent },
                  ]}
                  onPress={handleAddEvent}
                >
                  <Text style={styles.buttonText}>Salvar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </CalendarProvider>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  viewToggle: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 20,
    paddingHorizontal: 20,
  },
  toggleText: {
    padding: 8,
    fontSize: 16,
    opacity: 0.6,
  },
  activeToggle: {
    fontWeight: "bold",
    opacity: 1,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.accent,
  },
  list: {
    flex: 1, // Faz a lista ocupar o espaço restante
    marginTop: 24, // Adiciona o espaço que foi removido
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Espaço para o FAB
  },
  eventsHeader: {
    marginBottom: 10,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    marginVertical: 5,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  colorBar: { width: 6, height: "100%" },
  eventDetails: { flex: 1, paddingVertical: 12, paddingHorizontal: 12 },
  eventTitle: { fontWeight: "600", fontSize: 15 },
  eventTime: { fontSize: 13, opacity: 0.7, marginTop: 2 },
  noEventsText: { textAlign: "center", marginTop: 20, color: "gray" },
  deleteButton: { fontSize: 22, padding: 10, opacity: 0.6 },
  fab: {
    position: "absolute",
    right: 30,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 10,
  },
  fabText: { fontSize: 30, color: "white", lineHeight: 30 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  cancelButton: { backgroundColor: "gray" },
});
