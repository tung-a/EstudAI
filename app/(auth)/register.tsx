import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const router = useRouter();

  const validateEmail = (text: string) => {
    if (text === "") {
      setIsEmailValid(true);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsEmailValid(emailRegex.test(text));
    }
    setEmail(text);
  };

  const getPasswordStrength = () => {
    if (password.length === 0)
      return { strength: "", color: themeColors.destructive };
    if (password.length < 6) return { strength: "Fraca", color: "#f0ad4e" };
    if (password.length < 10) return { strength: "Média", color: "#5bc0de" };
    return { strength: "Forte", color: "#5cb85c" };
  };

  const handleNavigateToWelcome = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (!isEmailValid) {
      Alert.alert("Erro", "Por favor, insira um email válido.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    router.push({
      pathname: "/(auth)/welcome",
      params: { name, email, password },
    });
  };

  const passwordStrength = getPasswordStrength();

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
              <MaterialIcons
                name="person-outline"
                size={20}
                color={themeColors.icon}
              />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Nome Completo"
                placeholderTextColor={themeColors.icon}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  borderColor:
                    !isEmailValid && email.length > 0
                      ? themeColors.destructive
                      : themeColors.icon,
                },
              ]}
            >
              <MaterialIcons
                name="mail-outline"
                size={20}
                color={themeColors.icon}
              />
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
              <Text
                style={[styles.errorText, { color: themeColors.destructive }]}
              >
                Formato de email inválido.
              </Text>
            )}

            <View
              style={[styles.inputContainer, { borderColor: themeColors.icon }]}
            >
              {/* CORREÇÃO 1: Padronizando ícone para lock-outline */}
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={themeColors.icon}
              />
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

            {/* CORREÇÃO 2: Alinhamento do texto de ajuda */}
            <View style={styles.passwordRequirementContainer}>
              <Text
                style={{ color: themeColors.icon, fontSize: 12, opacity: 0.8 }}
              >
                (mínimo 6 caracteres)
              </Text>
              {passwordStrength.strength.length > 0 && (
                <Text
                  style={{
                    color: passwordStrength.color,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  Força: {passwordStrength.strength}
                </Text>
              )}
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
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility-off" : "visibility"}
                  size={24}
                  color={themeColors.icon}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.accent }]}
              onPress={handleNavigateToWelcome}
            >
              <Text style={styles.buttonText}>Continuar</Text>
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
    flexGrow: 1, // Garante que o scroll funcione bem
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60, // Deixa a logo redonda se for quadrada, mais místico
  },
  title: {
    marginBottom: 25,
    fontSize: 28,
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
    marginTop: 25,
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
    alignSelf: "flex-start",
    marginLeft: 16, // Alinha com o texto do input (padding 15 + 1 borda)
    marginBottom: 5,
    fontSize: 12,
  },
  passwordRequirementContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 16, // Aumentado de 5 para 16 para alinhar com o texto do input
    marginBottom: 10,
  },
});
