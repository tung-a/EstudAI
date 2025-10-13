import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import UserListItem from "@/components/user-list-item";
import { Colors } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  age?: string;
  school?: string;
  goal?: string;
}

type SortOption = "name_asc" | "name_desc" | "email_asc" | "email_desc";
type RoleFilter = "all" | "admin" | "user";

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortModalVisible, setSortModalVisible] = useState(false);

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

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    // Filtro por texto
    if (searchText) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filtro por cargo
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Cria uma cópia antes de ordenar para garantir a re-renderização
    const sortable = [...filtered];

    // Ordenação
    return sortable.sort((a, b) => {
      switch (sortOption) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "email_asc":
          return a.email.localeCompare(b.email);
        case "email_desc":
          return b.email.localeCompare(a.email);
        default:
          return 0;
      }
    });
  }, [users, searchText, sortOption, roleFilter]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <ThemedText>Carregando usuários...</ThemedText>
      </ThemedView>
    );
  }

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: "Nome (A-Z)", value: "name_asc" },
    { label: "Nome (Z-A)", value: "name_desc" },
    { label: "Email (A-Z)", value: "email_asc" },
    { label: "Email (Z-A)", value: "email_desc" },
  ];

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
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[
                styles.sortButton,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.card,
                },
              ]}
              onPress={() => setSortModalVisible(true)}
            >
              <MaterialIcons name="sort" size={20} color={themeColors.text} />
              <ThemedText>Ordenar</ThemedText>
            </TouchableOpacity>
            <View
              style={[
                styles.roleFilterContainer,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.card,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setRoleFilter("all")}
                style={[
                  styles.roleFilterButton,
                  roleFilter === "all" && {
                    backgroundColor: themeColors.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleFilterText,
                    { color: themeColors.text },
                    roleFilter === "all" && { color: "#fff" },
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRoleFilter("admin")}
                style={[
                  styles.roleFilterButton,
                  roleFilter === "admin" && {
                    backgroundColor: themeColors.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleFilterText,
                    { color: themeColors.text },
                    roleFilter === "admin" && { color: "#fff" },
                  ]}
                >
                  Admins
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRoleFilter("user")}
                style={[
                  styles.roleFilterButton,
                  roleFilter === "user" && {
                    backgroundColor: themeColors.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleFilterText,
                    { color: themeColors.text },
                    roleFilter === "user" && { color: "#fff" },
                  ]}
                >
                  Usuários
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <FlatList
          data={filteredAndSortedUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserListItem user={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyListText}>
              Nenhum usuário encontrado.
            </ThemedText>
          }
        />
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: themeColors.card }]}
          >
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.sortOptionButton}
                onPress={() => {
                  setSortOption(option.value);
                  setSortModalVisible(false);
                }}
              >
                <ThemedText
                  style={
                    sortOption === option.value && {
                      color: themeColors.accent,
                      fontWeight: "bold",
                    }
                  }
                >
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleFilterContainer: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  roleFilterButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  roleFilterText: {
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 20,
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    opacity: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: 12,
    padding: 10,
  },
  sortOptionButton: {
    padding: 16,
  },
});
