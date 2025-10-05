import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Tipo de perfil atualizado
type UserProfile = {
  name: string;
  email: string;
  age?: string;
  school?: string;
  goal?: string; // Novo campo
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Fallback caso não encontre o documento no Firestore
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
              {/* CAMPO OBJETIVO ADICIONADO */}
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
              {/* Removida a borda do último item para melhor estética */}
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <ThemedText style={styles.label}>Instituição:</ThemedText>
                <ThemedText style={styles.info}>
                  {profile.school || "Não informada"}
                </ThemedText>
              </View>
            </ThemedView>
          )}

          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: themeColors.destructive },
            ]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Sair (Logout)</Text>
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: {
    fontSize: 16,
    opacity: 0.7,
  },
  info: {
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
