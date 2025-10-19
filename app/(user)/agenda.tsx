// app/(user)/agenda.tsx
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
  getDoc, // Importar getDocs
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button, // Importar Button
  SectionList,
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
import { useChat } from "@/contexts/ChatContext"; // Importar useChat
import { formatDate, getLocalDate, getWeekDays } from "@/lib/dateUtils";

// Tipos
export type Event = {
  id: string;
  title: string;
  time: string;
  date: string;
  duration: number;
  disciplina?: string; // Adicionado
  disciplinaId?: string;
  disciplinaNome?: string;
  studyRecommendation?: string;
  recommendationGeneratedAt?: Timestamp;
};
export type EventsByDate = { [date: string]: Event[] };
type ViewMode = "agenda" | "day";
// Tipo para perfil do usuário (simplificado)
type UserProfile = {
  goal?: string;
  // outros campos se necessário
};
// Tipo para recomendações (simples)
type Recommendation = {
  id: string;
  disciplina: string;
  data: string;
  horaSugerida: string;
  prioridade: number;
};

// Função para normalizar nome/ID (igual aos scripts)
const normalizeDocId = (name: string | undefined): string | null => {
  if (!name || typeof name !== "string") return null;
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
};

export default function AgendaScreen() {
  const currentUser = auth.currentUser;
  const { getChatModel } = useChat(); // Pegar a função do contexto do chat

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Estado para perfil
  const [coursePriorities, setCoursePriorities] = useState<Record<
    string,
    number
  > | null>(null); // Estado para prioridades
  const [recommendationResult, setRecommendationResult] = useState<string | null>(
    null
  ); // Estado para exibir recomendação
  const [recommendationLoading, setRecommendationLoading] = useState(false); // Loading para recomendação

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const sectionListRef = useRef<SectionList<Event>>(null);

  // Efeito para buscar perfil e prioridades
  useEffect(() => {
    let isMounted = true;
    const fetchUserData = async () => {
      if (currentUser && isMounted) {
        setLoading(true); // Começa a carregar dados do usuário
        try {
          // 1. Buscar Perfil (goal)
          const profileDocSnap = await getDoc(
            doc(db, "users", currentUser.uid)
          );
          if (!isMounted) return;

          let goal = "Outro"; // Fallback
          if (profileDocSnap.exists()) {
            const data = profileDocSnap.data();
            setUserProfile(data as UserProfile);
            goal = data.goal || "Outro";
          } else {
            setUserProfile(null); // Ou um perfil padrão
          }

          // 2. Buscar Prioridades usando o goal
          const normalizedGoalId = normalizeDocId(goal);
          let prioritiesData = null;

          if (normalizedGoalId) {
            const priorityDocSnap = await getDoc(
              doc(db, "prioridades_cursos", normalizedGoalId)
            );
            if (!isMounted) return;
            if (priorityDocSnap.exists()) {
              prioritiesData = priorityDocSnap.data()?.prioridades;
            }
          }

          // Fallback para "Outro" se não encontrar prioridades específicas ou goal for inválido
          if (!prioritiesData) {
            const fallbackDocSnap = await getDoc(
              doc(db, "prioridades_cursos", "outro")
            );
            if (!isMounted) return;
            if (fallbackDocSnap.exists()) {
              prioritiesData = fallbackDocSnap.data()?.prioridades;
            }
          }

          setCoursePriorities(prioritiesData);
        } catch (error) {
          console.error("Erro ao buscar dados do usuário/prioridades:", error);
          if (isMounted) {
            setCoursePriorities(null); // Limpa em caso de erro
            setUserProfile(null);
          }
        } finally {
          // setLoading(false); // Loading principal será controlado pelo fetch de eventos
        }
      } else if (isMounted) {
        // Sem usuário logado
        setUserProfile(null);
        setCoursePriorities(null);
        // setLoading(false); // Loading principal será controlado pelo fetch de eventos
      }
    };
    fetchUserData();
    return () => {
      isMounted = false;
    };
  }, [currentUser]); // Depende apenas do currentUser

  // Efeito para buscar eventos (ajustado para lidar com loading)
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setEvents({});
      return;
    }

    // Só inicia o loading de eventos se os dados do usuário já foram (ou tentaram ser) carregados
    if (userProfile !== undefined && coursePriorities !== undefined) {
        setLoading(true);
    } else {
        return; // Espera userProfile e coursePriorities serem definidos (null ou objeto)
    }


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
          const data = doc.data() as Omit<Event, "id">;
          if (!data.date) return;
          const event: Event = { id: doc.id, ...data };
          if (!userEvents[event.date]) userEvents[event.date] = [];
          userEvents[event.date].push(event);
        });
        setEvents(userEvents);
        setLoading(false); // Termina loading APÓS buscar eventos
      },
      (error) => {
        console.error("Erro ao buscar eventos: ", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser, userProfile, coursePriorities]); // Depende também do perfil/prioridades para iniciar

  // Efeito para atualizar o início da semana (inalterado)
  useEffect(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    const startOfWeekForSelected = getWeekDays(selectedDateObj)[0];
    setCurrentWeekStart(startOfWeekForSelected);
  }, [selectedDate]);

  // Efeito para rolar (inalterado)
  useEffect(() => {
    if (!loading && viewMode === "agenda" && sectionListRef.current) {
      const datesWithEvents = Object.keys(events);
      const allDatesSet = new Set(datesWithEvents);
      allDatesSet.add(todayString);
      const allSortedDates = Array.from(allDatesSet).sort();
      const targetSectionIndex = allSortedDates.findIndex(
        (date) => date >= todayString
      );
      if (targetSectionIndex !== -1) {
        setTimeout(() => {
          sectionListRef.current?.scrollToLocation({
            sectionIndex: targetSectionIndex,
            itemIndex: 0,
            viewPosition: 0,
            animated: true,
          });
        }, 150);
      }
    }
  }, [loading, viewMode, events, todayString]);

  // --- Função para buscar recomendações ---
  const generateStudyRecommendations = useCallback(
    async (disciplina: string, duration: number) => {
      console.log(`Buscando recomendações para ${disciplina} por ${duration} min.`);
      setRecommendationLoading(true);
      setRecommendationResult(null); // Limpa resultado anterior

      try {
        const userGoal = userProfile?.goal || "Outro";
        const priorities = coursePriorities;
        const normalizedDisciplinaId = normalizeDocId(disciplina);
        let competenciasTexto = "Conteúdo específico da disciplina não encontrado.";

        if (normalizedDisciplinaId) {
          const disciplinaDocSnap = await getDoc(
            doc(db, "conteudo_disciplinas", normalizedDisciplinaId)
          );
          if (disciplinaDocSnap.exists()) {
            const data = disciplinaDocSnap.data();
            competenciasTexto = (data.competencias || [])
              .map(
                (comp: any) =>
                  `Competência ${comp.numero}: ${
                    comp.descricao || ""
                  }\nHabilidades: ${(comp.habilidades || [])
                    .map((h: any) => h.descricao)
                    .join(", ")}`
              )
              .join("\n\n");
            // Limitar tamanho para não exceder limites do prompt
            if (competenciasTexto.length > 1500) {
                 competenciasTexto = competenciasTexto.substring(0, 1500) + "... (mais conteúdo disponível)";
            }
          }
        }

        // Usa normalizeDocId também para buscar a prioridade
        const normalizedPrioKey = normalizeDocId(disciplina);
        const prioridade = (normalizedPrioKey && priorities?.[normalizedPrioKey]) || 2; // Default 2 (média)

        const promptSegments: string[] = [
          `Monte um plano de estudo para ${disciplina} com duração total de ${duration} minutos, pensado para o vestibular de ${userGoal}.`,
          `Divida esse tempo em 2 ou 3 etapas complementares (por exemplo, revisão, exercícios, flashcards), dando alguns minutos a mais quando necessário para preparação, consulta de materiais ou pausa rápida, sempre mencionando o tempo dedicado em cada atividade.`,
          `Após escolher o conteúdo, selecione um recorte específico (um único conceito, tema ou acontecimento) e foque somente nele; não liste vários tópicos amplos na mesma etapa.`,
          `Prefira instruções concretas sobre o que fazer naquele recorte (ex.: responder 3 questões sobre "Era Vargas" de um vestibular recente, mapear causa e consequência de um evento, resumir um parágrafo do autor X).`,
          `Garanta que a soma dos tempos de todas as etapas seja exatamente ${duration} minutos; nunca ofereça etapas que individualmente usem ${duration} minutos ou ultrapassem esse total, mesmo ao adicionar esse tempo extra de preparação.`,
          `Escreva cada item no formato "XX min – atividade" para deixar claro o tempo reservado.` ,
          `Formate como uma lista numerada simples, sem introdução ou conclusão.`,
          `A prioridade dessa matéria para este curso é considerada ${prioridade === 3 ? "alta" : prioridade === 2 ? "média" : "baixa"}.`,
        ];

        if (competenciasTexto !== "Conteúdo específico da disciplina não encontrado.") {
          promptSegments.splice(2, 0, `Considere as seguintes competências e habilidades gerais: \n${competenciasTexto}`);
        }

        const prompt = promptSegments.join(" ");

        const model = getChatModel();
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        setRecommendationResult(responseText); // Guarda para exibir
        return responseText;
      } catch (error) {
        console.error("Erro ao buscar recomendações:", error);
        Alert.alert("Erro", "Não foi possível gerar sugestões no momento.");
        setRecommendationResult(null);
        return null;
      } finally {
        setRecommendationLoading(false);
      }
    },
    [userProfile, coursePriorities, getChatModel]
  ); // Depende do perfil, prioridades e da função do chat

  // Handler para adicionar evento (modificado)
  const handleAddEvent = useCallback(
    async (eventData: {
      title: string;
      time: string;
      duration: number;
      disciplina?: string;
      recommend?: boolean;
    }) => {
      if (!currentUser) return;
      setRecommendationResult(null); // Limpa recomendações antigas

      try {
        const docData: any = {
          title: eventData.title,
          time: eventData.time,
          duration: eventData.duration,
          date: selectedDate,
          createdAt: serverTimestamp(), // Adiciona timestamp de criação
        };
        // Salva a disciplina formatada se existir
        if (eventData.disciplina) {
          const normalizedDisciplina = normalizeDocId(eventData.disciplina);
          if (normalizedDisciplina) {
             docData.disciplinaId = normalizedDisciplina; // Salva ID normalizado
             docData.disciplinaNome = eventData.disciplina; // Salva nome original
          }
        }

        const docRef = await addDoc(
          collection(db, "users", currentUser.uid, "events"),
          docData
        );
        logAddEventCalendar();
        setModalVisible(false); // Fecha o modal principal primeiro

        // Chama recomendação DEPOIS de fechar o modal e salvar
        if (eventData.recommend && eventData.disciplina) {
          const suggestions = await generateStudyRecommendations(
            eventData.disciplina,
            eventData.duration
          );
          if (suggestions) {
            try {
              await updateDoc(docRef, {
                studyRecommendation: suggestions,
                recommendationGeneratedAt: serverTimestamp(),
              });
            } catch (updateError) {
              console.error(
                "Erro ao salvar recomendação no evento:",
                updateError
              );
            }
          }
        }
      } catch (error: any) {
        console.error("Erro ao adicionar evento:", error);
        Alert.alert("Erro", "Não foi possível salvar o evento.");
        setRecommendationLoading(false); // Garante que loading pare em caso de erro no addDoc
      }
    },
    [currentUser, selectedDate, generateStudyRecommendations] // Adiciona dependência
  );

  // Handler para deletar evento (inalterado)
  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      // ... (código existente) ...
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
    },
    [currentUser]
  );

  // Handler para mudar de semana (inalterado)
  const handleWeekChange = (direction: "prev" | "next") => {
    // ... (código existente) ...
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
            {/* ... (código toggle e botão +) ... */}
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

         {/* Display de Recomendação */}
         {recommendationLoading && (
            <View style={styles.recommendationDisplay}>
                <ActivityIndicator color={themeColors.accent} />
                <ThemedText style={styles.recommendationTitle}>Gerando sugestões...</ThemedText>
            </View>
         )}
         {recommendationResult && !recommendationLoading && (
           <View style={[styles.recommendationDisplay, {backgroundColor: themeColors.card}]}>
              <ThemedText type="subtitle" style={styles.recommendationTitle}>Sugestões de Estudo:</ThemedText>
              <ThemedText style={styles.recommendationText}>{recommendationResult}</ThemedText>
              <Button title="Ok" onPress={() => setRecommendationResult(null)} color={themeColors.accent} />
           </View>
         )}


        {/* Conteúdo Principal (Lista ou Timeline) */}
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

        {/* Modal de Adicionar Evento (passa a prop onAddEvent atualizada) */}
        <AddEventModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAddEvent={handleAddEvent} // Passa o handleAddEvent atualizado
          selectedDate={selectedDate}
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
  // Estilos para display da recomendação
  recommendationDisplay: {
      marginHorizontal: 20,
      marginVertical: 10,
      padding: 15,
      borderRadius: 10,
      // backgroundColor: themeColors.card, // Definido inline para tema
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      gap: 10, // Espaço entre elementos
  },
  recommendationTitle: {
      marginBottom: 5,
      textAlign: 'center',
  },
  recommendationText: {
      fontSize: 15,
      lineHeight: 22,
  },
});