import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logSignUp } from "@/lib/analytics";
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
  const [age, setAge] = useState("");
  const [school, setSchool] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const router = useRouter();
  const { name, email, password } = useLocalSearchParams<{
    name: string;
    email: string;
    password: string;
  }>();

  const handleCompleteRegistration = async () => {
    if (!name || !email || !password) {
      Alert.alert(
        "Erro",
        "Dados de registro não encontrados. Por favor, volte e tente novamente.",
        [{ text: "Voltar", onPress: () => router.back() }]
      );
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        age: age || "",
        school: school || "",
        goal: goal || "",
      });

      logSignUp();
    } catch (error: any) {
      setLoading(false);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Email em Uso",
          "Este email já está cadastrado. Por favor, volte e tente fazer login.",
          [{ text: "Voltar", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Erro",
          "Não foi possível criar sua conta: " + error.message
        );
      }
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
            <ThemedText type="title" style={styles.title}>
              Só mais alguns detalhes...
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Nos ajude a personalizar sua experiência (opcional).
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
              placeholder="Sua idade"
              placeholderTextColor={themeColors.icon}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
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
              placeholder="Sua instituição de ensino"
              placeholderTextColor={themeColors.icon}
              value={school}
              onChangeText={setSchool}
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
              placeholder="Qual seu objetivo? (Ex: ENEM, FUVEST)"
              placeholderTextColor={themeColors.icon}
              value={goal}
              onChangeText={setGoal}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.accent }]}
              onPress={handleCompleteRegistration}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Concluir Cadastro</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleCompleteRegistration}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: themeColors.accent }]}>
                Pular
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
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
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
  skipButton: {
    backgroundColor: "transparent",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
