import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logSignUp } from "@/lib/analytics";
import { getSunSign, parseDateString } from "@/lib/astrology"; // <--- Importar a lógica nova
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const router = useRouter();
  const { name, email, password } = useLocalSearchParams<{
    name: string;
    email: string;
    password: string;
  }>();

  // --- Funções de Formatação (Máscaras) ---

  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(
        2,
        4
      )}/${cleaned.slice(4, 8)}`;
    }

    setBirthDate(formatted);
  };

  const handleTimeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    }

    setBirthTime(formatted);
  };

  // -----------------------------------------

  const handleCompleteRegistration = async () => {
    if (!name || !email || !password) {
      Alert.alert(
        "Erro",
        "Dados de registro perdidos. Volte e tente novamente."
      );
      return;
    }

    if (birthDate.length !== 10) {
      Alert.alert("Data Inválida", "Preencha a data no formato DD/MM/AAAA");
      return;
    }

    // 1. Calcular o Signo antes de enviar
    const parsedDate = parseDateString(birthDate);
    if (!parsedDate) {
      Alert.alert("Data Inválida", "Data de nascimento inválida.");
      return;
    }
    const sign = getSunSign(parsedDate.day, parsedDate.month);

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // 2. Salvar com o Signo calculado
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        birthDate: birthDate || "",
        birthTime: birthTime || "",
        birthPlace: birthPlace || "",
        role: "user",
        zodiacSign: sign, // <--- Salva o signo calculado (ex: "Áries")
        // Campos adicionais para futuro cálculo completo (Lua/Ascendente)
        astrologyData: {
          sun: sign,
          moon: null, // Requer cálculo complexo/API
          ascendant: null, // Requer cálculo complexo/API
        },
      });

      logSignUp();
      // O redirecionamento automático ocorre no _layout.tsx
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Erro", "Não foi possível criar sua conta: " + error.message);
      console.error(error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <View style={styles.content}>
            <MaterialIcons
              name="auto-awesome"
              size={60}
              color={themeColors.accent}
              style={{ marginBottom: 20 }}
            />

            <ThemedText type="title" style={styles.title}>
              Bem-vindo ao Universo
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Para alinhar suas energias, precisamos dos seus dados astrais.
            </ThemedText>

            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text,
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.card,
                },
              ]}
              placeholder="Data de Nascimento (DD/MM/AAAA)"
              placeholderTextColor={themeColors.icon}
              value={birthDate}
              onChangeText={handleDateChange}
              keyboardType="number-pad"
              maxLength={10}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text,
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.card,
                },
              ]}
              placeholder="Horário de Nascimento (HH:MM)"
              placeholderTextColor={themeColors.icon}
              value={birthTime}
              onChangeText={handleTimeChange}
              keyboardType="number-pad"
              maxLength={5}
            />

            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text,
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.card,
                },
              ]}
              placeholder="Cidade de Nascimento"
              placeholderTextColor={themeColors.icon}
              value={birthPlace}
              onChangeText={setBirthPlace}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.accent }]}
              onPress={handleCompleteRegistration}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar Jornada</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleCompleteRegistration}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: themeColors.accent }]}>
                Pular e preencher depois
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { marginBottom: 8, textAlign: "center" },
  subtitle: {
    marginBottom: 30,
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  skipButton: { backgroundColor: "transparent", marginTop: 10 },
  buttonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
});
