// app/(user)/agenda.tsx
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig"; // Importar auth diretamente
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
import React, { useEffect, useMemo, useRef, useState } from "react"; // Importa useRef
import {
  ActivityIndicator,
  Alert,
  SectionList, // Importa SectionList para tipagem da ref
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddEventModal } from "@/components/agenda/AddEventModal";
import { AgendaListView } from "@/components/agenda/AgendaListView";
import { DayTimelineView } from "@/components/agenda/DayTimelineView";
import { WeekSelector } from "@/components/agenda/WeekSelector";
// Importa funções de data JÁ simplificadas (sem timezone)
import { formatDate, getLocalDate, getWeekDays } from "@/lib/dateUtils";

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
  // Pega o usuário direto do auth
  const currentUser = auth.currentUser;

  // --- HOJE: Usa getLocalDate SEM timezone (pega do dispositivo) ---
  const todayString = useMemo(() => getLocalDate(), []);
  // ---------------------------------------------

  const [selectedDate, setSelectedDate] = useState(todayString); // Inicia com "hoje" do dispositivo
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Calcula o início da semana baseado no 'todayString' inicial
    const [year, month, day] = todayString.split("-").map(Number);
    const initialDate = new Date(year, month - 1, day);
    const startOfWeek = getWeekDays(initialDate)[0]; // Pega o primeiro dia da semana
    return startOfWeek;
  });
  const [events, setEvents] = useState<EventsByDate>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("agenda");

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  // --- Ref para a SectionList ---
  const sectionListRef = useRef<SectionList<Event>>(null);
  // -----------------------------

  // Efeito para buscar eventos (usa currentUser.uid)
  useEffect(() => {
    if (!currentUser) {
      // Verifica se há um usuário logado
      setLoading(false);
      setEvents({}); // Limpa eventos se não houver usuário
      return;
    }
    setLoading(true); // Garante que loading seja true ao buscar
    const q = query(
      collection(db, "users", currentUser.uid, "events"), // Usa currentUser.uid
      orderBy("date", "asc"),
      orderBy("time", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userEvents: EventsByDate = {};
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<Event, "id">;
          if (!data.date) return; // Segurança extra
          const event: Event = { id: doc.id, ...data };
          if (!userEvents[event.date]) userEvents[event.date] = [];
          userEvents[event.date].push(event);
        });
        setEvents(userEvents);
        setLoading(false);
      },
      (error) => {
        // Adiciona tratamento de erro para o listener
        console.error("Erro ao buscar eventos: ", error);
        setLoading(false);
        // Pode mostrar um alerta para o usuário aqui se desejar
      }
    );
    // Função de limpeza
    return () => unsubscribe();
  }, [currentUser]); // Reexecuta se o usuário mudar

  // Efeito para atualizar o início da semana quando a data selecionada muda
  useEffect(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    const startOfWeekForSelected = getWeekDays(selectedDateObj)[0];
    setCurrentWeekStart(startOfWeekForSelected);
  }, [selectedDate]);

  // --- Efeito para rolar para a seção de hoje ou futura mais próxima ---
  useEffect(() => {
    // Só executa se não estiver carregando, estiver na view 'agenda' e a ref existir
    if (!loading && viewMode === "agenda" && sectionListRef.current) {
      // --- LÓGICA DE SCROLL ATUALIZADA ---
      // 1. Gera a mesma lista de datas que será usada no AgendaListView
      const datesWithEvents = Object.keys(events);
      const allDatesSet = new Set(datesWithEvents);
      allDatesSet.add(todayString); // Garante que 'hoje' esteja incluído
      const allSortedDates = Array.from(allDatesSet).sort(); // Ordena

      // 2. Encontra o índice da primeira data >= hoje NESTA LISTA COMPLETA
      const targetSectionIndex = allSortedDates.findIndex(
        (date) => date >= todayString
      );

      // 3. Rola se encontrou um índice válido
      if (targetSectionIndex !== -1) {
        setTimeout(() => {
          sectionListRef.current?.scrollToLocation({
            sectionIndex: targetSectionIndex, // Rola para a seção encontrada
            itemIndex: 0, // Vai para o header da seção
            viewPosition: 0, // Alinha o topo da seção com o topo da lista
            animated: true, // Anima o scroll
          });
        }, 150); // Delay pode precisar de ajuste fino
      }
      // Se targetSectionIndex === -1 (nenhuma seção de hoje ou futura encontrada),
      // não faz nada, a lista começará mostrando as seções mais antigas.
      // --- FIM DA LÓGICA ATUALIZADA ---
    }
    // Adiciona 'events' como dependência pois allSortedDates depende dele
  }, [loading, viewMode, events, todayString]);
  // ---------------------------------------------

  // Handler para adicionar evento (usa currentUser.uid)
  const handleAddEvent = async (eventData: {
    title: string;
    time: string;
    duration: number;
  }) => {
    if (!currentUser) return; // Checa usuário
    try {
      await addDoc(collection(db, "users", currentUser.uid, "events"), {
        // Usa currentUser.uid
        ...eventData,
        date: selectedDate,
      });
      logAddEventCalendar();
      setModalVisible(false);
    } catch (error: any) {
      console.error("Erro ao adicionar evento:", error); // Log do erro
      Alert.alert("Erro", "Não foi possível salvar o evento.");
    }
  };

  // Handler para deletar evento (usa currentUser.uid)
  const handleDeleteEvent = async (eventId: string) => {
    if (!currentUser) return; // Checa usuário
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este evento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(
                doc(db, "users", currentUser.uid, "events", eventId)
              ); // Usa currentUser.uid
              logDeleteEventCalendar();
            } catch (error) {
              console.error("Erro ao deletar evento: ", error);
              Alert.alert("Erro", "Não foi possível excluir o evento.");
            }
          },
        },
      ]
    );
  };

  // Handler para mudar de semana
  const handleWeekChange = (direction: "prev" | "next") => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const currentDateObj = new Date(year, month - 1, day);
    currentDateObj.setDate(
      currentDateObj.getDate() + (direction === "prev" ? -7 : 7)
    );
    setSelectedDate(formatDate(currentDateObj)); // Atualiza a data selecionada
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>
        {/* Header com botões de toggle e adicionar */}
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

        {/* Seletor de Semana */}
        <WeekSelector
          currentWeekStart={currentWeekStart}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onWeekChange={handleWeekChange}
        />

        {/* Conteúdo Principal (Lista ou Timeline) */}
        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={themeColors.accent}
              style={styles.loadingIndicator}
            />
          ) : viewMode === "agenda" ? (
            // Passa a ref e todayString para AgendaListView
            <AgendaListView
              ref={sectionListRef}
              events={events}
              onDeleteEvent={handleDeleteEvent}
              todayString={todayString} // Passa o 'hoje' para destacar ou usar na rolagem
            />
          ) : (
            // DayTimelineView não precisa mais do timezone
            <DayTimelineView
              events={events}
              selectedDate={selectedDate}
              onDeleteEvent={handleDeleteEvent}
              // timezone prop removida
            />
          )}
        </View>

        {/* Modal de Adicionar Evento */}
        <AddEventModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAddEvent={handleAddEvent}
          selectedDate={selectedDate}
          // timezone prop removida (se foi adicionada antes)
        />
      </SafeAreaView>
    </ThemedView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "center", // Centraliza o toggle
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: "relative", // Necessário para posicionar o botão Add absoluto
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
    position: "absolute", // Posiciona sobre os outros elementos
    right: 20, // Alinha à direita
    top: 10, // Alinha ao topo (dentro do padding do header)
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
    marginTop: -2, // Ajuste fino vertical do "+"
  },
  contentContainer: {
    flex: 1, // Ocupa o espaço restante
  },
  loadingIndicator: {
    flex: 1, // Centraliza o indicador
    justifyContent: "center",
    alignItems: "center",
  },
});
