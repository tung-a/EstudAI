import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const handleSignUp = async () => {
    setError("");
    if (!name || !email || !password || !confirmPassword) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

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
        age: age,
        school: school,
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setError("Este email já está em uso.");
      } else if (error.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError("Ocorreu um erro ao criar a conta.");
      }
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
          <ScrollView contentContainerStyle={styles.content}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
            />
            <ThemedText type="title" style={styles.title}>
              Crie sua Conta
            </ThemedText>

            <View
              style={[styles.inputContainer, { borderColor: themeColors.icon }]}
            >
              <MaterialIcons name="person" size={20} color={themeColors.icon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Nome Completo"
                placeholderTextColor={themeColors.icon}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View
              style={[styles.inputContainer, { borderColor: themeColors.icon }]}
            >
              <MaterialIcons name="school" size={20} color={themeColors.icon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Instituição de Ensino (Opcional)"
                placeholderTextColor={themeColors.icon}
                value={school}
                onChangeText={setSchool}
              />
            </View>
            <View
              style={[styles.inputContainer, { borderColor: themeColors.icon }]}
            >
              <MaterialIcons name="cake" size={20} color={themeColors.icon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Idade (Opcional)"
                placeholderTextColor={themeColors.icon}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>
            <View
              style={[styles.inputContainer, { borderColor: themeColors.icon }]}
            >
              <MaterialIcons name="email" size={20} color={themeColors.icon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Email"
                placeholderTextColor={themeColors.icon}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View
              style={[styles.inputContainer, { borderColor: themeColors.icon }]}
            >
              <MaterialIcons name="lock" size={20} color={themeColors.icon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Senha"
                placeholderTextColor={themeColors.icon}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <View
              style={[styles.inputContainer, { borderColor: themeColors.icon }]}
            >
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={themeColors.icon}
              />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Confirmar Senha"
                placeholderTextColor={themeColors.icon}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.accent }]}
              onPress={handleSignUp}
            >
              <Text style={styles.buttonText}>Criar Conta</Text>
            </TouchableOpacity>

            <Link href="/login" style={styles.link}>
              <ThemedText type="link">
                Já tem uma conta? Faça o login
              </ThemedText>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  title: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 8,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    paddingBottom: 20,
  },
  errorText: {
    color: Colors.light.destructive,
    marginTop: 10,
    textAlign: "center",
  },
});
