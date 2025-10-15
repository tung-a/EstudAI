import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatHeaderTitle } from "@/lib/dateUtils";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
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
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const handleSave = () => {
    if (!eventTitle || !eventTime || !eventDuration) {
      Alert.alert("Erro", "Preencha todos os campos.");
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
    onAddEvent({ title: eventTitle, time: eventTime, duration });
    // Limpa os campos após salvar
    setEventTitle("");
    setEventTime("");
    setEventDuration("");
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={isVisible}
      onRequestClose={onClose}
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
            placeholder="Título do Evento"
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
                {
                  color: themeColors.text,
                  flex: 1,
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
                {
                  color: themeColors.text,
                  flex: 1,
                  marginLeft: 10,
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.card,
                },
              ]}
              placeholderTextColor={themeColors.icon}
              value={eventDuration}
              onChangeText={setEventDuration}
              keyboardType="numeric"
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
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalDateText: { fontSize: 16, opacity: 0.8, marginBottom: 15 },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  timeRow: { flexDirection: "row", width: "100%" },
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
