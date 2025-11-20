import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatHeaderTitle } from "@/lib/dateUtils";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Switch,
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
    energy?: string;
    recommend?: boolean;
  }) => void;
  selectedDate: string;
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
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null);
  const [recommendContent, setRecommendContent] = useState(false);
  const [energies, setEnergies] = useState<string[]>([]);
  const [energiesLoading, setEnergiesLoading] = useState(false);
  const [showEnergyList, setShowEnergyList] = useState(false);

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  // --- MÁSCARA DE HORÁRIO AUTOMÁTICA ---
  const handleTimeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    }

    setEventTime(formatted);
  };
  // -------------------------------------

  useEffect(() => {
    let isMounted = true;
    const fetchEnergies = async () => {
      setEnergiesLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "cristais_propriedades"));
        if (!isMounted) return;

        // Fallback para coleção antiga se a nova estiver vazia
        const sourceDocs = snapshot.empty
          ? (await getDocs(collection(db, "conteudo_disciplinas"))).docs
          : snapshot.docs;

        const loadedItems = sourceDocs
          .map((doc) => {
            const data = doc.data();
            return data.nome || data.disciplina;
          })
          .filter(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0
          )
          .sort((a, b) => a.localeCompare(b, "pt-BR"));

        setEnergies(loadedItems);
      } catch (error) {
        console.error("Erro ao carregar energias:", error);
      } finally {
        if (isMounted) setEnergiesLoading(false);
      }
    };
    fetchEnergies();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = () => {
    if (!eventTitle || !eventTime || !eventDuration) {
      Alert.alert("Atenção", "Preencha a intenção, horário e duração.");
      return;
    }
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(eventTime)) {
      Alert.alert("Horário Inválido", "Use o formato HH:MM.");
      return;
    }
    const duration = parseInt(eventDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert("Duração Inválida", "Insira um tempo válido em minutos.");
      return;
    }

    // Se pediu recomendação, a energia é obrigatória
    if (recommendContent && !selectedEnergy) {
      Alert.alert(
        "Foco Necessário",
        "Selecione uma energia para o Oráculo gerar sua leitura."
      );
      return;
    }

    setShowEnergyList(false);
    onAddEvent({
      title: eventTitle,
      time: eventTime,
      duration: duration,
      energy: selectedEnergy || undefined,
      recommend: recommendContent,
    });

    resetFields();
  };

  const resetFields = () => {
    setEventTitle("");
    setEventTime("");
    setEventDuration("");
    setSelectedEnergy(null);
    setRecommendContent(false);
  };

  const handleCloseModal = () => {
    setShowEnergyList(false);
    resetFields();
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={isVisible}
      onRequestClose={handleCloseModal}
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
          {showEnergyList ? (
            <View style={styles.inlineListContainer}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                  Canalizar Energia
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEnergyList(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons
                    name="close"
                    size={22}
                    color={themeColors.icon}
                  />
                </TouchableOpacity>
              </View>
              {energiesLoading ? (
                <View style={styles.modalLoaderContainer}>
                  <ActivityIndicator size="large" color={themeColors.accent} />
                </View>
              ) : (
                <FlatList
                  data={energies}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.modalOption,
                        {
                          borderColor: themeColors.icon + "40",
                          backgroundColor:
                            selectedEnergy === item
                              ? themeColors.accent + "20"
                              : "transparent",
                        },
                      ]}
                      onPress={() => {
                        setSelectedEnergy(item);
                        setShowEnergyList(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          { color: themeColors.text },
                        ]}
                      >
                        {item}
                      </Text>
                      {selectedEnergy === item && (
                        <MaterialIcons
                          name="check"
                          size={16}
                          color={themeColors.accent}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.modalContentList}
                  contentContainerStyle={styles.modalContentContainer}
                />
              )}
            </View>
          ) : (
            <>
              <View style={styles.headerContainer}>
                <MaterialIcons
                  name="auto-awesome"
                  size={24}
                  color={themeColors.accent}
                />
                <ThemedText type="subtitle" style={{ marginLeft: 8 }}>
                  Novo Ritual
                </ThemedText>
              </View>

              <ThemedText style={styles.modalDateText}>
                {formatHeaderTitle(selectedDate)}
              </ThemedText>

              <TextInput
                placeholder="Intenção (ex: Meditação, Yoga)"
                style={[
                  styles.input,
                  {
                    color: themeColors.text,
                    borderColor: themeColors.icon + "50",
                    backgroundColor: themeColors.card,
                  },
                ]}
                placeholderTextColor={themeColors.icon + "80"}
                value={eventTitle}
                onChangeText={setEventTitle}
              />

              <View style={styles.timeRow}>
                <TextInput
                  placeholder="Horário"
                  style={[
                    styles.input,
                    styles.timeInput,
                    {
                      color: themeColors.text,
                      borderColor: themeColors.icon + "50",
                      backgroundColor: themeColors.card,
                    },
                  ]}
                  placeholderTextColor={themeColors.icon + "80"}
                  value={eventTime}
                  onChangeText={handleTimeChange}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <TextInput
                  placeholder="Minutos"
                  style={[
                    styles.input,
                    styles.timeInput,
                    {
                      color: themeColors.text,
                      borderColor: themeColors.icon + "50",
                      backgroundColor: themeColors.card,
                      marginLeft: 10,
                    },
                  ]}
                  placeholderTextColor={themeColors.icon + "80"}
                  value={eventDuration}
                  onChangeText={setEventDuration}
                  keyboardType="numeric"
                />
              </View>

              {/* SELETOR DE ENERGIA (AGORA SEMPRE VISÍVEL) */}
              <TouchableOpacity
                style={[
                  styles.selectorButton,
                  {
                    borderColor: themeColors.icon + "50",
                    backgroundColor: themeColors.card,
                  },
                ]}
                onPress={() => setShowEnergyList(true)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    {
                      color: selectedEnergy
                        ? themeColors.text
                        : themeColors.icon,
                    },
                  ]}
                >
                  {selectedEnergy || "Escolher Cristal/Energia (Opcional)"}
                </Text>
                <MaterialIcons
                  name="arrow-drop-down"
                  size={24}
                  color={themeColors.icon}
                />
              </TouchableOpacity>

              {/* SWITCH DE RECOMENDAÇÃO */}
              <View style={styles.switchContainer}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 14, fontWeight: "600" }}>
                    Invocação do Oráculo
                  </ThemedText>
                  <ThemedText style={{ fontSize: 11, opacity: 0.6 }}>
                    Receber orientação da IA para este ritual?
                  </ThemedText>
                </View>
                <Switch
                  value={recommendContent}
                  onValueChange={setRecommendContent}
                  trackColor={{ false: "#767577", true: themeColors.accent }}
                  thumbColor={"#f4f3f4"}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { borderColor: themeColors.destructive },
                  ]}
                  onPress={handleCloseModal}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: themeColors.destructive },
                    ]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: themeColors.accent },
                  ]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>Manifestar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(20, 0, 30, 0.7)",
  },
  modalContent: {
    width: "85%",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  inlineListContainer: { width: "100%", maxHeight: 400 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
  },
  modalTitle: { fontSize: 18, fontWeight: "600" },
  modalCloseButton: { padding: 4 },
  modalLoaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    padding: 16,
  },
  modalContentList: { width: "100%" },
  modalContentContainer: { paddingBottom: 16 },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  modalOptionText: { fontSize: 15, fontWeight: "500" },
  modalEmptyText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 20,
    opacity: 0.7,
  },
  modalDateText: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  timeRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  timeInput: { flex: 1, textAlign: "center" },
  selectorButton: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: { fontSize: 15, flex: 1, marginRight: 8 },
  selectorActivity: { marginRight: 12 },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginVertical: 12,
    paddingHorizontal: 5,
  },
  buttonRow: { flexDirection: "row", gap: 15, marginTop: 20, width: "100%" },
  button: {
    paddingVertical: 14,
    borderRadius: 16,
    flex: 1,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  cancelButton: { backgroundColor: "transparent", borderWidth: 1 },
  cancelButtonText: { fontWeight: "bold", fontSize: 16 },
});
