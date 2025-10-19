// components/agenda/AddEventModal.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { db } from "@/firebaseConfig"; // Importar db
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatHeaderTitle } from "@/lib/dateUtils";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore"; // Importar funções do Firestore
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList, // Usar FlatList para disciplinas
  KeyboardAvoidingView,
  Modal, // Manter o Modal principal
  Platform,
  StyleSheet,
  Switch, // Importar Switch
  Text,
  TextInput,
  TouchableOpacity,
  View, // Manter View
} from "react-native";

type AddEventModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onAddEvent: (eventData: {
    title: string;
    time: string;
    duration: number;
    disciplina?: string; // Tornar opcional, mas usado para recomendação
    recommend?: boolean; // Flag para solicitar recomendação
  }) => void;
  selectedDate: string;
};

// Função para normalizar nome da disciplina para ID (igual aos scripts)
const normalizeDocId = (name: string | undefined): string | null => {
  if (!name || typeof name !== "string") return null;
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
};

export const AddEventModal = ({
  isVisible,
  onClose,
  onAddEvent,
  selectedDate,
}: AddEventModalProps) => {
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDuration, setEventDuration] = useState("");
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(
    null
  );
  const [recommendContent, setRecommendContent] = useState(false);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [disciplinasLoading, setDisciplinasLoading] = useState(false);
  // Renomear o estado de visibilidade da lista
  const [showDisciplinaList, setShowDisciplinaList] = useState(false); // <--- RENOMEADO

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  // Efeito para buscar disciplinas do Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchDisciplinas = async () => {
      setDisciplinasLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "conteudo_disciplinas"));
        if (!isMounted) return;
        const loadedDisciplinas = snapshot.docs
          .map((doc) => doc.data()?.disciplina)
          .filter(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0
          )
          .sort((a, b) => a.localeCompare(b, "pt-BR"));
        setDisciplinas(loadedDisciplinas);
      } catch (error) {
        console.error("Erro ao carregar disciplinas:", error);
        if (isMounted) {
          Alert.alert(
            "Erro",
            "Não foi possível carregar a lista de disciplinas."
          );
        }
      } finally {
        if (isMounted) {
          setDisciplinasLoading(false);
        }
      }
    };
    fetchDisciplinas();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = () => {
    // Validações
    if (!eventTitle || !eventTime || !eventDuration) {
      Alert.alert("Erro", "Preencha título, horário e duração.");
      return;
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(eventTime)) {
      Alert.alert("Formato de Hora Inválido", "Use o formato HH:MM.");
      return;
    }
    const duration = parseInt(eventDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert("Duração Inválida", "Insira um número de minutos válido.");
      return;
    }
    if (recommendContent && !selectedDisciplina) {
      Alert.alert(
        "Disciplina Necessária",
        "Selecione uma disciplina para receber sugestões de estudo."
      );
      return;
    }

    setShowDisciplinaList(false); // Fecha a lista se estiver aberta
    onAddEvent({
      title: eventTitle,
      time: eventTime,
      duration: duration,
      disciplina: selectedDisciplina || undefined,
      recommend: recommendContent,
    });
    // Limpa os campos após salvar
    setEventTitle("");
    setEventTime("");
    setEventDuration("");
    setSelectedDisciplina(null);
    setRecommendContent(false);
  };

  const handleSelectDisciplina = (disciplina: string) => {
    setSelectedDisciplina(disciplina);
    setShowDisciplinaList(false); // Fecha a lista após selecionar
  };

  // Atualizar o handler de fechar o modal principal
  const handleCloseModal = () => {
    setShowDisciplinaList(false); // Garante que a lista fecha também
    setEventTitle("");
    setEventTime("");
    setEventDuration("");
    setSelectedDisciplina(null);
    setRecommendContent(false);
    onClose();
  };

  // Função para lidar com a mudança do Switch
  const handleRecommendSwitchChange = (value: boolean) => {
    setRecommendContent(value);
    // Se o switch for desativado, limpa a disciplina selecionada
    if (!value) {
      setSelectedDisciplina(null);
    }
  };

  return (
    // Modal Principal
    <Modal
      animationType="fade"
      transparent
      visible={isVisible}
      onRequestClose={handleCloseModal} // Usa o handler atualizado
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalBackdrop}
      >
        <ThemedView
          style={[
            styles.modalContent,
            { backgroundColor: themeColors.background },
          ]}
          // onStartShouldSetResponder pode ser removido agora
        >
          {/* Renderização Condicional: Lista OU Formulário */}
          {showDisciplinaList ? (
            // ----- Visualização da Lista de Disciplinas -----
            <View style={styles.inlineListContainer}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                  Escolha a Disciplina
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDisciplinaList(false)} // Botão para fechar a lista
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons
                    name="close"
                    size={22}
                    color={themeColors.icon}
                  />
                </TouchableOpacity>
              </View>
              {disciplinasLoading ? (
                <View style={styles.modalLoaderContainer}>
                  <ActivityIndicator size="large" color={themeColors.accent} />
                </View>
              ) : (
                <FlatList
                  data={disciplinas}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.modalOption, // Reutiliza estilo
                        {
                          borderColor: themeColors.icon + "50",
                          backgroundColor:
                            selectedDisciplina === item // Usa selectedDisciplina aqui para destacar
                              ? themeColors.accent
                              : "transparent",
                        },
                      ]}
                      onPress={() => handleSelectDisciplina(item)}
                    >
                      <Text
                        style={[
                          styles.modalOptionText, // Reutiliza estilo
                          {
                            color:
                              selectedDisciplina === item // Usa selectedDisciplina
                                ? "#FFFFFF"
                                : themeColors.text,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text
                      style={[
                        styles.modalEmptyText,
                        { color: themeColors.icon },
                      ]}
                    >
                      Nenhuma disciplina encontrada.
                    </Text>
                  }
                  style={styles.modalContentList} // Reutiliza estilo
                  contentContainerStyle={styles.modalContentContainer} // Reutiliza estilo
                />
              )}
            </View>
          ) : (
            // ----- Formulário Original -----
            <>
              <ThemedText type="subtitle">Adicionar Evento</ThemedText>
              <ThemedText style={styles.modalDateText}>
                {formatHeaderTitle(selectedDate)}
              </ThemedText>
              {/* Input Título */}
              <TextInput
                placeholder="Título do Evento (ex: Estudar Matemática)"
                style={[
                  styles.input,
                  {
                    color: themeColors.text,
                    borderColor: themeColors.icon,
                    backgroundColor: themeColors.card,
                  },
                ]}
                placeholderTextColor={themeColors.icon}
                value={eventTitle}
                onChangeText={setEventTitle}
              />
              {/* Inputs Horário e Duração */}
              <View style={styles.timeRow}>
                <TextInput
                  placeholder="Horário (HH:MM)"
                  style={[
                    styles.input,
                    styles.timeInput,
                    {
                      color: themeColors.text,
                      borderColor: themeColors.icon,
                      backgroundColor: themeColors.card,
                    },
                  ]}
                  placeholderTextColor={themeColors.icon}
                  value={eventTime}
                  onChangeText={setEventTime}
                  keyboardType="numbers-and-punctuation" // <-- Correção mantida
                  maxLength={5}
                />
                <TextInput
                  placeholder="Duração (min)"
                  style={[
                    styles.input,
                    styles.timeInput,
                    {
                      color: themeColors.text,
                      borderColor: themeColors.icon,
                      backgroundColor: themeColors.card,
                      marginLeft: 10,
                    },
                  ]}
                  placeholderTextColor={themeColors.icon}
                  value={eventDuration}
                  onChangeText={setEventDuration}
                  keyboardType="numeric"
                />
              </View>
              {/* Switch para Recomendar */}
              <View style={styles.switchContainer}>
                <ThemedText>Sugerir tópicos de estudo?</ThemedText>
                <Switch
                  value={recommendContent}
                  // Usa o novo handler que também limpa a disciplina
                  onValueChange={handleRecommendSwitchChange} // <-- ALTERADO AQUI
                  trackColor={{ false: "#767577", true: themeColors.accent }}
                  thumbColor={
                    Platform.OS === "android"
                      ? recommendContent
                        ? themeColors.accent
                        : "#f4f3f4"
                      : "#f4f3f4"
                  }
                  ios_backgroundColor="#3e3e3e"
                />
              </View>
              {/* Botão Seletor de Disciplina (CONDICIONAL) */}
              {recommendContent && ( // <--- ADICIONADA CONDIÇÃO AQUI
                <TouchableOpacity
                  style={[
                    styles.selectorButton,
                    {
                      borderColor: themeColors.icon,
                      backgroundColor: themeColors.card,
                      opacity: disciplinasLoading ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => setShowDisciplinaList(true)}
                  disabled={disciplinasLoading}
                >
                  {disciplinasLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={themeColors.accent}
                      style={styles.selectorActivity}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.selectorText,
                        {
                          color: selectedDisciplina
                            ? themeColors.text
                            : themeColors.icon,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedDisciplina || "Selecionar Disciplina"}{" "}
                      {/* Removido (opcional) */}
                    </Text>
                  )}
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color={themeColors.icon}
                  />
                </TouchableOpacity>
              )}{" "}
              {/* <--- FIM DA CONDIÇÃO */}
              {/* Botões Salvar/Cancelar */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: themeColors.accent }]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Estilos
const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    width: "90%",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  inlineListContainer: {
    // Novo estilo para o container da lista
    width: "100%",
    maxHeight: 400, // Ajuste conforme necessário
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
    paddingHorizontal: 16, // Padding horizontal no header
    width: "100%", // Para ocupar a largura
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalLoaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180, // Garante espaço para o loader
    padding: 16, // Padding interno
  },
  modalContentList: {
    width: "100%", // Para o FlatList ocupar a largura
  },
  modalContentContainer: {
    paddingBottom: 16,
    paddingHorizontal: 12, // Padding para os itens da lista
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalEmptyText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 20,
    opacity: 0.7,
  },
  modalDateText: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 20,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  timeRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  timeInput: {
    flex: 1,
  },
  selectorButton: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  selectorActivity: {
    marginRight: 12,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginVertical: 15,
    paddingHorizontal: 5,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.light.destructive, // Pode precisar ajustar para themeColors
    marginTop: 10,
  },
  cancelButtonText: {
    color: Colors.light.destructive, // Pode precisar ajustar para themeColors
    fontWeight: "bold",
    fontSize: 16,
  },
});
