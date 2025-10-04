import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const colorScheme = useColorScheme() ?? "light";

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "User created! You can now log in.");
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Registration Error", error.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Register</ThemedText>
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
        placeholder="Password"
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
        placeholder="Confirm Password"
        placeholderTextColor={Colors[colorScheme].icon}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
      <Link href="/login" style={styles.link}>
        <ThemedText type="link">Already have an account? Login</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 10,
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
  },
});
