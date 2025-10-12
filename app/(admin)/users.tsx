import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import UserListItem from "@/components/user-list-item";
import { Colors } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers: User[] = [];
      snapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(fetchedUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchText) {
      return users;
    }
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [users, searchText]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <ThemedText>Carregando usuários...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <ThemedText type="title">Gerenciar Usuários</ThemedText>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon,
                color: themeColors.text,
              },
            ]}
            placeholder="Buscar por nome ou e-mail..."
            placeholderTextColor={themeColors.icon}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserListItem user={item} />}
          contentContainerStyle={styles.listContent}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  },
});
