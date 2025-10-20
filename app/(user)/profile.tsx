// app/(user)/profile.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
// useAuth não é mais necessário aqui se não precisarmos do timezone
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react"; // Removido useMemo se não for mais usado
import {
  ActivityIndicator,
  Alert,
  FlatList, // Pode remover se não usar mais (curso usa FlatList agora)
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UserProfile = {
  name: string;
  email: string;
  age?: string;
  school?: string;
  goal?: string;
  // timezone?: string; // Removido do tipo
};

// Remover a função getTimezones se não for mais usada em nenhum lugar

export default function ProfileScreen() {
  // Remover estados relacionados ao timezone
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  // Remover: timezoneModalVisible, timezoneSearch, savingTimezone, currentTimezone

  // Estados temporários para edição (sem timezone)
  const [editableAge, setEditableAge] = useState("");
  const [editableSchool, setEditableSchool] = useState("");
  const [editableGoal, setEditableGoal] = useState("");
  // Remover: editableTimezone

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  // Efeito para buscar perfil (sem lógica de timezone)
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<UserProfile, "timezone">; // Ajusta o tipo
          setProfile(data);
          setEditableAge(data.age || "");
          setEditableSchool(data.school || "");
          setEditableGoal(data.goal || "");
        } else {
          setProfile({
            name: user.displayName || "Usuário",
            email: user.email || "",
            // timezone removido
          });
          setEditableAge("");
          setEditableSchool("");
          setEditableGoal("");
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    // Apenas checa se currentUser existe, useAuth não é mais necessário aqui
    if (auth.currentUser) {
      fetchUserProfile();
    } else {
      setLoading(false); // Garante que loading termine se não houver usuário
    }
    // Remove authUser da dependência
  }, []); // Executa apenas uma vez ao montar

  // Efeito para resetar edição (inalterado)
  useEffect(() => {
    if (!isEditingInfo) {
      setCourseModalVisible(false);
      // Reseta campos editáveis para os valores atuais do perfil ao cancelar
      if (profile) {
        setEditableAge(profile.age || "");
        setEditableSchool(profile.school || "");
        setEditableGoal(profile.goal || "");
      }
    }
  }, [isEditingInfo, profile]);

  // Efeito para buscar cursos (lógica inalterada)
  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "prioridades_cursos"));
        if (!isMounted) return;
        const loadedCourses = snapshot.docs
          .map((courseDoc) => courseDoc.data()?.nomeCurso)
          .filter(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0
          )
          .map((name) => name.trim())
          .reduce<string[]>((acc, name) => {
            const lower = name.toLowerCase();
            if (!acc.some((existing) => existing.toLowerCase() === lower)) {
              acc.push(name);
            }
            return acc;
          }, [])
          .sort((a, b) => a.localeCompare(b, "pt-BR"));
        setCourses(loadedCourses);
      } catch (error) {
        console.error("Erro ao carregar cursos:", error);
        if (isMounted) {
          Alert.alert("Erro", "Não foi possível carregar a lista de cursos.");
        }
      } finally {
        if (isMounted) {
          setCoursesLoading(false);
        }
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handler de Logout (lógica inalterada)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Navegação tratada pelo _layout raiz
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível fazer o logout.", error);
    }
  };

  // Handler para salvar (sem timezone)
  const handleSaveInfo = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        age: editableAge,
        school: editableSchool,
        goal: editableGoal,
        // timezone: editableTimezone, // Removido
      });
      // Atualiza estado local otimisticamente
      setProfile((prevProfile) => ({
        ...prevProfile!,
        age: editableAge,
        school: editableSchool,
        goal: editableGoal,
        // timezone removido
      }));
      setIsEditingInfo(false);
      Alert.alert("Sucesso", "Informações atualizadas!");
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível salvar as alterações.", error);
    } finally {
      setSaving(false);
    }
  };

  // Handler para selecionar curso (inalterado)
  const handleSelectCourse = (courseName: string) => {
    setEditableGoal(courseName);
    setCourseModalVisible(false);
  };

  // Remover handler handleSelectTimezone

  // Indicador de loading inicial
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[styles.avatar, { backgroundColor: themeColors.card }]}
            >
              <MaterialIcons name="person" size={60} color={themeColors.icon} />
            </View>
            <ThemedText type="title" style={styles.userName}>
              {profile?.name || "Usuário"}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{profile?.email}</ThemedText>
          </View>

          {/* Card de Informações (sem fuso horário) */}
          {profile && (
            <ThemedView
              lightColor={Colors.light.card}
              darkColor={Colors.dark.card}
              style={styles.infoCard}
            >
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle">Informações</ThemedText>
                {!isEditingInfo && (
                  <TouchableOpacity onPress={() => setIsEditingInfo(true)}>
                    <MaterialIcons
                      name="edit"
                      size={24}
                      color={themeColors.accent}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {isEditingInfo ? (
                <>
                  {/* Linha Curso - Editável */}
                  <View style={styles.infoRow}>
                    <MaterialIcons
                      name="school"
                      size={20}
                      color={themeColors.icon}
                      style={styles.infoIcon}
                    />
                    <ThemedText style={styles.label}>Curso:</ThemedText>
                    <TouchableOpacity
                      style={[
                        styles.selectorButton,
                        {
                          borderColor: themeColors.icon,
                          opacity: coursesLoading ? 0.6 : 1,
                        },
                      ]}
                      onPress={() => setCourseModalVisible(true)}
                      disabled={coursesLoading}
                    >
                      {coursesLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={themeColors.accent}
                          style={styles.selectorActivity}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.selectorText,
                            {
                              color: editableGoal?.length
                                ? themeColors.text
                                : themeColors.icon,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {editableGoal?.length
                            ? editableGoal
                            : "Selecionar curso"}
                        </Text>
                      )}
                      <MaterialIcons
                        name="arrow-drop-down"
                        size={24}
                        color={themeColors.icon}
                      />
                    </TouchableOpacity>
                  </View>
                  {/* Linha Idade - Editável */}
                  <View style={styles.infoRow}>
                    <MaterialIcons
                      name="cake"
                      size={20}
                      color={themeColors.icon}
                      style={styles.infoIcon}
                    />
                    <ThemedText style={styles.label}>Idade:</ThemedText>
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      value={editableAge}
                      onChangeText={setEditableAge}
                      placeholder="Não informado"
                      placeholderTextColor={themeColors.icon}
                      keyboardType="numeric"
                    />
                  </View>
                  {/* Linha Instituição - Editável */}
                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <MaterialIcons
                      name="location-city"
                      size={20}
                      color={themeColors.icon}
                      style={styles.infoIcon}
                    />
                    <ThemedText style={styles.label}>Instituição:</ThemedText>
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      value={editableSchool}
                      onChangeText={setEditableSchool}
                      placeholder="Não informada"
                      placeholderTextColor={themeColors.icon}
                    />
                  </View>
                  {/* Linha de fuso horário REMOVIDA */}

                  {/* Botões Salvar/Cancelar */}
                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setIsEditingInfo(false)}
                      disabled={saving}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        { backgroundColor: themeColors.accent },
                        saving && styles.disabledButton,
                      ]}
                      onPress={handleSaveInfo}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.buttonText}>Salvar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* Linha Curso - Visualização */}
                  <View style={styles.infoRow}>
                    <MaterialIcons
                      name="school"
                      size={20}
                      color={themeColors.icon}
                      style={styles.infoIcon}
                    />
                    <ThemedText style={styles.label}>Curso:</ThemedText>
                    <ThemedText style={styles.info} numberOfLines={1}>
                      {profile.goal || "Não informado"}
                    </ThemedText>
                  </View>
                  {/* Linha Idade - Visualização */}
                  <View style={styles.infoRow}>
                    <MaterialIcons
                      name="cake"
                      size={20}
                      color={themeColors.icon}
                      style={styles.infoIcon}
                    />
                    <ThemedText style={styles.label}>Idade:</ThemedText>
                    <ThemedText style={styles.info}>
                      {profile.age || "Não informado"}
                    </ThemedText>
                  </View>
                  {/* Linha Instituição - Visualização */}
                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <MaterialIcons
                      name="location-city"
                      size={20}
                      color={themeColors.icon}
                      style={styles.infoIcon}
                    />
                    <ThemedText style={styles.label}>Instituição:</ThemedText>
                    <ThemedText style={styles.info}>
                      {profile.school || "Não informada"}
                    </ThemedText>
                  </View>
                  {/* Linha de fuso horário REMOVIDA */}
                </>
              )}
            </ThemedView>
          )}

          {/* Botão de Configurar Fuso Horário REMOVIDO */}

          {/* Botão de Logout */}
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: themeColors.destructive },
            ]}
            onPress={handleLogout}
          >
            <MaterialIcons
              name="logout"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.buttonText}>Sair</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Modal de Seleção de Curso */}
      <Modal
        visible={courseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCourseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: themeColors.card },
            ]}
          >
            {/* Cabeçalho do Modal */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Escolha o curso
              </Text>
              <TouchableOpacity
                onPress={() => setCourseModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons
                  name="close"
                  size={22}
                  color={themeColors.icon}
                />
              </TouchableOpacity>
            </View>
            {/* Conteúdo do Modal */}
            {coursesLoading ? (
              <View style={styles.modalLoaderContainer}>
                <ActivityIndicator size="large" color={themeColors.accent} />
              </View>
            ) : (
              <FlatList // Usando FlatList
                data={courses}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      {
                        borderColor: themeColors.icon + "50", // Borda mais suave
                        backgroundColor:
                          editableGoal === item
                            ? themeColors.accent
                            : "transparent",
                      },
                    ]}
                    onPress={() => handleSelectCourse(item)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        {
                          color:
                            editableGoal === item
                              ? "#FFFFFF"
                              : themeColors.text,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text
                    style={[styles.modalEmptyText, { color: themeColors.icon }]}
                  >
                    Nenhum curso disponível.
                  </Text>
                }
                style={styles.modalContent}
                contentContainerStyle={styles.modalContentContainer}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Fuso Horário REMOVIDO */}
    </ThemedView>
  );
}

// --- Estilos ---
// Remover estilos: configButton, configButtonContent, configButtonLabel, configButtonValue
// Remover searchInput se não for mais usado por outros modais
const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 30 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  userName: { fontSize: 28, fontWeight: "bold" },
  userEmail: { fontSize: 16, color: "gray", marginTop: 4 },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 30, // Aumentado de volta
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.08)",
  },
  infoIcon: {
    marginRight: 12,
    width: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    opacity: 0.7,
    width: 90,
  },
  info: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  input: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  selectorButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 8,
    minHeight: 36,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 4,
    textAlign: "right",
    flexShrink: 1,
  },
  selectorActivity: {
    marginRight: 8,
  },
  editButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    paddingTop: 10,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 80,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    color: Colors.light.destructive,
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  // Estilos de Modal (mantidos para o modal de curso)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalContainer: {
    borderRadius: 16,
    maxHeight: "80%",
    paddingVertical: 16,
    paddingHorizontal: 0,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {},
  modalContentContainer: {
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalLoaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  modalEmptyText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 20,
  },
});
