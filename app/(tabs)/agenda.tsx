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
import { Calendar, LocaleConfig, WeekCalendar } from "react-native-calendars";
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

type Event = {
  id: string;
  title: string;
  time: string;
  date: string;
};

type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
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
    const eventsCollection = collection(db, "users", user.uid, "events");
    const q = query(eventsCollection);

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

      // Ordena os eventos numericamente pelo horário
      for (const date in userEvents) {
        userEvents[date].sort((a, b) => {
          const [aHour, aMinute] = a.time.split(":").map(Number);
          const [bHour, bMinute] = b.time.split(":").map(Number);

          if (aHour !== bHour) {
            return aHour - bHour;
          }
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

  const markedDates: MarkedDates = {
    ...Object.keys(events).reduce<MarkedDates>((acc, date) => {
      if (events[date] && events[date].length > 0) {
        acc[date] = { marked: true, dotColor: Colors[colorScheme].accent };
      }
      return acc;
    }, {}),
    [selectedDate]: {
      selected: true,
      selectedColor: Colors[colorScheme].accent,
      ...(events[selectedDate] && events[selectedDate].length > 0
        ? { marked: true, dotColor: "white" }
        : {}),
    },
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
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
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: Colors[colorScheme].background,
              calendarBackground: Colors[colorScheme].background,
              textSectionTitleColor: "#b6c1cd",
              selectedDayBackgroundColor: Colors[colorScheme].accent,
              selectedDayTextColor: "#ffffff",
              todayTextColor: Colors[colorScheme].accent,
              dayTextColor: Colors[colorScheme].text,
              textDisabledColor: "#d9e1e8",
              dotColor: Colors[colorScheme].accent,
              selectedDotColor: "#ffffff",
              arrowColor: Colors[colorScheme].accent,
              monthTextColor: Colors[colorScheme].text,
              textDayFontWeight: "300",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "300",
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 16,
            }}
          />
        ) : (
          <WeekCalendar
            key="week"
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: Colors[colorScheme].background,
              calendarBackground: Colors[colorScheme].background,
              textSectionTitleColor: "#b6c1cd",
              selectedDayBackgroundColor: Colors[colorScheme].accent,
              selectedDayTextColor: "#ffffff",
              todayTextColor: Colors[colorScheme].accent,
              dayTextColor: Colors[colorScheme].text,
              textDisabledColor: "#d9e1e8",
              dotColor: Colors[colorScheme].accent,
              selectedDotColor: "#ffffff",
              arrowColor: Colors[colorScheme].accent,
              monthTextColor: Colors[colorScheme].text,
              textDayFontWeight: "300",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "300",
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 16,
            }}
          />
        )}

        <View style={styles.eventListContainer}>
          <ThemedText type="subtitle" style={styles.eventsHeader}>
            {selectedDate === today
              ? "Hoje"
              : selectedDate.split("-").reverse().join("/")}
          </ThemedText>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={events[selectedDate] || []}
              keyExtractor={(item) => item.id}
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
        </View>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: Colors[colorScheme].accent }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
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
  viewToggle: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 20,
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
  eventListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  eventsHeader: {
    marginBottom: 15,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    marginVertical: 5, // Reduzido de 6 para 5
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  colorBar: {
    width: 6,
    height: "100%",
  },
  eventDetails: {
    flex: 1,
    paddingVertical: 12, // Reduzido de 15 para 12
    paddingHorizontal: 12, // Reduzido de 15 para 12
  },
  eventTitle: {
    fontWeight: "600",
    fontSize: 15, // Reduzido de 16 para 15
  },
  eventTime: {
    fontSize: 13, // Reduzido de 14 para 13
    opacity: 0.7,
    marginTop: 2, // Reduzido de 4 para 2
  },
  noEventsText: {
    textAlign: "center",
    marginTop: 20,
    color: "gray",
  },
  deleteButton: {
    fontSize: 22,
    padding: 10,
    opacity: 0.6,
  },
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
  fabText: {
    fontSize: 30,
    color: "white",
    lineHeight: 30,
  },
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
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "gray",
  },
});
