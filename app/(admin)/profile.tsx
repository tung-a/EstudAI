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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UserProfile = {
  name: string;
  email: string;
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
          const data = docSnap.data();
          setProfile({
            name: data.name || user.displayName || "Admin",
            email: data.email || user.email || "",
          });
        } else {
          setProfile({
            name: user.displayName || "Admin",
            email: user.email || "",
          });
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined"
          ? window.confirm("Tem certeza que deseja sair da sua conta?")
          : false;

      if (confirmed) {
        try {
          await signOut(auth);
        } catch (error: any) {
          Alert.alert("Erro", "Não foi possível fazer o logout.");
          console.error("Erro ao fazer logout:", error);
        }
      }
      return;
    }

    Alert.alert(
      "Confirmar Saída",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error: any) {
              Alert.alert("Erro", "Não foi possível fazer o logout.");
              console.error("Erro ao fazer logout:", error);
            }
          },
        },
      ]
    );
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
              <MaterialIcons
                name="shield"
                size={60}
                color={themeColors.accent}
              />
            </View>
            <ThemedText type="title" style={styles.userName}>
              {profile?.name}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{profile?.email}</ThemedText>
            <View style={styles.adminBadge}>
              <ThemedText style={styles.adminBadgeText}>
                Administrador
              </ThemedText>
            </View>
          </View>

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
    justifyContent: "center",
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
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
  adminBadge: {
    marginTop: 12,
    backgroundColor: "rgba(233, 30, 99, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: Colors.light.accent,
    fontWeight: "bold",
    fontSize: 12,
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
