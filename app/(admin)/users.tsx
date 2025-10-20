import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import UserListItem from "@/components/user-list-item"; // Assumindo que este componente está ok
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

    // Cria uma cópia antes de ordenar
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

  const roleFilters: { label: string; value: RoleFilter }[] = [
    { label: "Todos", value: "all" },
    { label: "Admins", value: "admin" },
    { label: "Usuários", value: "user" },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Gerenciar Usuários</ThemedText>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon + "30",
                color: themeColors.text,
              },
            ]}
            placeholder="Buscar por nome ou e-mail..."
            placeholderTextColor={themeColors.icon}
            value={searchText}
            onChangeText={setSearchText}
          />
          {/* Container de Filtros */}
          <View style={styles.filtersContainer}>
            {/* Botão Ordenar */}
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
              <ThemedText style={styles.sortButtonText}>Ordenar</ThemedText>
            </TouchableOpacity>

            {/* Filtro de Cargo como Grupo Segmentado */}
            <View
              style={[
                styles.roleFilterGroup, // Estilo do grupo
                {
                  borderColor: themeColors.icon + "30", // Borda externa
                },
              ]}
            >
              {roleFilters.map((filter, index) => (
                <TouchableOpacity
                  key={filter.value}
                  onPress={() => setRoleFilter(filter.value)}
                  // Aplicar estilos base e ativo
                  style={[
                    styles.roleFilterButtonSegmented,
                    {
                      backgroundColor:
                        roleFilter === filter.value
                          ? themeColors.accent
                          : themeColors.card,
                      // Adicionar borda direita a todos exceto o último
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
                      // Aplicar cor do texto base e ativa
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

        {/* Lista */}
        <FlatList
          data={filteredAndSortedUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserListItem user={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText style={styles.emptyListText}>
              Nenhum usuário encontrado com os filtros aplicados.
            </ThemedText>
          }
        />
      </SafeAreaView>

      {/* Modal de Ordenação */}
      <Modal
        animationType="fade"
        transparent
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)} // Fecha ao tocar fora
        >
          {/* Evita que o toque no conteúdo feche o modal */}
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: themeColors.card },
              ]}
            >
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Ordenar Por
              </ThemedText>
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
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}

// --- Estilos Atualizados ---
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
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 16,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12, // Espaço entre Ordenar e Grupo de Filtros
    // Remover flexWrap, o grupo de filtros agora é flex: 1
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8, // Voltando para borda normal
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 14,
  },
  // Estilo para o grupo segmentado
  roleFilterGroup: {
    flex: 1, // <<< Ocupa o espaço restante
    flexDirection: "row",
    borderRadius: 8, // Borda externa arredondada
    borderWidth: 1, // Borda externa
    overflow: "hidden", // Importante
  },
  // Estilo para cada botão dentro do grupo
  roleFilterButtonSegmented: {
    flex: 1, // <<< Faz os botões dividirem o espaço igualmente
    paddingVertical: 10,
    // paddingHorizontal: 10, // Padding horizontal pode ser ajustado se necessário
    alignItems: "center", // Centraliza o texto
    justifyContent: "center",
    // Borda direita será aplicada condicionalmente no JSX
  },
  // Separador não é mais um estilo de View, a borda está no botão
  // segmentSeparator: { ... },
  roleFilterText: {
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  roleFilterTextActive: {
    color: "#fff", // Cor do texto quando o botão está ativo
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  // --- Estilos do Modal (sem alterações) ---
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
    paddingVertical: 15,
    paddingHorizontal: 5,
    alignItems: "stretch",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  sortOptionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 2,
  },
  sortOptionText: {
    fontSize: 16,
  },
});
