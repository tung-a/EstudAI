import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const validateEmail = (text: string) => {
    if (text === "") {
      setIsEmailValid(true);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsEmailValid(emailRegex.test(text));
    }
    setEmail(text);
  };

  const handleSignIn = async () => {
    setError("");
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    if (!isEmailValid) {
      setError("Por favor, insira um email válido.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O redirecionamento será tratado pelo _layout principal
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        setError("Email ou senha inválidos.");
      } else {
        setError("Ocorreu um erro ao fazer login.");
      }
    } finally {
      setLoading(false);
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
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
            />
            <ThemedText type="title" style={styles.title}>
              Bem-vindo!
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Faça login para continuar
            </ThemedText>

            <View
              style={[
                styles.inputContainer,
                {
                  borderColor:
                    !isEmailValid && email.length > 0
                      ? Colors.light.destructive
                      : themeColors.icon,
                },
              ]}
            >
              <MaterialIcons name="email" size={20} color={themeColors.icon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Email"
                placeholderTextColor={themeColors.icon}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={validateEmail}
              />
            </View>
            {!isEmailValid && email.length > 0 && (
              <Text style={styles.validationErrorText}>
                Formato de email inválido.
              </Text>
            )}

            <View
              style={[styles.inputContainer, { borderColor: themeColors.icon }]}
            >
              <MaterialIcons name="lock" size={20} color={themeColors.icon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Senha"
                placeholderTextColor={themeColors.icon}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={24}
                  color={themeColors.icon}
                />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.formErrorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.accent }]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <Link href="/register" style={styles.link}>
              <ThemedText type="link">
                Não tem uma conta? Cadastre-se
              </ThemedText>
            </Link>
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
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 30,
    fontSize: 16,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 10,
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
  },
  formErrorText: {
    color: Colors.light.destructive,
    marginTop: 15,
    marginBottom: 5,
    textAlign: "center",
    fontWeight: "bold",
  },
  validationErrorText: {
    color: Colors.light.destructive,
    alignSelf: "flex-start",
    marginLeft: 5,
    marginBottom: 5,
  },
});
