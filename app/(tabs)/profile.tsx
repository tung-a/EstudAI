import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados temporários para a edição
  const [editableAge, setEditableAge] = useState("");
  const [editableSchool, setEditableSchool] = useState("");
  const [editableGoal, setEditableGoal] = useState("");

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
          // Inicializa os campos editáveis com os dados do perfil
          setEditableAge(data.age || "");
          setEditableSchool(data.school || "");
          setEditableGoal(data.goal || "");
        } else {
          setProfile({
            name: user.displayName || "Usuário",
            email: user.email || "",
          });
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
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
      });
      // Atualiza o estado local do perfil após salvar
      setProfile((prevProfile) => ({
        ...prevProfile!,
        age: editableAge,
        school: editableSchool,
        goal: editableGoal,
      }));
      setIsEditing(false); // Sai do modo de edição
      Alert.alert("Sucesso", "Perfil atualizado!");
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível salvar as alterações.", error);
    } finally {
      setSaving(false);
    }
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
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Objetivo:</ThemedText>
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      value={editableGoal}
                      onChangeText={setEditableGoal}
                      placeholder="Ex: ENEM, FUVEST"
                      placeholderTextColor={themeColors.icon}
                    />
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
                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <ThemedText style={styles.label}>Instituição:</ThemedText>
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      value={editableSchool}
                      onChangeText={setEditableSchool}
                      placeholder="Sua escola/cursinho"
                      placeholderTextColor={themeColors.icon}
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
                  <View style={styles.infoRow}>
                    <ThemedText style={styles.label}>Objetivo:</ThemedText>
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
                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <ThemedText style={styles.label}>Instituição:</ThemedText>
                    <ThemedText style={styles.info}>
                      {profile.school || "Não informada"}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 16,
    color: "gray",
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
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
  label: {
    fontSize: 16,
    opacity: 0.7,
    flex: 1,
  },
  info: {
    fontSize: 16,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  input: {
    fontSize: 16,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
    padding: 0, // Remove padding interno para alinhar
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
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
});
