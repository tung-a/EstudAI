import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import UserListItem, { User } from "@/components/user-list-item"; // Importa User do componente atualizado
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

    if (searchText) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    const sortable = [...filtered];

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
        <ThemedText>Consultando registros...</ThemedText>
      </ThemedView>
    );
  }

  const roleFilters: { label: string; value: RoleFilter }[] = [
    { label: "Todos", value: "all" },
    { label: "Mestres", value: "admin" },
    { label: "Viajantes", value: "user" },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <ThemedText type="title">Comunidade</ThemedText>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon + "30",
                color: themeColors.text,
              },
            ]}
            placeholder="Buscar alma por nome ou e-mail..."
            placeholderTextColor={themeColors.icon + "80"}
            value={searchText}
            onChangeText={setSearchText}
          />

          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[
                styles.sortButton,
                {
                  borderColor: themeColors.icon + "30",
                  backgroundColor: themeColors.card,
                },
              ]}
              onPress={() => setSortModalVisible(true)}
            >
              <MaterialIcons name="sort" size={20} color={themeColors.icon} />
            </TouchableOpacity>

            <View
              style={[
                styles.roleFilterGroup,
                { borderColor: themeColors.icon + "30" },
              ]}
            >
              {roleFilters.map((filter, index) => (
                <TouchableOpacity
                  key={filter.value}
                  onPress={() => setRoleFilter(filter.value)}
                  style={[
                    styles.roleFilterButtonSegmented,
                    {
                      backgroundColor:
                        roleFilter === filter.value
                          ? themeColors.accent
                          : themeColors.card,
                      borderRightWidth:
                        index < roleFilters.length - 1
                          ? StyleSheet.hairlineWidth
                          : 0,
                      borderRightColor: themeColors.icon + "30",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleFilterText,
                      {
                        color:
                          roleFilter === filter.value
                            ? "#fff"
                            : themeColors.text,
                      },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
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
              Nenhum viajante encontrado.
            </ThemedText>
          }
        />
      </SafeAreaView>

      {/* Modal de Ordenação Mantido Similar */}
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
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Ordenar Por
            </ThemedText>
            {[
              { label: "Nome (A-Z)", value: "name_asc" },
              { label: "Nome (Z-A)", value: "name_desc" },
              { label: "Email (A-Z)", value: "email_asc" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.sortOptionButton}
                onPress={() => {
                  setSortOption(option.value as SortOption);
                  setSortModalVisible(false);
                }}
              >
                <ThemedText
                  style={[
                    styles.sortOptionText,
                    sortOption === option.value && {
                      color: themeColors.accent,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {option.label}
                </ThemedText>
                {sortOption === option.value && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={themeColors.accent}
                  />
                )}
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
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 16,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  sortButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  roleFilterGroup: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    height: 42,
  },
  roleFilterButtonSegmented: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  roleFilterText: { fontWeight: "600", fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  emptyListText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    opacity: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalContent: {
    width: "100%",
    maxWidth: 350,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  modalTitle: { textAlign: "center", marginBottom: 15 },
  sortOptionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  sortOptionText: { fontSize: 16 },
});
