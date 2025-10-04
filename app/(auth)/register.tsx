import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [school, setSchool] = useState("");
  const colorScheme = useColorScheme() ?? "light";

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert("Erro", "Por favor, preencha nome, email e senha.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        age: age,
        school: school,
      });

      Alert.alert("Sucesso", "Conta criada! Você já pode fazer o login.");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Erro no Cadastro", error.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title">Crie sua Conta</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              color: Colors[colorScheme].text,
              borderColor: Colors[colorScheme].icon,
              backgroundColor: Colors[colorScheme].background,
            },
          ]}
          placeholder="Nome Completo"
          placeholderTextColor={Colors[colorScheme].icon}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: Colors[colorScheme].text,
              borderColor: Colors[colorScheme].icon,
              backgroundColor: Colors[colorScheme].background,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={Colors[colorScheme].icon}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: Colors[colorScheme].text,
              borderColor: Colors[colorScheme].icon,
              backgroundColor: Colors[colorScheme].background,
            },
          ]}
          placeholder="Idade"
          placeholderTextColor={Colors[colorScheme].icon}
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: Colors[colorScheme].text,
              borderColor: Colors[colorScheme].icon,
              backgroundColor: Colors[colorScheme].background,
            },
          ]}
          placeholder="Escola"
          placeholderTextColor={Colors[colorScheme].icon}
          value={school}
          onChangeText={setSchool}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: Colors[colorScheme].text,
              borderColor: Colors[colorScheme].icon,
              backgroundColor: Colors[colorScheme].background,
            },
          ]}
          placeholder="Senha"
          placeholderTextColor={Colors[colorScheme].icon}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={[
            styles.input,
            {
              color: Colors[colorScheme].text,
              borderColor: Colors[colorScheme].icon,
              backgroundColor: Colors[colorScheme].background,
            },
          ]}
          placeholder="Confirmar Senha"
          placeholderTextColor={Colors[colorScheme].icon}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Criar Conta</Text>
        </TouchableOpacity>
        <Link href="/login" style={styles.link}>
          <ThemedText type="link">Já tem uma conta? Faça o login</ThemedText>
        </Link>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    paddingBottom: 20, // Espaço extra no final
  },
});
