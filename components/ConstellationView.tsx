import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ZodiacImages, getAstralSynergy } from "@/lib/astrology";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CONTAINER_SIZE = width - 32;
const CENTER = CONTAINER_SIZE / 2;
const ORBIT_STEP = 45;

type UserData = { name: string; zodiacSign?: string };

// Definição completa do tipo Friend
export type Friend = {
  id: string;
  friendId: string;
  name: string;
  email: string;
  zodiacSign?: string;
  dailyTarot?: {
    card: string;
    date: string;
  };
  astralMap?: {
    planet: string;
    sign: string;
    element: string;
    house: string;
  }[];
  [key: string]: any;
};

interface ConstellationViewProps {
  user: UserData;
  friends: Friend[];
  onPressFriend: (friend: Friend) => void;
}

// --- COMPONENTE INTERNO: GRUPO DE ÓRBITA ---
// Gerencia a rotação automática de um anel específico baseado no Score
const OrbitGroup = ({
  score,
  radius,
  friends,
  onPressFriend,
  themeColors,
}: {
  score: number;
  radius: number;
  friends: Friend[];
  onPressFriend: (f: Friend) => void;
  themeColors: any;
}) => {
  const orbitRotation = useSharedValue(0);

  // Quanto maior o score (afinidade), menor a duração (mais rápido)
  const speedDuration = 125000 / (score || 0.5);

  useEffect(() => {
    // Inicia em uma posição aleatória para não ficarem todos alinhados
    orbitRotation.value = Math.random() * Math.PI * 2;

    orbitRotation.value = withRepeat(
      withTiming(orbitRotation.value + 2 * Math.PI, {
        duration: speedDuration,
        easing: Easing.linear,
      }),
      -1, // Infinito
      false
    );
  }, [score]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${orbitRotation.value}rad` }],
  }));

  // Lógica de Aura baseada na carta do dia
  const getAuraColor = (card?: string) => {
    if (!card) return { color: themeColors.icon, width: 1 };

    const expansion = [
      "O Sol",
      "O Mundo",
      "O Mago",
      "A Imperatriz",
      "A Roda da Fortuna",
      "A Estrela",
      "O Carro",
      "A Força",
      "O Julgamento",
      "O Imperador",
    ];
    const challenge = [
      "A Torre",
      "A Morte",
      "O Diabo",
      "O Louco",
      "Os Enamorados",
      "A Justiça",
    ];
    // As demais caem no neutro/introspectivo (Prata)

    if (expansion.includes(card))
      return { color: "#FFD700", width: 2, type: "expansion" }; // Ouro
    if (challenge.includes(card))
      return { color: "#FF5722", width: 2, type: "challenge" }; // Laranja
    return { color: "#B0BEC5", width: 2, type: "introspection" }; // Prata
  };

  return (
    <Animated.View
      style={[styles.orbitLayer, animatedStyle]}
      pointerEvents="box-none"
    >
      {friends.map((friend, index) => {
        const angleStep = (2 * Math.PI) / friends.length;
        const angle = index * angleStep;

        // Posicionamento circular
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const size = score >= 4 ? 44 : 36;

        const aura = getAuraColor(friend.dailyTarot?.card);
        const hasAura = !!friend.dailyTarot?.card;

        return (
          <View
            key={friend.id}
            style={{
              position: "absolute",
              left: CENTER + x - size / 2,
              top: CENTER + y - size / 2,
            }}
          >
            <TouchableOpacity
              onPress={() => onPressFriend(friend)}
              style={{ alignItems: "center" }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.planetAvatar,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderColor: hasAura
                      ? aura.color
                      : score >= 4
                      ? themeColors.accent
                      : themeColors.icon,
                    borderWidth: hasAura ? 2 : score >= 5 ? 2 : 1,
                    backgroundColor: themeColors.background,
                    // Efeito de brilho para aura de expansão
                    shadowColor:
                      aura.type === "expansion" ? aura.color : "#000",
                    shadowOpacity: aura.type === "expansion" ? 0.6 : 0.2,
                    shadowRadius: aura.type === "expansion" ? 6 : 3,
                    elevation: aura.type === "expansion" ? 6 : 3,
                  },
                ]}
              >
                {friend.zodiacSign && ZodiacImages[friend.zodiacSign] ? (
                  <Image
                    source={ZodiacImages[friend.zodiacSign]}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <MaterialIcons
                    name="person"
                    size={size * 0.6}
                    color={themeColors.icon}
                  />
                )}
              </View>

              {/* Ícone indicador de Aura */}
              {hasAura && (
                <View
                  style={[styles.auraBadge, { backgroundColor: aura.color }]}
                >
                  <MaterialIcons
                    name={
                      aura.type === "expansion"
                        ? "wb-sunny"
                        : aura.type === "challenge"
                        ? "bolt"
                        : "nights-stay"
                    }
                    size={8}
                    color="#FFF"
                  />
                </View>
              )}

              <View style={styles.planetLabelContainer}>
                <ThemedText
                  style={[
                    styles.planetLabel,
                    { fontSize: score >= 4 ? 10 : 9 },
                  ]}
                >
                  {friend.name.split(" ")[0]}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </Animated.View>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const ConstellationView: React.FC<ConstellationViewProps> = ({
  user,
  friends,
  onPressFriend,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  // Rotação manual (Gesto)
  const gestureRotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);
  const sunPulse = useSharedValue(1);

  useEffect(() => {
    // Pulso do Sol
    sunPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const pan = Gesture.Pan()
    .onStart(() => {
      cancelAnimation(gestureRotation);
      savedRotation.value = gestureRotation.value;
    })
    .onUpdate((e) => {
      gestureRotation.value = savedRotation.value + e.translationX * 0.005;
    })
    .onEnd((e) => {
      gestureRotation.value = withDecay({
        velocity: e.velocityX * 0.002,
        deceleration: 0.998,
      });
    });

  const animatedGestureStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${gestureRotation.value}rad` }],
  }));

  const animatedSunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunPulse.value }],
  }));

  const orbits = useMemo(() => {
    const groups: { [key: number]: Friend[] } = {
      5: [],
      4: [],
      3: [],
      2: [],
      1: [],
      0: [],
    };
    friends.forEach((friend) => {
      let score = 0;
      if (user.zodiacSign && friend.zodiacSign) {
        score = getAstralSynergy(user.zodiacSign, friend.zodiacSign).score;
      }
      groups[score].push(friend);
    });
    return groups;
  }, [user, friends]);

  // Renderiza os anéis de fundo (Estáticos em relação à rotação automática)
  const renderOrbitRings = () => {
    return [1, 2, 3, 4, 5].map((i) => {
      const radius = 60 + (i - 1) * ORBIT_STEP;
      const diameter = radius * 2;
      return (
        <View
          key={`ring-${i}`}
          style={[
            styles.orbitRing,
            {
              width: diameter,
              height: diameter,
              borderRadius: radius,
              borderColor: themeColors.icon + "15",
              left: CENTER - radius,
              top: CENTER - radius,
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={[styles.container, { height: CONTAINER_SIZE + 40 }]}>
      <ThemedText style={styles.hintText}>
        Gire o cosmos para explorar
      </ThemedText>

      <GestureDetector gesture={pan}>
        <View
          style={[
            styles.universe,
            { width: CONTAINER_SIZE, height: CONTAINER_SIZE },
          ]}
        >
          {/* Camada controlada pelo Gesto */}
          <Animated.View style={[styles.layer, animatedGestureStyle]}>
            {/* 1. Anéis de Fundo (Giram com o dedo) */}
            {renderOrbitRings()}

            {/* 2. Grupos de Planetas (Giram com o dedo + Rotação Automática própria) */}
            {[5, 4, 3, 2, 1].map((score, i) => {
              const group = orbits[score as keyof typeof orbits];
              if (!group || group.length === 0) return null;

              // Score 5 (perto) -> Index visual 0
              const radius = 60 + (6 - score - 1) * ORBIT_STEP;

              return (
                <OrbitGroup
                  key={`orbit-group-${score}`}
                  score={score}
                  radius={radius}
                  friends={group}
                  onPressFriend={onPressFriend}
                  themeColors={themeColors}
                />
              );
            })}
          </Animated.View>

          {/* Camada Central (Sol/Usuário) - Fica fixa visualmente no centro */}
          <Animated.View
            style={[
              styles.sunWrapper,
              animatedSunStyle,
              {
                left: CENTER - 35,
                top: CENTER - 35,
                shadowColor: themeColors.accent,
              },
            ]}
          >
            <View
              style={[
                styles.sunInner,
                {
                  borderColor: themeColors.accent,
                  backgroundColor: themeColors.card,
                },
              ]}
            >
              {user.zodiacSign && ZodiacImages[user.zodiacSign] ? (
                <Image
                  source={ZodiacImages[user.zodiacSign]}
                  style={styles.sunImage}
                />
              ) : (
                <MaterialIcons
                  name="person"
                  size={32}
                  color={themeColors.icon}
                />
              )}
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    overflow: "hidden",
  },
  hintText: {
    position: "absolute",
    top: 0,
    zIndex: 10,
    fontSize: 12,
    opacity: 0.4,
    fontStyle: "italic",
    width: "100%",
    textAlign: "center",
  },
  universe: {
    justifyContent: "center",
    alignItems: "center",
  },
  layer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  orbitLayer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  orbitRing: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "solid",
  },
  sunWrapper: {
    position: "absolute",
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  sunInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  sunImage: {
    width: "100%",
    height: "100%",
  },
  planetAvatar: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  planetLabelContainer: {
    marginTop: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planetLabel: {
    fontWeight: "600",
    textAlign: "center",
  },
  auraBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFF",
    elevation: 4,
    zIndex: 10,
  },
});
