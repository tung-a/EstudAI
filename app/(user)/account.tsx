import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ZodiacImages } from "@/lib/astrology";
import { MaterialIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UserData = {
  name: string;
  email: string;
  zodiacSign?: string;
};

export default function AccountScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            setUserData({
              name: user.displayName || "Viajante",
              email: user.email || "",
            });
          }
        } catch (error) {
          console.error("Erro ao buscar perfil", error);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    // Lógica específica para Web
    if (Platform.OS === 'web') {
      const confirm = window.confirm("Deseja se desconectar do universo?");
      if (confirm) {
        try {
          await signOut(auth);
        } catch (error: any) {
          alert("Erro: Não foi possível sair.");
        }
      }
      return; // Encerra aqui para não rodar o código nativo
    }

    // Lógica original para Android/iOS (Mantida)
    Alert.alert("Encerrar Sessão", "Deseja se desconectar do universo?", [
      { text: "Ficar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
          } catch (error: any) {
            Alert.alert("Erro", "Não foi possível sair.");
          }
        },
      },
    ]);
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
          {/* Cabeçalho do Perfil */}
          <View style={styles.header}>
            <View style={[styles.avatarContainer, { borderColor: themeColors.accent }]}>
                {userData?.zodiacSign && ZodiacImages[userData.zodiacSign] ? (
                  <Image
                    source={ZodiacImages[userData.zodiacSign]}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons
                    name="person"
                    size={60}
                    color={themeColors.icon}
                  />
                )}
            </View>
            <ThemedText type="title" style={styles.userName}>
              {userData?.name}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{userData?.email}</ThemedText>
            
            {userData?.zodiacSign && (
              <View style={[styles.signBadge, { backgroundColor: themeColors.accent + '20' }]}>
                <MaterialIcons name="auto-awesome" size={14} color={themeColors.accent} />
                <ThemedText style={[styles.signText, { color: themeColors.accent }]}>
                  {userData.zodiacSign}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Seção de Amigos (Futuro) */}
          <View style={[styles.sectionCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="groups" size={24} color={themeColors.accent} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Círculo Mágico
              </ThemedText>
            </View>
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>
                A funcionalidade de adicionar amigos chegará em breve. Prepare-se para conectar energias!
              </ThemedText>
            </View>
          </View>

          {/* Configurações e Ações */}
          <View style={[styles.sectionCard, { backgroundColor: themeColors.card }]}>
            <TouchableOpacity style={styles.menuItem}>
              <MaterialIcons name="notifications-none" size={22} color={themeColors.text} />
              <ThemedText style={styles.menuText}>Notificações</ThemedText>
              <MaterialIcons name="chevron-right" size={22} color={themeColors.icon} />
            </TouchableOpacity>
            
            <View style={[styles.separator, { backgroundColor: themeColors.icon + '20' }]} />

            <TouchableOpacity style={styles.menuItem}>
              <MaterialIcons name="lock-outline" size={22} color={themeColors.text} />
              <ThemedText style={styles.menuText}>Privacidade</ThemedText>
              <MaterialIcons name="chevron-right" size={22} color={themeColors.icon} />
            </TouchableOpacity>
          </View>

          {/* Botão de Logout */}
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: themeColors.destructive }]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color={themeColors.destructive} />
            <ThemedText style={[styles.logoutText, { color: themeColors.destructive }]}>
              Sair da Conta
            </ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.versionText}>VibeAI v1.0.0</ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  header: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
  },
  userName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  userEmail: { fontSize: 14, opacity: 0.6, marginBottom: 12 },
  signBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  signText: { fontWeight: '600', fontSize: 14 },

  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  sectionTitle: { fontSize: 18 },
  emptyState: { padding: 10, alignItems: 'center' },
  emptyText: { textAlign: 'center', opacity: 0.6, fontSize: 14, fontStyle: 'italic' },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: { flex: 1, marginLeft: 12, fontSize: 16 },
  separator: { height: 1, marginVertical: 4 },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 20,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: 'bold' },
  versionText: { textAlign: 'center', opacity: 0.3, fontSize: 12 },
  avatarImage: {
  width: '100%',
  height: '100%',
  borderRadius: 50,
},
});