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
  ActivityIndicator,
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(text));
    setEmail(text);
  };

  const getPasswordStrength = () => {
    if (password.length === 0) {
      return { strength: "", color: "#d9534f" };
    }
    if (password.length < 6) {
      return { strength: "Fraca", color: "#f0ad4e" };
    }
    if (password.length < 10) {
      return { strength: "Média", color: "#5bc0de" };
    }
    return { strength: "Forte", color: "#5cb85c" };
  };

  const handleSignUp = async () => {
    setError("");
    if (!name || !email || !password || !confirmPassword) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (!isEmailValid) {
      setError("Por favor, insira um email válido.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
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
      });

      router.replace("/(auth)/welcome");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setError("Este email já está em uso.");
      } else {
        setError("Ocorreu um erro ao criar a conta.");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
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
              style={[
                styles.inputContainer,
                {
                  borderColor:
                    !isEmailValid && email.length > 0
                      ? "red"
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
              <Text style={styles.errorText}>Formato de email inválido.</Text>
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
            <View style={styles.passwordRequirementContainer}>
              <Text style={{ color: themeColors.icon }}>
                (mínimo 6 caracteres)
              </Text>
              {passwordStrength.strength.length > 0 && (
                <Text style={{ color: passwordStrength.color }}>
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.accent }]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Criar Conta</Text>
              )}
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
    alignSelf: "flex-start",
    marginLeft: 5,
    marginBottom: 5,
  },
  passwordRequirementContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    marginBottom: 10,
  },
});
