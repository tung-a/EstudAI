import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useChat } from "@/contexts/ChatContext";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MeditationModal } from "@/components/MeditationModal";
import { useCosmetics } from "@/contexts/CosmeticsContext";
import { LinearGradient } from "expo-linear-gradient";

type Event = {
  id: string;
  title: string;
  time: string;
  date: string;
};

const MAJOR_ARCANA = [
  "O Louco",
  "O Mago",
  "A Sacerdotisa",
  "A Imperatriz",
  "O Imperador",
  "O Hierofante",
  "Os Enamorados",
  "O Carro",
  "A Justiça",
  "O Eremita",
  "A Roda da Fortuna",
  "A Força",
  "O Enforcado",
  "A Morte",
  "A Temperança",
  "O Diabo",
  "A Torre",
  "A Estrela",
  "A Lua",
  "O Sol",
  "O Julgamento",
  "O Mundo",
];

// --- COMPONENTE: CARTA DE ESCOLHA (VERSO) ---
const TarotCardOption = ({
  onPress,
  disabled,
  animatedStyle,
  isInactive,
  stackOrder,
  accessibilityLabel,
  skinStyle,
}: {
  onPress: () => void;
  disabled: boolean;
  animatedStyle: any;
  isInactive: boolean;
  stackOrder: number;
  accessibilityLabel: string;
  skinStyle: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || isInactive}
    activeOpacity={0.9}
    style={{ opacity: isInactive ? 0.4 : 1, zIndex: stackOrder }}
    accessibilityLabel={accessibilityLabel}
  >
    <Animated.View
      style={[
        styles.tarotCardOption,
        animatedStyle,
        {
          zIndex: stackOrder,
          borderColor: skinStyle.borderColor,
          backgroundColor: "transparent",
          overflow: "hidden",
        },
      ]}
    >
      {/* SKIN DA CARTA (VERSO) */}
      <LinearGradient
        colors={skinStyle.colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <MaterialIcons
        name="auto-awesome"
        size={32}
        color={skinStyle.iconColor}
      />
    </Animated.View>
  </TouchableOpacity>
);

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  // --- HOOKS ---
  const { getChatModel } = useChat();
  const { currentSkinStyle } = useCosmetics(); // Pegando a skin equipada
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  // --- ESTADOS ---
  const [user, setUser] = useState<User | null>(null);
  const [userSign, setUserSign] = useState<string>("");

  // --- ESTADOS DE AGENDA (Loading Separado) ---
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(true);

  const [loading, setLoading] = useState(true);

  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);

  const [tarotCard, setTarotCard] = useState<{
    name: string;
    meaning: string;
  } | null>(null);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [deckModalVisible, setDeckModalVisible] = useState(false);
  const [meditationVisible, setMeditationVisible] = useState(false);

  const [modalContent, setModalContent] = useState<{
    title: string;
    content: string;
    icon: any;
    type: "horoscope" | "tarot";
  }>({
    title: "",
    content: "",
    icon: "auto-awesome",
    type: "horoscope",
  });

  // --- ANIMAÇÕES DO TAROT ---
  const [isChoosing, setIsChoosing] = useState(false);
  const [cardRevealAnim] = useState(new Animated.Value(0));
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );
  const cardMotionValues = useRef<Animated.Value[]>(
    Array.from({ length: 3 }, () => new Animated.Value(1))
  ).current;
  const cardShakeValues = useRef<Animated.Value[]>(
    Array.from({ length: 3 }, () => new Animated.Value(0))
  ).current;
  const shakeLoops = useRef<Animated.CompositeAnimation[]>([]);

  const stopShakeSequence = useCallback(() => {
    shakeLoops.current.forEach((loop) => loop.stop());
    shakeLoops.current = [];
    cardShakeValues.forEach((value) => value.setValue(0));
  }, [cardShakeValues]);

  const startShakeSequence = useCallback(() => {
    stopShakeSequence();
    shakeLoops.current = cardShakeValues.map((value, index) => {
      value.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 140,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: -1,
            duration: 140,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 140,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
      setTimeout(() => loop.start(), index * 60);
      return loop;
    });
  }, [cardShakeValues, stopShakeSequence]);

  const playEntranceSequence = useCallback(() => {
    cardMotionValues.forEach((value) => value.setValue(1));
    Animated.stagger(
      120,
      cardMotionValues.map((value) =>
        Animated.spring(value, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
        })
      )
    ).start(({ finished }) => {
      if (finished) startShakeSequence();
    });
  }, [cardMotionValues, startShakeSequence]);

  const animateCardSelection = (index: number) => {
    Animated.parallel(
      cardMotionValues.map((value, cardIndex) =>
        cardIndex === index
          ? Animated.spring(value, {
              toValue: -0.3,
              useNativeDriver: true,
              friction: 6,
            })
          : Animated.timing(value, {
              toValue: 2,
              duration: 320,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            })
      )
    ).start();
  };

  const triggerSuccessHaptic = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, []);

  useEffect(() => {
    if (deckModalVisible && !tarotCard) {
      playEntranceSequence();
    }
  }, [deckModalVisible, tarotCard, playEntranceSequence]);

  const getTodayKey = () => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  };

  // --- EFEITOS DE DADOS ---

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.zodiacSign) {
          setUserSign(data.zodiacSign);
        }
        const today = getTodayKey();
        if (data.dailyHoroscope && data.dailyHoroscope.date === today) {
          setHoroscope(data.dailyHoroscope.content);
        }
        if (data.dailyTarot && data.dailyTarot.date === today) {
          setTarotCard({
            name: data.dailyTarot.card,
            meaning: data.dailyTarot.meaning,
          });
        }
      }
    });
    return () => unsubscribeSnapshot();
  }, [user]);

  useEffect(() => {
    const generateHoroscope = async () => {
      if (!user || !userSign || horoscope || horoscopeLoading) return;
      setHoroscopeLoading(true);
      try {
        const model = getChatModel();
        const prompt = `Gere um horóscopo do dia curto e inspirador para o signo de ${userSign}. Foco: autoconhecimento. Máximo de 3 frases.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        setHoroscope(text);
        await updateDoc(doc(db, "users", user.uid), {
          dailyHoroscope: { date: getTodayKey(), content: text },
        });
      } catch (error: any) {
        setHoroscope("As estrelas estão se realinhando.");
      } finally {
        setHoroscopeLoading(false);
      }
    };
    if (user && userSign) {
      generateHoroscope();
    }
  }, [user, userSign]);

  // --- HANDLERS TAROT ---

  const openTarotDeck = () => {
    if (tarotCard) {
      openDetailsModal("tarot");
    } else {
      setDeckModalVisible(true);
      cardRevealAnim.setValue(0);
      setIsChoosing(false);
      setSelectedCardIndex(null);
    }
  };

  const handleChooseCard = async (cardIndex: number) => {
    if (isChoosing || !user) return;
    setIsChoosing(true);
    setSelectedCardIndex(cardIndex);
    stopShakeSequence();
    animateCardSelection(cardIndex);
    try {
      const randomCard =
        MAJOR_ARCANA[Math.floor(Math.random() * MAJOR_ARCANA.length)];
      const model = getChatModel();
      const prompt = `O usuário tirou a carta de Tarot "${randomCard}" para o dia de hoje. Dê uma interpretação mística, direta e curta (2 a 3 frases).`;
      const result = await model.generateContent(prompt);
      const meaning = result.response.text().trim();
      setTarotCard({ name: randomCard, meaning: meaning });
      await triggerSuccessHaptic();
      await updateDoc(doc(db, "users", user.uid), {
        dailyTarot: { date: getTodayKey(), card: randomCard, meaning: meaning },
      });
      await triggerSuccessHaptic();
      cardRevealAnim.setValue(0);
      Animated.spring(cardRevealAnim, {
        toValue: 1,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      console.error("Erro no Tarot:", error);
      playEntranceSequence();
      setSelectedCardIndex(null);
      if (error.message?.includes("429")) {
        alert("O oráculo está sobrecarregado.");
        setDeckModalVisible(false);
      }
    } finally {
      setIsChoosing(false);
    }
  };

  const closeDeckModal = () => {
    setDeckModalVisible(false);
    setSelectedCardIndex(null);
    stopShakeSequence();
  };

  const openDetailsModal = (type: "horoscope" | "tarot") => {
    if (type === "horoscope") {
      if (!horoscope) return;
      setModalContent({
        title: `Horóscopo (${userSign})`,
        content: horoscope,
        icon: "auto-awesome",
        type: "horoscope",
      });
    } else {
      if (!tarotCard) return;
      setModalContent({
        title: tarotCard.name,
        content: tarotCard.meaning,
        icon: "style",
        type: "tarot",
      });
    }
    setDetailsModalVisible(true);
  };

  const handleDiscussWithOracle = () => {
    setDetailsModalVisible(false);
    const initialPrompt = `Tirei a carta "${modalContent.title}" no Tarot de hoje, que diz: "${modalContent.content}". O que isso significa para o meu momento atual?`;
    setTimeout(() => {
      navigation.navigate("chat", { initialPrompt });
    }, 200);
  };

  // --- HANDLERS AGENDA (CORRIGIDO) ---
  useEffect(() => {
    if (!user) {
      setAgendaLoading(false);
      return;
    }

    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const todayString = new Date(today.getTime() - offset)
      .toISOString()
      .split("T")[0];

    const eventsQuery = query(
      collection(db, "users", user.uid, "events"),
      where("date", "==", todayString)
    );

    const unsubscribeEvents = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const events: Event[] = [];
        snapshot.forEach((doc) =>
          events.push({ id: doc.id, ...doc.data() } as Event)
        );
        events.sort((a, b) => a.time.localeCompare(b.time));
        setTodaysEvents(events);
        setAgendaLoading(false);
      },
      (error) => {
        console.error("Erro agenda:", error);
        setAgendaLoading(false);
      }
    );
    return () => unsubscribeEvents();
  }, [user]);

  const userName = user?.displayName?.split(" ")[0] || "Viajante";
  const backInterpolate = cardRevealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const frontInterpolate = cardRevealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });
  const backAnimatedStyle = {
    transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
  };
  const frontAnimatedStyle = {
    transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
  };

  // CORREÇÃO: Texto da carta deve ser branco (ou cor da skin)
  // para garantir contraste sobre o gradiente da skin
  const cardFrontTitleColor = currentSkinStyle.iconColor;
  const cardFrontTextColor = "#FFFFFF";

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.greeting}>
              Olá, {userName}! ✨
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              O universo saúda sua jornada hoje.
            </ThemedText>
          </View>

          <View style={styles.gridContainer}>
            {/* Horóscopo */}
            <TouchableOpacity
              style={[
                styles.gridCard,
                {
                  borderColor: themeColors.accent,
                  borderWidth: 0.5,
                  backgroundColor: "#FFF3E0",
                },
              ]}
              onPress={() => openDetailsModal("horoscope")}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderSmall}>
                <MaterialIcons
                  name="auto-awesome"
                  size={18}
                  color={themeColors.accent}
                />
                <ThemedText
                  style={[styles.cardLabel, { color: themeColors.accent }]}
                >
                  {userSign || "Signo"}
                </ThemedText>
              </View>
              {horoscopeLoading ? (
                <ActivityIndicator size="small" color={themeColors.accent} />
              ) : (
                <>
                  <Text
                    style={[styles.miniText, { color: "#4E342E" }]}
                    numberOfLines={5}
                    ellipsizeMode="tail"
                  >
                    {horoscope || "Conectando..."}
                  </Text>
                  {!horoscopeLoading && horoscope && (
                    <Text
                      style={[styles.readMore, { color: themeColors.accent }]}
                    >
                      Ler completo
                    </Text>
                  )}
                </>
              )}
            </TouchableOpacity>

            {/* Tarot do Dia (COM CORREÇÃO DE SKIN E TEXTO) */}
            <TouchableOpacity
              style={[
                styles.gridCard,
                styles.tarotCardTouchable,
                // Removemos padding e borda para o gradiente preencher
                tarotCard
                  ? {
                      borderWidth: 0,
                      backgroundColor: "transparent",
                      padding: 0,
                    }
                  : {
                      borderWidth: 0,
                      backgroundColor: "transparent",
                      padding: 0,
                    },
              ]}
              onPress={openTarotDeck}
              activeOpacity={0.9}
            >
              {/* Verso (Skin) */}
              {!tarotCard && (
                <View
                  style={[
                    styles.cardBackContent,
                    {
                      width: "100%",
                      height: "100%",
                      borderRadius: 16,
                      overflow: "hidden",
                    },
                  ]}
                >
                  <LinearGradient
                    colors={currentSkinStyle.colors as [string, string]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                      flex: 1,
                    }}
                  >
                    <MaterialIcons
                      name="auto-awesome"
                      size={40}
                      color={currentSkinStyle.iconColor}
                      style={{ marginBottom: 8 }}
                    />
                    <ThemedText style={styles.cardBackTitle}>
                      Carta do Dia
                    </ThemedText>
                    <ThemedText style={styles.cardBackSubtitle}>
                      Toque para escolher
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Frente (Revelado com Skin) */}
              {tarotCard && (
                <View
                  style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  {/* Fundo: Gradiente da Skin */}
                  <LinearGradient
                    colors={currentSkinStyle.colors as [string, string]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />

                  {/* Conteúdo com Sombra leve para contraste */}
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 15,
                      backgroundColor: "rgba(0,0,0,0.25)", // Sombra para garantir leitura
                    }}
                  >
                    <MaterialIcons
                      name="style"
                      size={28}
                      color={cardFrontTitleColor}
                      style={{ marginBottom: 8 }}
                    />
                    <Text
                      style={[styles.tarotName, { color: cardFrontTitleColor }]}
                    >
                      {tarotCard.name}
                    </Text>
                    <Text
                      style={[
                        styles.miniText,
                        { textAlign: "center", color: cardFrontTextColor },
                      ]}
                      numberOfLines={3}
                    >
                      {tarotCard.meaning}
                    </Text>
                    <Text
                      style={[
                        styles.readMore,
                        { color: cardFrontTitleColor, marginTop: 8 },
                      ]}
                    >
                      Ler completo
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="today"
                size={22}
                color={themeColors.icon}
                style={styles.cardIcon}
              />
              <ThemedText type="subtitle">Rituais de Hoje</ThemedText>
            </View>
            {agendaLoading ? (
              <ActivityIndicator
                style={styles.loadingIndicator}
                color={themeColors.accent}
              />
            ) : todaysEvents.length > 0 ? (
              <View style={styles.eventListContainer}>
                {todaysEvents.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.eventItemNew,
                      index < todaysEvents.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: themeColors.icon + "30",
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="brightness-1"
                      size={8}
                      color={themeColors.accent}
                      style={styles.eventIcon}
                    />
                    <View style={styles.eventTextContainer}>
                      <ThemedText style={styles.eventTitleNew}>
                        {item.title}
                      </ThemedText>
                      <ThemedText style={styles.eventTimeNew}>
                        {item.time}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCardContent}>
                <MaterialIcons
                  name="nights-stay"
                  size={30}
                  color={themeColors.icon + "80"}
                />
                <ThemedText style={styles.emptyText}>
                  O cosmos está calmo hoje.
                </ThemedText>
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => navigation.navigate("agenda" as never)}
                >
                  <ThemedText style={styles.emptyActionText}>
                    Agendar Ritual
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>

          <ThemedView
            lightColor={Colors.light.card}
            darkColor={Colors.dark.card}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="explore"
                size={22}
                color={themeColors.icon}
                style={styles.cardIcon}
              />
              <ThemedText type="subtitle">Jornada Interior</ThemedText>
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: themeColors.accent + "1A" },
                ]}
                onPress={() => navigation.navigate("chat" as never)}
              >
                <MaterialIcons
                  name="psychology"
                  size={20}
                  color={themeColors.accent}
                  style={styles.actionIcon}
                />
                <ThemedText
                  style={[styles.actionText, { color: themeColors.accent }]}
                >
                  Consultar o Oráculo
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: themeColors.accent + "1A" },
                ]}
                onPress={() => navigation.navigate("profile" as never)}
              >
                <MaterialIcons
                  name="stars"
                  size={20}
                  color={themeColors.accent}
                  style={styles.actionIcon}
                />
                <ThemedText
                  style={[styles.actionText, { color: themeColors.accent }]}
                >
                  Ver meu Mapa Astral
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: themeColors.accent + "1A" },
                ]}
                onPress={() => setMeditationVisible(true)}
              >
                <MaterialIcons
                  name="self-improvement"
                  size={20}
                  color={themeColors.accent}
                  style={styles.actionIcon}
                />
                <ThemedText
                  style={[styles.actionText, { color: themeColors.accent }]}
                >
                  Entrar no Santuário (Meditar)
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>

      {/* --- MODAL MESA DE TAROT (COM SKINS) --- */}
      <Modal
        visible={deckModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeckModal}
      >
        <View style={styles.deckModalOverlay}>
          <Image
            source={require("@/assets/images/mesa_tarot.png")}
            style={styles.deckBackground}
          />
          <View style={styles.deckContent}>
            <ThemedText
              type="title"
              style={{ color: "#FFF", marginBottom: 10, textAlign: "center" }}
            >
              {tarotCard ? "Sua Revelação" : "Conecte-se..."}
            </ThemedText>
            <Text
              style={{
                color: "#FFF",
                opacity: 0.7,
                marginBottom: 40,
                textAlign: "center",
              }}
            >
              {tarotCard
                ? "O universo falou."
                : "Escolha uma carta com sua intuição"}
            </Text>

            <View style={styles.cardsRow}>
              {!tarotCard ? (
                [0, 1, 2].map((cardIndex) => {
                  const rotate =
                    cardIndex === 0
                      ? "-5deg"
                      : cardIndex === 2
                      ? "5deg"
                      : "0deg";
                  const marginTop = cardIndex === 1 ? 0 : 20;
                  return (
                    <TarotCardOption
                      key={`tarot-card-${cardIndex}`}
                      onPress={() => handleChooseCard(cardIndex)}
                      disabled={isChoosing}
                      isInactive={
                        selectedCardIndex !== null &&
                        selectedCardIndex !== cardIndex
                      }
                      stackOrder={
                        selectedCardIndex === cardIndex ? 10 : cardIndex + 1
                      }
                      accessibilityLabel={`Carta ${cardIndex + 1}`}
                      skinStyle={currentSkinStyle}
                      animatedStyle={{
                        marginTop,
                        transform: [
                          {
                            translateY: cardMotionValues[cardIndex].interpolate(
                              {
                                inputRange: [-0.3, 0, 1, 2],
                                outputRange: [-20, 0, 120, 400],
                              }
                            ),
                          },
                          {
                            scale: cardMotionValues[cardIndex].interpolate({
                              inputRange: [-0.3, 0, 1, 2],
                              outputRange: [1.05, 1, 0.95, 0.9],
                            }),
                          },
                          {
                            rotateZ: cardShakeValues[cardIndex].interpolate({
                              inputRange: [-1, 0, 1],
                              outputRange: ["-1.6deg", "0deg", "1.6deg"],
                            }),
                          },
                          { rotate },
                        ],
                        opacity: cardMotionValues[cardIndex].interpolate({
                          inputRange: [0, 1.5, 2],
                          outputRange: [1, 1, 0],
                        }),
                      }}
                    />
                  );
                })
              ) : (
                <View style={styles.flipContainer}>
                  {/* Verso (Skin) */}
                  <Animated.View
                    style={[
                      styles.flipCard,
                      styles.flipCardBack,
                      backAnimatedStyle,
                      {
                        borderColor: currentSkinStyle.borderColor,
                        borderWidth: 0,
                        backgroundColor: "transparent",
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={currentSkinStyle.colors as [string, string]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <MaterialIcons
                      name="auto-awesome"
                      size={40}
                      color={currentSkinStyle.iconColor}
                    />
                  </Animated.View>

                  {/* Frente (Skin preenchendo tudo) */}
                  <Animated.View
                    style={[
                      styles.flipCard,
                      styles.flipCardFront,
                      frontAnimatedStyle,
                      { padding: 0 },
                    ]}
                  >
                    <LinearGradient
                      colors={currentSkinStyle.colors as [string, string]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <View
                      style={{
                        flex: 1,
                        width: "100%",
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 20,
                        backgroundColor: "rgba(0,0,0,0.25)",
                      }}
                    >
                      <MaterialIcons
                        name="style"
                        size={40}
                        color={cardFrontTitleColor}
                        style={{ marginBottom: 15 }}
                      />
                      <ThemedText
                        type="subtitle"
                        style={{
                          color: cardFrontTitleColor,
                          marginBottom: 10,
                          textAlign: "center",
                        }}
                      >
                        {tarotCard.name}
                      </ThemedText>
                      <ThemedText
                        style={{
                          textAlign: "center",
                          paddingHorizontal: 10,
                          color: cardFrontTextColor,
                        }}
                        numberOfLines={5}
                      >
                        {tarotCard.meaning}
                      </ThemedText>
                    </View>
                  </Animated.View>
                </View>
              )}
            </View>
            {isChoosing && !tarotCard && (
              <ActivityIndicator
                size="large"
                color="#FFF"
                style={{ marginTop: 40 }}
              />
            )}
            {tarotCard && (
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: themeColors.accent,
                    marginTop: 50,
                    width: "80%",
                  },
                ]}
                onPress={closeDeckModal}
              >
                <Text style={[styles.modalButtonText, { color: "#FFF" }]}>
                  Aceitar Mensagem
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Detalhes (COM SKIN APLICADA) */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Usamos View comum + Gradiente */}
          <View
            style={[
              styles.modalContent,
              { backgroundColor: "transparent", overflow: "hidden" },
            ]}
          >
            {/* 1. Fundo: Gradiente da Skin */}
            <LinearGradient
              colors={currentSkinStyle.colors as [string, string]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* 2. Overlay Escuro: Para garantir leitura */}
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(0,0,0,0.65)" },
              ]}
            />

            {/* 3. Conteúdo */}
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <MaterialIcons
                  name={modalContent.icon}
                  size={24}
                  color={currentSkinStyle.iconColor}
                />
                <ThemedText type="subtitle" style={{ color: "#FFF" }}>
                  {modalContent.title}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalText, { color: "#FFF", opacity: 0.9 }]}>
                {modalContent.content}
              </Text>
            </ScrollView>

            <View style={styles.modalActions}>
              {modalContent.type === "tarot" && (
                <TouchableOpacity
                  style={[
                    styles.modalButtonSecondary,
                    { borderColor: currentSkinStyle.iconColor },
                  ]}
                  onPress={handleDiscussWithOracle}
                >
                  <MaterialIcons
                    name="chat"
                    size={18}
                    color={currentSkinStyle.iconColor}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: currentSkinStyle.iconColor },
                    ]}
                  >
                    Conversar
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: currentSkinStyle.iconColor, flex: 1 },
                ]}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    {
                      color:
                        currentSkinStyle.iconColor === "#FFF" ? "#000" : "#FFF",
                    },
                  ]}
                >
                  Gratidão
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <MeditationModal
        visible={meditationVisible}
        onClose={() => setMeditationVisible(false)}
        userSign={userSign}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 28 },
  headerSubtitle: { fontSize: 16, opacity: 0.7, marginTop: 6 },
  gridContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },

  // CORREÇÃO DA ALTURA DO CARD
  gridCard: {
    flex: 1,
    borderRadius: 16,
    padding: 15,
    height: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardLabel: { fontSize: 14, fontWeight: "bold", marginLeft: 6 },
  cardHeaderSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  miniText: { fontSize: 14, lineHeight: 20, opacity: 0.9 },
  readMore: {
    fontSize: 12,
    marginTop: 10,
    fontWeight: "bold",
    alignSelf: "flex-start",
  },
  tarotCardTouchable: { justifyContent: "center", alignItems: "center" },
  cardBackContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardBackTitle: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  cardBackSubtitle: {
    color: "#FFF",
    fontSize: 11,
    opacity: 0.9,
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },

  cardContent: { alignItems: "center", width: "100%" },
  tarotName: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  cardIcon: { marginRight: 10 },
  loadingIndicator: { marginTop: 20, marginBottom: 10 },
  eventListContainer: { marginTop: 8 },
  eventItemNew: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  eventIcon: { marginRight: 12, marginLeft: 4 },
  eventTextContainer: { flex: 1 },
  eventTitleNew: { fontSize: 15, fontWeight: "500", marginBottom: 2 },
  eventTimeNew: { fontSize: 13, opacity: 0.7 },
  emptyCardContent: { alignItems: "center", paddingVertical: 20, gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center", opacity: 0.7 },
  emptyActionButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.light.tint + "1A",
  },
  emptyActionText: {
    color: Colors.light.tint,
    fontWeight: "600",
    fontSize: 14,
  },
  actionsContainer: { marginTop: 8, gap: 12 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionIcon: { marginRight: 12 },
  actionText: { fontWeight: "600", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "60%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  modalBody: { marginBottom: 20 },
  modalText: { fontSize: 16, lineHeight: 24, opacity: 0.9 },
  modalActions: { flexDirection: "row", gap: 15, justifyContent: "flex-end" },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  modalButtonText: { fontWeight: "bold", fontSize: 15 },
  deckModalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  deckBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
  },
  deckContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 320,
    width: "100%",
  },
  tarotCardOption: {
    width: 100,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: -15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 6.27,
    elevation: 10,
  },
  flipContainer: {
    width: 240,
    height: 360,
    alignItems: "center",
    justifyContent: "center",
  },
  flipCard: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    position: "absolute",
    backfaceVisibility: "hidden",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  flipCardFront: { backgroundColor: "transparent", overflow: "hidden" },
  flipCardBack: { borderWidth: 1, overflow: "hidden" },
});
