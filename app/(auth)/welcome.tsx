import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
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
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const handleContinue = async () => {
    const user = auth.currentUser;
    if (user) {
      setLoading(true);
      try {
        await updateDoc(doc(db, "users", user.uid), {
          age: age,
          school: school,
        });
        router.replace("/(tabs)");
      } catch (error: any) {
        Alert.alert("Erro", "Não foi possível salvar os dados.", error);
        setLoading(false);
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

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.accent }]}
              onPress={handleContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continuar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={() => router.replace("/(tabs)")}
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
