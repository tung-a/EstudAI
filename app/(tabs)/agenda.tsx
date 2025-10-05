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
import { useEffect, useState } from "react";
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
import { Calendar, LocaleConfig } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

// Configuração para o idioma português (já existente)
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

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [events, setEvents] = useState<{ [date: string]: Event[] }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme() ?? "light";
  const user = auth.currentUser;

  // Carrega os eventos do Firestore
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
      // Ordena os eventos por hora
      for (const date in userEvents) {
        userEvents[date].sort((a, b) => a.time.localeCompare(b.time));
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
      if (events[date].length > 0) {
        acc[date] = { marked: true, dotColor: Colors.light.tint };
      }
      return acc;
    }, {}),
    [selectedDate]: {
      selected: true,
      selectedColor: Colors.light.tint,
      // Mantém a bolinha se já houver um evento
      ...(Object.keys(events).includes(selectedDate) &&
      events[selectedDate].length > 0
        ? { marked: true }
        : {}),
    },
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: Colors[colorScheme].background,
            calendarBackground: Colors[colorScheme].background,
            textSectionTitleColor: "#b6c1cd",
            selectedDayBackgroundColor: Colors.light.tint,
            selectedDayTextColor: "#ffffff",
            todayTextColor: Colors.light.tint,
            dayTextColor: Colors[colorScheme].text,
            textDisabledColor: "#d9e1e8",
            dotColor: Colors.light.tint,
            selectedDotColor: "#ffffff",
            arrowColor: Colors.light.tint,
            monthTextColor: Colors[colorScheme].text,
            indicatorColor: "blue",
            textDayFontWeight: "300",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "300",
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 16,
          }}
        />

        <View style={styles.eventListContainer}>
          <ThemedText type="subtitle" style={styles.eventsHeader}>
            Eventos para {selectedDate.split("-").reverse().join("/")}
          </ThemedText>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <FlatList
              data={events[selectedDate] || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.eventItem}>
                  <ThemedText style={styles.eventTime}>{item.time}</ThemedText>
                  <ThemedText style={styles.eventTitle}>
                    {item.title}
                  </ThemedText>
                  <TouchableOpacity onPress={() => handleDeleteEvent(item.id)}>
                    <Text style={styles.deleteButton}>X</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <ThemedText style={styles.noEventsText}>
                  Nenhum evento para este dia.
                </ThemedText>
              }
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.fab}
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
              <TouchableOpacity style={styles.button} onPress={handleAddEvent}>
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
  eventListContainer: {
    flex: 1,
    padding: 20,
  },
  eventsHeader: {
    marginBottom: 10,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  noEventsText: {
    textAlign: "center",
    marginTop: 20,
    color: "gray",
  },
  deleteButton: {
    color: "red",
    fontSize: 18,
    marginLeft: 10,
  },
  fab: {
    position: "absolute",
    right: 30,
    bottom: 30,
    backgroundColor: Colors.light.tint,
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
    backgroundColor: "#007AFF",
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
