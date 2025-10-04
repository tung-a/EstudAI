// app/(tabs)/index.tsx

import { useState } from "react";
import { Alert, Button, StyleSheet, TextInput } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { addDoc, collection } from "firebase/firestore";
// Verifique o caminho. Estando em app/(tabs), o caminho correto para a raiz é '../../'
import { router } from "expo-router";
import { auth, db } from "../../firebaseConfig";

export default function HomeScreen() {
  const [newTask, setNewTask] = useState("");

  const handleAddTask = async () => {
    // Adicionamos uma verificação para garantir que 'db' e 'auth' não são undefined
    if (!auth || !db) {
      Alert.alert(
        "Erro",
        "A conexão com o Firebase ainda não foi estabelecida. Tente novamente."
      );
      return;
    }

    const user = auth.currentUser;

    // Se você não está a forçar o login, é melhor assumir que o user pode ser nulo por agora
    // No exemplo anterior, usámos signInAnonymously, então deve haver um user.
    if (!user) {
      Alert.alert(
        "Aviso",
        "Nenhum utilizador anónimo encontrado. A tentar reconectar..."
      );
      router.replace("/(auth)/login");
      return;
    }
    if (newTask.trim() === "") {
      Alert.alert("Atenção", "Por favor, escreva uma tarefa.");
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
        title: newTask,
        completed: false,
        userId: user.uid,
        createdAt: new Date(),
      });
      Alert.alert("Sucesso!", "Tarefa adicionada.");
      setNewTask("");
    } catch (e) {
      console.error("Erro ao adicionar documento: ", e);
      Alert.alert("Erro", "Não foi possível adicionar a tarefa.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Minhas Tarefas</ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Escreva uma nova tarefa..."
        value={newTask}
        onChangeText={setNewTask}
      />
      <Button title="Adicionar Tarefa" onPress={handleAddTask} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
  input: {
    height: 40,
    width: "100%",
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
});
