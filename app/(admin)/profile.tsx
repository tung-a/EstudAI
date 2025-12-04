import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { collection, doc, getDoc, writeBatch } from "firebase/firestore";
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

// --- DADOS INICIAIS PARA POPULAR A COLEÇÃO DE CRISTAIS ---
const INITIAL_DATA = [
  {
    id: "ametista",
    nome: "Ametista - Transmutação",
    descricao:
      "Poderosa pedra de proteção, vitalidade e elevação espiritual. Ótima para meditação e transmutar energias.",
    foco: "Espiritualidade",
  },
  {
    id: "quartzo-rosa",
    nome: "Quartzo Rosa - Amor Incondicional",
    descricao:
      "A pedra do amor e da paz infinita. Purifica e abre o coração, promovendo a cura interior.",
    foco: "Emoções",
  },
  {
    id: "citrino",
    nome: "Citrino - Prosperidade",
    descricao:
      "Carrega a energia do sol. É uma pedra de abundância, atraindo riqueza, prosperidade e sucesso.",
    foco: "Carreira/Finanças",
  },
  {
    id: "olho-de-tigre",
    nome: "Olho de Tigre - Proteção e Foco",
    descricao:
      "Combina a energia da Terra com a do Sol. Ajuda a distinguir o que queremos do que realmente precisamos.",
    foco: "Estudo/Foco",
  },
  {
    id: "turmalina-negra",
    nome: "Turmalina Negra - Escudo",
    descricao:
      "Pedra de proteção por excelência. Repele energias negativas e ataques psíquicos.",
    foco: "Proteção",
  },
  {
    id: "sodalita",
    nome: "Sodalita - Intuição e Mente",
    descricao:
      "Une a lógica à intuição. Elimina a confusão mental e estimula o pensamento racional e a objetividade.",
    foco: "Intelecto",
  },
  {
    id: "quartzo-transparente",
    nome: "Quartzo Transparente - Amplificador",
    descricao:
      "O mestre da cura. Amplifica energias e pensamentos, além do efeito de outros cristais.",
    foco: "Clareza",
  },
  {
    id: "jaspe-vermelho",
    nome: "Jaspe Vermelho - Vitalidade",
    descricao:
      "Traz tranquilidade e apoio em momentos de estresse. Estimula a coragem para enfrentar problemas.",
    foco: "Energia Física",
  },
];

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

  // --- FUNÇÃO PARA POPULAR O BANCO (SEED) ---
  const seedDatabase = async () => {
    try {
      const batch = writeBatch(db);

      INITIAL_DATA.forEach((item) => {
        // Cria/Sobrescreve o documento na coleção 'cristais_propriedades'
        const docRef = doc(collection(db, "cristais_propriedades"), item.id);

        batch.set(docRef, {
          nome: item.nome,
          descricao: item.descricao,
          foco: item.foco,
          // Nota: Nenhuma referência a 'disciplina' é criada aqui.
          // Esta coleção é puramente para os dados místicos.
        });
      });

      await batch.commit();
      Alert.alert(
        "Sucesso",
        "Coleção 'cristais_propriedades' populada com sucesso!"
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", "Falha ao criar coleção: " + error.message);
    }
  };

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

          {/* Seção de Ferramentas Administrativas */}
          <ThemedView
            style={[
              styles.adminToolsCard,
              { backgroundColor: themeColors.card },
            ]}
          >
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Ferramentas do Sistema
            </ThemedText>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: themeColors.accent },
              ]}
              onPress={seedDatabase}
            >
              <MaterialIcons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.buttonText}>Popular Cristais (Seed)</Text>
            </TouchableOpacity>

            <ThemedText style={styles.hintText}>
              Use este botão para criar/resetar a coleção de cristais no banco
              de dados.
            </ThemedText>
          </ThemedView>

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
    flexGrow: 1,
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
    backgroundColor: "rgba(156, 39, 176, 0.1)", // Tom roxo suave
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: Colors.light.accent,
    fontWeight: "bold",
    fontSize: 12,
  },
  adminToolsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 18,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  hintText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 4,
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
    marginTop: 20,
  },
});
