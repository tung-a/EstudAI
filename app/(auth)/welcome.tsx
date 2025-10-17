import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logSignUp } from "@/lib/analytics";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const [age, setAge] = useState("");
  const [school, setSchool] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const router = useRouter();
  const { name, email, password } = useLocalSearchParams<{
    name: string;
    email: string;
    password: string;
  }>();

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
          .filter((courseName): courseName is string =>
            typeof courseName === "string" && courseName.trim().length > 0
          )
          .map((courseName) => courseName.trim())
          .reduce<string[]>((acc, courseName) => {
            const lower = courseName.toLowerCase();
            if (!acc.some((existing) => existing.toLowerCase() === lower)) {
              acc.push(courseName);
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

  const handleCompleteRegistration = async () => {
    if (!name || !email || !password) {
      Alert.alert(
        "Erro",
        "Dados de registro não encontrados. Por favor, volte e tente novamente.",
        [{ text: "Voltar", onPress: () => router.back() }]
      );
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        age: age || "",
        school: school || "",
        goal: goal || "",
        role: "user",
      });

      logSignUp();
    } catch (error: any) {
      setLoading(false);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Email em Uso",
          "Este email já está cadastrado. Por favor, volte e tente fazer login.",
          [{ text: "Voltar", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Erro",
          "Não foi possível criar sua conta: " + error.message
        );
      }
    }
  };

  const handleSelectCourse = (courseName: string) => {
    setGoal(courseName);
    setCourseModalVisible(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <View style={styles.content}>
            <ThemedText type="title" style={styles.title}>
              Só mais alguns detalhes...
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Nos ajude a personalizar sua experiência (opcional).
            </ThemedText>

            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text,
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.card,
                },
              ]}
              placeholder="Sua idade"
              placeholderTextColor={themeColors.icon}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.text,
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.card,
                },
              ]}
              placeholder="Sua instituição de ensino"
              placeholderTextColor={themeColors.icon}
              value={school}
              onChangeText={setSchool}
            />
            <TouchableOpacity
              style={[
                styles.selectorButton,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.card,
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
                      color: goal.length ? themeColors.text : themeColors.icon,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {goal.length ? goal : "Escolha seu curso pretendido"}
                </Text>
              )}
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color={themeColors.icon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColors.accent }]}
              onPress={handleCompleteRegistration}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Concluir Cadastro</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleCompleteRegistration}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: themeColors.accent }]}>
                Pular
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
                            goal === courseName
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
                              goal === courseName
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 30,
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  selectorButton: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  selectorActivity: {
    marginRight: 12,
  },
  button: {
    padding: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  skipButton: {
    backgroundColor: "transparent",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
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
