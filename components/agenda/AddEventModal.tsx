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
  Modal,
  Platform,
  StyleSheet,
  Switch, // Importar Switch
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
  const [recommendContent, setRecommendContent] = useState(false); // Novo estado
  const [disciplinas, setDisciplinas] = useState<string[]>([]); // Lista de disciplinas
  const [disciplinasLoading, setDisciplinasLoading] = useState(false);
  const [disciplinaModalVisible, setDisciplinaModalVisible] = useState(false); // Modal para disciplinas

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
    // Validações existentes
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

    // Nova validação: disciplina necessária se recomendação estiver ativa
    if (recommendContent && !selectedDisciplina) {
      Alert.alert(
        "Disciplina Necessária",
        "Selecione uma disciplina para receber sugestões de estudo."
      );
      return;
    }

    onAddEvent({
      title: eventTitle,
      time: eventTime,
      duration: duration,
      disciplina: selectedDisciplina || undefined, // Passa a disciplina (ou undefined)
      recommend: recommendContent, // Passa a flag
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
    setDisciplinaModalVisible(false);
  };

  // Limpa campos ao fechar o modal principal
  const handleCloseModal = () => {
    setEventTitle("");
    setEventTime("");
    setEventDuration("");
    setSelectedDisciplina(null);
    setRecommendContent(false);
    onClose();
  };

  return (
    <>
      <Modal
        animationType="fade"
        transparent
        visible={isVisible}
        onRequestClose={handleCloseModal} // Usar handleCloseModal
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
          >
            <ThemedText type="subtitle">Adicionar Evento</ThemedText>
            <ThemedText style={styles.modalDateText}>
              {formatHeaderTitle(selectedDate)}
            </ThemedText>

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
            <View style={styles.timeRow}>
              <TextInput
                placeholder="Horário (HH:MM)"
                style={[
                  styles.input,
                  styles.timeInput, // Estilo específico
                  {
                    color: themeColors.text,
                    borderColor: themeColors.icon,
                    backgroundColor: themeColors.card,
                  },
                ]}
                placeholderTextColor={themeColors.icon}
                value={eventTime}
                onChangeText={setEventTime}
                keyboardType="numeric"
                maxLength={5}
              />
              <TextInput
                placeholder="Duração (min)"
                style={[
                  styles.input,
                  styles.timeInput, // Estilo específico
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

            {/* Seletor de Disciplina */}
            <TouchableOpacity
              style={[
                styles.selectorButton,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.card,
                  opacity: disciplinasLoading ? 0.6 : 1,
                },
              ]}
              onPress={() => setDisciplinaModalVisible(true)}
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
                  {selectedDisciplina || "Selecionar Disciplina (opcional)"}
                </Text>
              )}
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color={themeColors.icon}
              />
            </TouchableOpacity>

            {/* Switch para Recomendar */}
            <View style={styles.switchContainer}>
              <ThemedText>Sugerir tópicos de estudo?</ThemedText>
              <Switch
                value={recommendContent}
                onValueChange={setRecommendContent}
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

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.accent }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCloseModal} // Usar handleCloseModal
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal para Selecionar Disciplina */}
      <Modal
        visible={disciplinaModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDisciplinaModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: themeColors.card },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Escolha a Disciplina
              </Text>
              <TouchableOpacity
                onPress={() => setDisciplinaModalVisible(false)}
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
                      styles.modalOption,
                      {
                        borderColor: themeColors.icon + "50",
                        backgroundColor:
                          selectedDisciplina === item
                            ? themeColors.accent
                            : "transparent",
                      },
                    ]}
                    onPress={() => handleSelectDisciplina(item)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        {
                          color:
                            selectedDisciplina === item
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
                    style={[styles.modalEmptyText, { color: themeColors.icon }]}
                  >
                    Nenhuma disciplina encontrada.
                  </Text>
                }
                style={styles.modalContentList}
                contentContainerStyle={styles.modalContentContainer}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)", // Fundo mais escuro
  },
  modalContent: {
    width: "90%",
    padding: 20,
    borderRadius: 15, // Mais arredondado
    alignItems: "center",
    shadowColor: "#000", // Sombra
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalDateText: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 20, // Mais espaço
    fontWeight: "500",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 10, // Menos arredondado que o modal
    marginVertical: 8, // Ajuste vertical
    paddingHorizontal: 15,
    fontSize: 16,
  },
  timeRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  timeInput: {
    flex: 1, // Divide o espaço igualmente
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
    marginVertical: 15, // Espaçamento
    paddingHorizontal: 5,
  },
  button: {
    paddingVertical: 14, // Altura do botão
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 15, // Espaço acima
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "transparent", // Fundo transparente
    borderWidth: 1,
    borderColor: Colors.light.destructive, // Cor destrutiva (ajustar para themeColors se necessário)
    marginTop: 10,
  },
  cancelButtonText: {
    color: Colors.light.destructive, // Cor destrutiva
    fontWeight: "bold",
    fontSize: 16,
  },
  // Estilos para o Modal de Seleção de Disciplina
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalContainer: {
    borderRadius: 16,
    maxHeight: "80%", // Limita altura
    paddingTop: 16, // Padding só no topo inicialmente
    overflow: "hidden", // Garante bordas arredondadas
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContentList: {
    // Estilo para o FlatList/ScrollView
    maxHeight: 400, // Altura máxima para scroll
  },
  modalContentContainer: {
    // Padding para o conteúdo da lista
    paddingBottom: 16,
    paddingHorizontal: 12,
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
  modalLoaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180, // Garante espaço para o loader
    padding: 16, // Padding interno
  },
  modalEmptyText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 20,
    opacity: 0.7,
  },
});