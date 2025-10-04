import { HelloWave } from "@/components/hello-wave";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, View } from "react-native";
import { auth } from "../../firebaseConfig";

export default function HomeScreen() {
  const userName = auth.currentUser?.displayName || "Usuário";

  return (
    <ThemedView style={styles.container}>
      <View style={styles.titleContainer}>
        <ThemedText type="title">Bem vindo de volta, </ThemedText>
        <HelloWave />
      </View>
      <ThemedText type="title">{userName}!</ThemedText>
      <ThemedText style={styles.subtitle}>
        Pronto para organizar suas tarefas?
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "gray",
    marginTop: 10,
  },
});
