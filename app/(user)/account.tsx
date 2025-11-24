import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ZodiacImages } from "@/lib/astrology";
// 1. Renomeamos o import original
import { MaterialIcons as MaterialIconsOrigin } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 2. Criamos a constante corrigida para o React 19
const MaterialIcons = MaterialIconsOrigin as unknown as React.ElementType;

type UserData = {
  name: string;
  email: string;
  zodiacSign?: string;
};

type Friend = {
  id: string; // ID do documento da amizade
  friendId: string; // ID do usuário amigo
  name: string;
  email: string;
  zodiacSign?: string;
};

export default function AccountScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o Modal de Busca
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [foundUser, setFoundUser] = useState<Friend | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const currentUser = auth.currentUser;

  // 1. Monitoramento do Perfil e Amigos em Tempo Real
  useEffect(() => {
    if (currentUser) {
      // Listener do Perfil
      const unsubscribeProfile = onSnapshot(
        doc(db, "users", currentUser.uid),
        (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            setUserData({
              name: currentUser.displayName || "Viajante",
              email: currentUser.email || "",
            });
          }
          setLoading(false);
        }
      );

      // Listener dos Amigos
      const qFriends = query(
        collection(db, "users", currentUser.uid, "friends")
      );
      const unsubscribeFriends = onSnapshot(qFriends, (snapshot) => {
        const friendsList: Friend[] = [];
        snapshot.forEach((doc) => {
          friendsList.push({ id: doc.id, ...doc.data() } as Friend);
        });
        setFriends(friendsList);
      });

      return () => {
        unsubscribeProfile();
        unsubscribeFriends();
      };
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleSearchUser = async () => {
    if (!searchText.trim()) return;
    setSearchLoading(true);
    setFoundUser(null);

    try {
      // Busca usuário pelo email exato
      const q = query(
        collection(db, "users"),
        where("email", "==", searchText.trim().toLowerCase())
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const friendId = querySnapshot.docs[0].id;

        // Não permite adicionar a si mesmo
        if (friendId === currentUser?.uid) {
          Alert.alert("Ops", "Você não pode adicionar a si mesmo.");
          setSearchLoading(false);
          return;
        }

        // Verifica se já é amigo
        const alreadyFriend = friends.some((f) => f.friendId === friendId);
        if (alreadyFriend) {
          Alert.alert("Já conectado", "Este viajante já está no seu círculo.");
          setSearchLoading(false);
          return;
        }

        setFoundUser({
          id: "", // Será gerado ao adicionar
          friendId: friendId,
          name: docData.name || "Sem nome",
          email: docData.email || "",
          zodiacSign: docData.zodiacSign,
        });
      } else {
        Alert.alert(
          "Não encontrado",
          "Nenhum viajante encontrado com este e-mail."
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao buscar usuário.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!foundUser || !currentUser) return;

    try {
      await addDoc(collection(db, "users", currentUser.uid, "friends"), {
        friendId: foundUser.friendId,
        name: foundUser.name,
        email: foundUser.email,
        zodiacSign: foundUser.zodiacSign || null,
      });

      Alert.alert("Sucesso", `${foundUser.name} entrou no seu Círculo Mágico!`);
      setModalVisible(false);
      setSearchText("");
      setFoundUser(null);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível adicionar.");
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert("Remover", `Deseja remover ${friend.name} do seu círculo?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          if (currentUser) {
            await deleteDoc(
              doc(db, "users", currentUser.uid, "friends", friend.id)
            );
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      const confirm = window.confirm("Deseja se desconectar do universo?");
      if (confirm) await signOut(auth);
      return;
    }

    Alert.alert("Encerrar Sessão", "Deseja se desconectar do universo?", [
      { text: "Ficar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => signOut(auth) },
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
            <View
              style={[
                styles.avatarContainer,
                { borderColor: themeColors.accent },
              ]}
            >
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
              <View
                style={[
                  styles.signBadge,
                  { backgroundColor: themeColors.accent + "20" },
                ]}
              >
                <MaterialIcons
                  name="auto-awesome"
                  size={14}
                  color={themeColors.accent}
                />
                <ThemedText
                  style={[styles.signText, { color: themeColors.accent }]}
                >
                  {userData.zodiacSign}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Seção Círculo Mágico */}
          <View
            style={[styles.sectionCard, { backgroundColor: themeColors.card }]}
          >
            <View style={styles.sectionHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <MaterialIcons
                  name="groups"
                  size={24}
                  color={themeColors.accent}
                />
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Círculo Mágico
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <MaterialIcons
                  name="person-add"
                  size={22}
                  color={themeColors.accent}
                />
              </TouchableOpacity>
            </View>

            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>
                  Seu círculo está vazio. Adicione amigos para conectar
                  energias!
                </ThemedText>
                <TouchableOpacity
                  style={[
                    styles.inviteButton,
                    { borderColor: themeColors.icon + "50" },
                  ]}
                  onPress={() => setModalVisible(true)}
                >
                  <ThemedText style={{ color: themeColors.text }}>
                    Convidar Viajante
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={friends}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.friendsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.friendItem}
                    onLongPress={() => handleRemoveFriend(item)}
                  >
                    <View
                      style={[
                        styles.friendAvatar,
                        { borderColor: themeColors.accent },
                      ]}
                    >
                      {item.zodiacSign && ZodiacImages[item.zodiacSign] ? (
                        <Image
                          source={ZodiacImages[item.zodiacSign]}
                          style={styles.avatarImageSmall}
                        />
                      ) : (
                        <MaterialIcons
                          name="person"
                          size={24}
                          color={themeColors.icon}
                        />
                      )}
                    </View>
                    <ThemedText numberOfLines={1} style={styles.friendName}>
                      {item.name.split(" ")[0]}
                    </ThemedText>
                    {item.zodiacSign && (
                      <ThemedText
                        style={[styles.friendSign, { color: themeColors.icon }]}
                      >
                        {item.zodiacSign}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          {/* Configurações e Ações */}
          <View
            style={[styles.sectionCard, { backgroundColor: themeColors.card }]}
          >
            <TouchableOpacity style={styles.menuItem}>
              <MaterialIcons
                name="notifications-none"
                size={22}
                color={themeColors.text}
              />
              <ThemedText style={styles.menuText}>Notificações</ThemedText>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={themeColors.icon}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.separator,
                { backgroundColor: themeColors.icon + "20" },
              ]}
            />

            <TouchableOpacity style={styles.menuItem}>
              <MaterialIcons
                name="lock-outline"
                size={22}
                color={themeColors.text}
              />
              <ThemedText style={styles.menuText}>Privacidade</ThemedText>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={themeColors.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Botão de Logout */}
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { borderColor: themeColors.destructive },
            ]}
            onPress={handleLogout}
          >
            <MaterialIcons
              name="logout"
              size={20}
              color={themeColors.destructive}
            />
            <ThemedText
              style={[styles.logoutText, { color: themeColors.destructive }]}
            >
              Sair da Conta
            </ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.versionText}>VibeAI v1.1.0</ThemedText>
        </ScrollView>
      </SafeAreaView>

      {/* Modal de Adicionar Amigo */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <ThemedView
            style={[styles.modalContent, { backgroundColor: themeColors.card }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Adicionar ao Círculo</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={themeColors.icon}
                />
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.modalSubtitle}>
              Busque um viajante pelo e-mail para conectarem suas jornadas.
            </ThemedText>

            <View
              style={[
                styles.inputContainer,
                { borderColor: themeColors.icon + "50" },
              ]}
            >
              <MaterialIcons name="search" size={20} color={themeColors.icon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="E-mail do amigo"
                placeholderTextColor={themeColors.icon + "80"}
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {searchLoading ? (
              <ActivityIndicator
                style={{ marginTop: 20 }}
                color={themeColors.accent}
              />
            ) : foundUser ? (
              <View
                style={[
                  styles.foundUserCard,
                  { backgroundColor: themeColors.background },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={[
                      styles.friendAvatar,
                      {
                        width: 40,
                        height: 40,
                        borderColor: themeColors.accent,
                      },
                    ]}
                  >
                    {foundUser.zodiacSign &&
                    ZodiacImages[foundUser.zodiacSign] ? (
                      <Image
                        source={ZodiacImages[foundUser.zodiacSign]}
                        style={styles.avatarImageSmall}
                      />
                    ) : (
                      <MaterialIcons
                        name="person"
                        size={20}
                        color={themeColors.icon}
                      />
                    )}
                  </View>
                  <View>
                    <ThemedText type="defaultSemiBold">
                      {foundUser.name}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                      {foundUser.email}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: themeColors.accent },
                  ]}
                  onPress={handleAddFriend}
                >
                  <MaterialIcons name="person-add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  { backgroundColor: themeColors.accent },
                ]}
                onPress={handleSearchUser}
              >
                <ThemedText style={{ color: "#FFF", fontWeight: "bold" }}>
                  Buscar
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: { alignItems: "center", marginBottom: 30 },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "rgba(156, 39, 176, 0.1)",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  avatarImageSmall: {
    width: "100%",
    height: "100%",
  },
  userName: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  userEmail: { fontSize: 14, opacity: 0.6, marginBottom: 12 },
  signBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  signText: { fontWeight: "600", fontSize: 14 },

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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18 },
  emptyState: { padding: 10, alignItems: "center", gap: 15 },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
    fontSize: 14,
    fontStyle: "italic",
  },
  inviteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
  },

  friendsList: { gap: 16, paddingVertical: 5 },
  friendItem: { alignItems: "center", width: 70 },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden",
    backgroundColor: "rgba(128,128,128,0.1)",
  },
  friendName: { fontSize: 12, fontWeight: "600" },
  friendSign: { fontSize: 10, opacity: 0.8 },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuText: { flex: 1, marginLeft: 12, fontSize: 16 },
  separator: { height: 1, marginVertical: 4 },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 20,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "bold" },
  versionText: { textAlign: "center", opacity: 0.3, fontSize: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  searchButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  foundUserCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  addButton: {
    padding: 10,
    borderRadius: 25,
  },
});
