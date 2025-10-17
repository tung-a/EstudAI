import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  timezone?: string; // Adicionado
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseModalVisible, setCourseModalVisible] = useState(false);

  // Estados temporários para a edição
  const [editableAge, setEditableAge] = useState("");
  const [editableSchool, setEditableSchool] = useState("");
  const [editableGoal, setEditableGoal] = useState("");
  const [editableTimezone, setEditableTimezone] = useState("America/Sao_Paulo"); // Adicionado

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setEditableAge(data.age || "");
          setEditableSchool(data.school || "");
          setEditableGoal(data.goal || "");
          setEditableTimezone(data.timezone || "America/Sao_Paulo"); // Adicionado
        } else {
          setProfile({
            name: user.displayName || "Usuário",
            email: user.email || "",
            timezone: "America/Sao_Paulo",
          });
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setCourseModalVisible(false);
    }
  }, [isEditing]);

  useEffect(() => {
    let isMounted = true;

    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "prioridades_cursos"));
        if (!isMounted) {
          return;
        }
        const loadedCourses = snapshot.docs
          .map((courseDoc) => courseDoc.data()?.nomeCurso)
          .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
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
          Alert.alert(
            "Erro",
            "Não foi possível carregar a lista de cursos. Tente novamente mais tarde."
          );
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível fazer o logout.", error);
    }
  };

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        age: editableAge,
        school: editableSchool,
        goal: editableGoal,
        timezone: editableTimezone, // Adicionado
      });
      setProfile((prevProfile) => ({
        ...prevProfile!,
        age: editableAge,
        school: editableSchool,
        goal: editableGoal,
        timezone: editableTimezone, // Adicionado
      }));
      setIsEditing(false);
      Alert.alert("Sucesso", "Perfil atualizado!");
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível salvar as alterações.", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCourse = (courseName: string) => {
    setEditableGoal(courseName);
    setCourseModalVisible(false);
  };

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
          <View style={styles.header}>
            <View
              style={[styles.avatar, { backgroundColor: themeColors.card }]}
            >
              <MaterialIcons name="person" size={60} color={themeColors.icon} />
            </View>
            <ThemedText type="title" style={styles.userName}>
              {profile?.name}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{profile?.email}</ThemedText>
          </View>

          {profile && (
            <ThemedView
              lightColor={Colors.light.card}
              darkColor={Colors.dark.card}
              style={styles.infoCard}
            >
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle">Informações</ThemedText>
                {!isEditing && (
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <MaterialIcons
                      name="edit"
                      size={24}
                      color={themeColors.accent}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {isEditing ? (
                <>
                  {/* Campos de edição existentes... */}
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>
                      Curso pretendido:
                    </ThemedText>
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
                              color:
                                editableGoal?.length
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
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Idade:</ThemedText>
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      value={editableAge}
                      onChangeText={setEditableAge}
                      placeholder="Sua idade"
                      placeholderTextColor={themeColors.icon}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Instituição:</ThemedText>
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      value={editableSchool}
                      onChangeText={setEditableSchool}
                      placeholder="Sua escola/cursinho"
                      placeholderTextColor={themeColors.icon}
                    />
                  </View>
                  {/* NOVO CAMPO DE FUSO HORÁRIO */}
                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <ThemedText style={styles.label}>Fuso Horário:</ThemedText>
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      value={editableTimezone}
                      onChangeText={setEditableTimezone}
                      placeholder="Ex: America/Sao_Paulo"
                      placeholderTextColor={themeColors.icon}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setIsEditing(false)}
                      disabled={saving}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        { backgroundColor: themeColors.accent },
                      ]}
                      onPress={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Salvar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* Campos de visualização existentes... */}
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>
                      Curso pretendido:
                    </ThemedText>
                    <ThemedText style={styles.info}>
                      {profile.goal || "Não informado"}
                    </ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Idade:</ThemedText>
                    <ThemedText style={styles.info}>
                      {profile.age || "Não informado"}
                    </ThemedText>
                  </View>
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Instituição:</ThemedText>
                    <ThemedText style={styles.info}>
                      {profile.school || "Não informada"}
                    </ThemedText>
                  </View>
                  {/* NOVO CAMPO DE FUSO HORÁRIO */}
                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <ThemedText style={styles.label}>Fuso Horário:</ThemedText>
                    <ThemedText style={styles.info}>
                      {profile.timezone || "Não informado"}
                    </ThemedText>
                  </View>
                </>
              )}
            </ThemedView>
          )}

          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: themeColors.destructive },
            ]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Sair (Logout)</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

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
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Escolha o curso</Text>
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
            {coursesLoading ? (
              <View style={styles.modalLoaderContainer}>
                <ActivityIndicator size="large" color={themeColors.accent} />
              </View>
            ) : (
              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={styles.modalContentContainer}
              >
                {courses.length === 0 ? (
                  <Text
                    style={[
                      styles.modalEmptyText,
                      { color: themeColors.icon },
                    ]}
                  >
                    Nenhum curso disponível.
                  </Text>
                ) : (
                  courses.map((courseName) => (
                    <TouchableOpacity
                      key={courseName}
                      style={[
                        styles.modalOption,
                        {
                          borderColor: themeColors.icon,
                          backgroundColor:
                            editableGoal === courseName
                              ? themeColors.accent
                              : "transparent",
                        },
                      ]}
                      onPress={() => handleSelectCourse(courseName)}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          {
                            color:
                              editableGoal === courseName
                                ? "#FFFFFF"
                                : themeColors.text,
                          },
                        ]}
                      >
                        {courseName}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 20 },
  header: { alignItems: "center", marginBottom: 30 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  userName: { fontSize: 28, fontWeight: "bold" },
  userEmail: { fontSize: 16, color: "gray", marginTop: 4 },
  infoCard: { borderRadius: 12, padding: 16, marginBottom: 30 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: { fontSize: 16, opacity: 0.7, flex: 1 },
  info: { fontSize: 16, fontWeight: "500", flex: 2, textAlign: "right" },
  input: {
    fontSize: 16,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
    padding: 0,
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 36,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "500",
    marginRight: 4,
    maxWidth: 180,
    textAlign: "right",
  },
  selectorActivity: {
    marginRight: 8,
  },
  editButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
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
  buttonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  logoutButton: { padding: 15, borderRadius: 12, alignItems: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    borderRadius: 16,
    maxHeight: "70%",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 320,
  },
  modalContentContainer: {
    paddingBottom: 8,
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
  },
});
