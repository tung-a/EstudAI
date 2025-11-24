import { ConstellationView, Friend } from "@/components/ConstellationView";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getAstralSynergy, SynergyResult, ZodiacImages } from "@/lib/astrology";
import { MaterialIcons as MaterialIconsOrigin } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MaterialIcons = MaterialIconsOrigin as unknown as React.ElementType;

type UserData = {
  name: string;
  email: string;
  zodiacSign?: string;
  preferences?: {
    notifications?: boolean;
    publicProfile?: boolean;
    showSign?: boolean;
  };
};

const INTENTIONS = [
  { id: "luz", label: "Luz", icon: "wb-sunny", color: "#FFD700" },
  {
    id: "coragem",
    label: "Coragem",
    icon: "local-fire-department",
    color: "#FF5722",
  },
  { id: "cura", label: "Cura", icon: "spa", color: "#4CAF50" },
  { id: "clareza", label: "Clareza", icon: "water-drop", color: "#2196F3" },
];

export default function AccountScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [foundUser, setFoundUser] = useState<Friend | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  const [synergyModalVisible, setSynergyModalVisible] = useState(false);
  const [synergyData, setSynergyData] = useState<{
    friend: Friend;
    result: SynergyResult;
  } | null>(null);
  const [sendingIntention, setSendingIntention] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"list" | "galaxy">("list");

  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      const unsubscribeProfile = onSnapshot(
        doc(db, "users", currentUser.uid),
        (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            setUserData({
              name: currentUser.displayName || "Viajante",
              email: currentUser.email || "",
              preferences: {
                notifications: true,
                publicProfile: true,
                showSign: true,
              },
            });
          }
          setLoading(false);
        }
      );

      const qFriends = query(
        collection(db, "users", currentUser.uid, "friends")
      );

      const unsubscribeFriends = onSnapshot(qFriends, async (snapshot) => {
        // 1. Mapeamos primeiro para dados básicos para evitar erros de tipagem imediatos
        const basicFriends = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Friend)
        );

        // 2. Atualizamos o estado imediatamente com o básico para a UI não ficar vazia
        // (Isso ajuda a evitar o crash se a hidratação demorar ou falhar)

        // 3. Iniciamos a hidratação (busca de dados profundos)
        const hydratedPromises = snapshot.docs.map(
          async (friendDoc): Promise<Friend> => {
            const friendData = friendDoc.data() as Omit<Friend, "id">;
            const friendId = friendData.friendId;

            // Fallback seguro
            const safeFriend: Friend = {
              id: friendDoc.id,
              name: friendData.name || "Viajante", // Garante que sempre tenha nome
              email: friendData.email || "",
              friendId: friendData.friendId,
              zodiacSign: friendData.zodiacSign,
              ...friendData,
            };

            if (!friendId) return safeFriend;

            try {
              const userRef = doc(db, "users", friendId);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const userData = userSnap.data();
                const today = new Date().toISOString().split("T")[0];

                let dailyTarot = undefined;
                if (userData.dailyTarot && userData.dailyTarot.date === today) {
                  dailyTarot = userData.dailyTarot;
                }

                let astralMap = undefined;
                if (userData.astralMapJson) {
                  try {
                    astralMap = JSON.parse(userData.astralMapJson);
                  } catch (e) {
                    console.error("JSON parse error", e);
                  }
                }

                return {
                  ...safeFriend,
                  zodiacSign: userData.zodiacSign || safeFriend.zodiacSign,
                  name: userData.name || safeFriend.name, // Atualiza nome se mudou
                  dailyTarot,
                  astralMap,
                };
              }
            } catch (e) {
              // Erro silencioso na hidratação, retorna o dado básico
              // console.log("Hidratação falhou para", friendId);
            }

            return safeFriend;
          }
        );

        try {
          const finalFriends = await Promise.all(hydratedPromises);
          setFriends(finalFriends);
        } catch (err) {
          // Se falhar tudo, usa o básico
          setFriends(basicFriends);
        }
      });

      return () => {
        unsubscribeProfile();
        unsubscribeFriends();
      };
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const togglePreference = async (
    key: keyof NonNullable<UserData["preferences"]>
  ) => {
    if (!currentUser || !userData) return;
    const currentVal = userData.preferences?.[key] ?? true;
    const newVal = !currentVal;
    setUserData((prev) =>
      prev
        ? { ...prev, preferences: { ...prev.preferences, [key]: newVal } }
        : null
    );
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        [`preferences.${key}`]: newVal,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchUser = async () => {
    if (!searchText.trim()) return;
    setSearchLoading(true);
    setFoundUser(null);
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", searchText.trim().toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const friendId = querySnapshot.docs[0].id;
        if (friendId === currentUser?.uid) {
          Alert.alert("Ops", "Você não pode adicionar a si mesmo.");
          setSearchLoading(false);
          return;
        }
        if (friends.some((f) => f.friendId === friendId)) {
          Alert.alert("Já conectado", "Este viajante já está no seu círculo.");
          setSearchLoading(false);
          return;
        }
        setFoundUser({
          id: "",
          friendId: friendId,
          name: docData.name || "Sem nome",
          email: docData.email || "",
          zodiacSign: docData.zodiacSign,
        });
      } else {
        Alert.alert("Não encontrado", "Nenhum viajante encontrado.");
      }
    } catch (error) {
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
          if (currentUser)
            await deleteDoc(
              doc(db, "users", currentUser.uid, "friends", friend.id)
            );
        },
      },
    ]);
  };

  const handleCheckSynergy = (friend: Friend) => {
    if (!friend) return; // Proteção extra

    if (!userData?.zodiacSign || !friend.zodiacSign) {
      Alert.alert(
        "Mapa Incompleto",
        "Ambos precisam ter o signo definido para calcular a sinergia."
      );
      return;
    }
    const result = getAstralSynergy(userData.zodiacSign, friend.zodiacSign);

    setSynergyData({
      friend: friend,
      result,
    });
    setSynergyModalVisible(true);
  };

  const handleSendIntention = async (
    intention: (typeof INTENTIONS)[number]
  ) => {
    if (!currentUser || !synergyData || !userData) return;
    setSendingIntention(intention.id);
    try {
      await addDoc(
        collection(db, "users", synergyData.friend.friendId, "notifications"),
        {
          type: "intention",
          intentionId: intention.id,
          intentionLabel: intention.label,
          fromId: currentUser.uid,
          fromName: userData.name,
          createdAt: serverTimestamp(),
          read: false,
        }
      );

      // Proteção ao acessar o nome para o alerta
      const friendName = synergyData.friend.name
        ? synergyData.friend.name.split(" ")[0]
        : "Amigo";
      Alert.alert(
        "Energia Enviada",
        `Você enviou vibrações de ${intention.label} para ${friendName}. ✨`
      );

      setSynergyModalVisible(false);
    } catch (error) {
      Alert.alert("Erro", "A energia se dissipou no caminho.");
    } finally {
      setSendingIntention(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Encerrar Sessão", "Deseja se desconectar?", [
      { text: "Ficar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => signOut(auth) },
    ]);
  };

  const getPlanetInfo = (map: any[], planetName: string) => {
    if (!map || !Array.isArray(map)) return null;
    return map.find((p) => p.planet === planetName);
  };

  // Renderização segura do nome do amigo no modal
  const renderFriendName = () => {
    if (!synergyData?.friend?.name) return "Amigo";
    return synergyData.friend.name.split(" ")[0];
  };

  if (loading)
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accent} />
      </ThemedView>
    );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
              {userData?.name || "Viajante"}
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
              <View style={{ flexDirection: "row", gap: 15 }}>
                <TouchableOpacity
                  onPress={() =>
                    setViewMode(viewMode === "list" ? "galaxy" : "list")
                  }
                >
                  <MaterialIcons
                    name={viewMode === "list" ? "auto-graph" : "view-list"}
                    size={24}
                    color={themeColors.icon}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                  <MaterialIcons
                    name="person-add"
                    size={24}
                    color={themeColors.accent}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {friends.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>
                  Seu círculo está vazio.
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
            ) : viewMode === "list" ? (
              <FlatList
                data={friends}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.friendsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.friendItem}
                    onPress={() => handleCheckSynergy(item)}
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
                      {item.name ? item.name.split(" ")[0] : "Amigo"}
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
            ) : (
              userData && (
                <ConstellationView
                  user={userData}
                  friends={friends}
                  onPressFriend={handleCheckSynergy}
                />
              )
            )}
          </View>

          <View
            style={[styles.sectionCard, { backgroundColor: themeColors.card }]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setNotificationModalVisible(true)}
            >
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
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setPrivacyModalVisible(true)}
            >
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
          <ThemedText style={styles.versionText}>Astrum v1.5.0</ThemedText>
        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={synergyModalVisible}
        onRequestClose={() => setSynergyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <ThemedView
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.card, padding: 24 },
            ]}
          >
            {synergyData && (
              <>
                <View style={{ alignItems: "center", marginBottom: 15 }}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={40}
                    color={themeColors.accent}
                  />
                  {/* CORREÇÃO DO CRASH: Usando função segura para renderizar nome */}
                  <ThemedText type="subtitle" style={{ marginTop: 10 }}>
                    {renderFriendName()}
                  </ThemedText>
                  <ThemedText style={{ opacity: 0.6, fontSize: 12 }}>
                    Perfil Astral
                  </ThemedText>
                </View>

                {synergyData.friend.astralMap ? (
                  <View style={styles.triadContainer}>
                    <View style={styles.triadItem}>
                      <MaterialIcons
                        name="wb-sunny"
                        size={18}
                        color="#FFD700"
                      />
                      <ThemedText style={styles.triadLabel}>Sol</ThemedText>
                      <ThemedText style={styles.triadValue}>
                        {getPlanetInfo(synergyData.friend.astralMap, "Sol")
                          ?.sign || "-"}
                      </ThemedText>
                    </View>
                    <View style={[styles.triadItem, styles.triadBorder]}>
                      <MaterialIcons
                        name="nights-stay"
                        size={18}
                        color="#B0BEC5"
                      />
                      <ThemedText style={styles.triadLabel}>Lua</ThemedText>
                      <ThemedText style={styles.triadValue}>
                        {getPlanetInfo(synergyData.friend.astralMap, "Lua")
                          ?.sign || "-"}
                      </ThemedText>
                    </View>
                    <View style={styles.triadItem}>
                      <MaterialIcons
                        name="arrow-upward"
                        size={18}
                        color={themeColors.accent}
                      />
                      <ThemedText style={styles.triadLabel}>Asc</ThemedText>
                      <ThemedText style={styles.triadValue}>
                        {getPlanetInfo(
                          synergyData.friend.astralMap,
                          "Ascendente"
                        )?.sign || "-"}
                      </ThemedText>
                    </View>
                  </View>
                ) : (
                  <View style={styles.triadEmpty}>
                    <ThemedText
                      style={{
                        fontSize: 12,
                        opacity: 0.6,
                        fontStyle: "italic",
                      }}
                    >
                      Mapa astral não revelado.
                    </ThemedText>
                  </View>
                )}

                <View
                  style={[
                    styles.synergyCard,
                    { borderColor: themeColors.accent + "40", marginTop: 15 },
                  ]}
                >
                  <View style={styles.elementsRow}>
                    <View style={styles.elementBadge}>
                      <ThemedText style={styles.elementText}>
                        {synergyData.result.elementA}
                      </ThemedText>
                    </View>
                    <MaterialIcons
                      name="sync-alt"
                      size={20}
                      color={themeColors.icon}
                    />
                    <View style={styles.elementBadge}>
                      <ThemedText style={styles.elementText}>
                        {synergyData.result.elementB}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText
                    type="defaultSemiBold"
                    style={{
                      textAlign: "center",
                      marginBottom: 4,
                      color: themeColors.accent,
                    }}
                  >
                    {synergyData.result.title}
                  </ThemedText>
                  <ThemedText
                    style={{
                      textAlign: "center",
                      fontSize: 13,
                      lineHeight: 18,
                    }}
                  >
                    {synergyData.result.description}
                  </ThemedText>
                </View>

                <View style={styles.intentionsContainer}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.intentionsTitle}
                  >
                    Enviar Vibração
                  </ThemedText>
                  <View style={styles.intentionsRow}>
                    {INTENTIONS.map((intention) => (
                      <TouchableOpacity
                        key={intention.id}
                        style={[
                          styles.intentionButton,
                          {
                            backgroundColor: intention.color + "15",
                            borderColor: intention.color + "40",
                          },
                        ]}
                        onPress={() => handleSendIntention(intention)}
                        disabled={sendingIntention !== null}
                      >
                        {sendingIntention === intention.id ? (
                          <ActivityIndicator
                            size="small"
                            color={intention.color}
                          />
                        ) : (
                          <>
                            <MaterialIcons
                              name={intention.icon}
                              size={20}
                              color={intention.color}
                            />
                            <ThemedText
                              style={[
                                styles.intentionLabel,
                                { color: intention.color },
                              ]}
                            >
                              {intention.label}
                            </ThemedText>
                          </>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    { backgroundColor: themeColors.accent, marginTop: 15 },
                  ]}
                  onPress={() => setSynergyModalVisible(false)}
                >
                  <ThemedText style={{ color: "#FFF", fontWeight: "bold" }}>
                    Fechar
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
          </ThemedView>
        </View>
      </Modal>

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
              Busque um viajante pelo e-mail.
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
      {/* Modais de Config (Notificações/Privacidade) mantidos iguais */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <ThemedView
            style={[styles.modalContent, { backgroundColor: themeColors.card }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Notificações</ThemedText>
              <TouchableOpacity
                onPress={() => setNotificationModalVisible(false)}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={themeColors.icon}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.switchRow}>
              <View>
                <ThemedText style={styles.switchLabel}>
                  Permitir Notificações
                </ThemedText>
                <ThemedText style={styles.switchSubLabel}>
                  Receber alertas de rituais e amigos.
                </ThemedText>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: themeColors.accent }}
                thumbColor={"#f4f3f4"}
                onValueChange={() => togglePreference("notifications")}
                value={userData?.preferences?.notifications ?? true}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.searchButton,
                { backgroundColor: themeColors.accent, marginTop: 30 },
              ]}
              onPress={() => setNotificationModalVisible(false)}
            >
              <ThemedText style={{ color: "#FFF", fontWeight: "bold" }}>
                Concluído
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <ThemedView
            style={[styles.modalContent, { backgroundColor: themeColors.card }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Privacidade</ThemedText>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={themeColors.icon}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.switchRow}>
              <View>
                <ThemedText style={styles.switchLabel}>
                  Perfil Público
                </ThemedText>
                <ThemedText style={styles.switchSubLabel}>
                  Permitir que outros viajantes te encontrem.
                </ThemedText>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: themeColors.accent }}
                thumbColor={"#f4f3f4"}
                onValueChange={() => togglePreference("publicProfile")}
                value={userData?.preferences?.publicProfile ?? true}
              />
            </View>
            <View
              style={[
                styles.separator,
                {
                  backgroundColor: themeColors.icon + "20",
                  marginVertical: 15,
                },
              ]}
            />
            <View style={styles.switchRow}>
              <View>
                <ThemedText style={styles.switchLabel}>
                  Mostrar Signo
                </ThemedText>
                <ThemedText style={styles.switchSubLabel}>
                  Exibir seu signo no Círculo Mágico.
                </ThemedText>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: themeColors.accent }}
                thumbColor={"#f4f3f4"}
                onValueChange={() => togglePreference("showSign")}
                value={userData?.preferences?.showSign ?? true}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.searchButton,
                { backgroundColor: themeColors.accent, marginTop: 30 },
              ]}
              onPress={() => setPrivacyModalVisible(false)}
            >
              <ThemedText style={{ color: "#FFF", fontWeight: "bold" }}>
                Concluído
              </ThemedText>
            </TouchableOpacity>
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
  avatarImage: { width: "100%", height: "100%", borderRadius: 50 },
  avatarImageSmall: { width: "100%", height: "100%" },
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
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
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
  modalSubtitle: { fontSize: 14, opacity: 0.7, marginBottom: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 20,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
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
  addButton: { padding: 10, borderRadius: 25 },
  synergyCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(128,128,128,0.05)",
  },
  elementsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  elementBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(128,128,128,0.1)",
  },
  elementText: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase" },
  scoreContainer: { flexDirection: "row", marginTop: 15, gap: 4 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  switchLabel: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  switchSubLabel: { fontSize: 12, opacity: 0.6, maxWidth: "80%" },
  intentionsContainer: { marginTop: 20, width: "100%" },
  intentionsTitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 10,
    textAlign: "center",
  },
  intentionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  intentionButton: {
    flexBasis: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  intentionLabel: { fontSize: 13, fontWeight: "600" },
  triadContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 10,
    backgroundColor: "rgba(128,128,128,0.05)",
    borderRadius: 12,
  },
  triadItem: { alignItems: "center", flex: 1 },
  triadBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  triadLabel: {
    fontSize: 10,
    opacity: 0.5,
    textTransform: "uppercase",
    marginTop: 4,
  },
  triadValue: { fontSize: 14, fontWeight: "bold", marginTop: 2 },
  triadEmpty: { alignItems: "center", padding: 10, opacity: 0.5 },
});
