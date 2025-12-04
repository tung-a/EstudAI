import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useChat } from "@/contexts/ChatContext";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { doc, increment, setDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type MeditationModalProps = {
  visible: boolean;
  onClose: () => void;
  userSign?: string;
};

// Tipagem correta para os ícones
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

type ThemeItem = {
  id: string;
  label: string;
  icon: MaterialIconName;
  color: string;
  prompt: string;
  soundFile: any;
};

const THEMES: ThemeItem[] = [
  {
    id: "calm",
    label: "Calma",
    icon: "spa",
    color: "#4CAF50",
    prompt: "acalmar a ansiedade e trazer paz profunda",
    soundFile: require("@/assets/sounds/calm.mp3"),
  },
  {
    id: "focus",
    label: "Foco",
    icon: "filter-center-focus",
    color: "#2196F3",
    prompt: "aumentar a concentração e clareza mental",
    soundFile: require("@/assets/sounds/focus.mp3"),
  },
  {
    id: "sleep",
    label: "Sono",
    icon: "bedtime",
    color: "#673AB7",
    prompt: "relaxar para um sono reparador",
    soundFile: require("@/assets/sounds/sleep.mp3"),
  },
  {
    id: "energy",
    label: "Energia",
    icon: "bolt",
    color: "#FF9800",
    prompt: "revitalizar a aura e despertar poder",
    soundFile: require("@/assets/sounds/energy.mp3"),
  },
];

export function MeditationModal({
  visible,
  onClose,
  userSign,
}: MeditationModalProps) {
  const { getChatModel } = useChat();
  const [step, setStep] = useState<"choose" | "meditating">("choose");
  const [selectedTheme, setSelectedTheme] = useState<ThemeItem>(THEMES[0]);
  const [script, setScript] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const sessionStartTime = useRef<number | null>(null);
  const soundObject = useRef<Audio.Sound | null>(null);
  const hapticInterval = useRef<any>(null);

  const breathScale = useSharedValue(1);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    if (!visible) {
      stopSession();
    }

    return () => {
      unloadSound();
    };
  }, [visible]);

  const loadAndPlaySound = async (theme: ThemeItem) => {
    try {
      await unloadSound();
      const { sound } = await Audio.Sound.createAsync(theme.soundFile, {
        isLooping: true,
        volume: 0.5,
        shouldPlay: !isMuted,
      });
      soundObject.current = sound;
    } catch (error) {
      console.log("Erro ao carregar som (verifique assets/sounds):", error);
    }
  };

  const unloadSound = async () => {
    if (soundObject.current) {
      try {
        await soundObject.current.stopAsync();
        await soundObject.current.unloadAsync();
      } catch (e) {}
      soundObject.current = null;
    }
  };

  const toggleMute = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (soundObject.current) {
      if (newMutedState) {
        await soundObject.current.pauseAsync();
      } else {
        await soundObject.current.playAsync();
      }
    }
  };

  const stopSession = async () => {
    await unloadSound();

    if (hapticInterval.current) clearInterval(hapticInterval.current);
    hapticInterval.current = null;
    cancelAnimation(breathScale);

    if (sessionStartTime.current) {
      const durationSeconds = (Date.now() - sessionStartTime.current) / 1000;
      if (durationSeconds > 10 && auth.currentUser) {
        const minutes = Math.ceil(durationSeconds / 60);
        try {
          const statsRef = doc(
            db,
            "users",
            auth.currentUser.uid,
            "stats",
            "meditation"
          );
          await setDoc(
            statsRef,
            {
              totalMinutes: increment(minutes),
              totalSessions: increment(1),
              lastSessionDate: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.error("Erro salvar stats", e);
        }
      }
    }

    setStep("choose");
    setScript("");
    breathScale.value = 1;
    sessionStartTime.current = null;
  };

  const startMeditation = async (theme: ThemeItem) => {
    setSelectedTheme(theme);
    setStep("meditating");
    setLoading(true);

    loadAndPlaySound(theme);

    try {
      const model = getChatModel();
      const signText = userSign ? `para um nativo de ${userSign}` : "";
      const prompt = `
        Atue como um guia espiritual.
        Crie uma frase de meditação curta (máx 20 palavras) ${signText}.
        Intenção: ${theme.prompt}.
        Estilo: Místico e relaxante. Sem introduções.
      `;

      const result = await model.generateContent(prompt);
      setScript(result.response.text().trim());
    } catch (error) {
      setScript("Inspire profundamente... conecte-se com o silêncio.");
    } finally {
      setLoading(false);
      sessionStartTime.current = Date.now();
      startBreathingCycle();
    }
  };

  const startBreathingCycle = () => {
    const DURATION = 4000;

    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.5, {
          duration: DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, { duration: DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    hapticInterval.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, DURATION);
  };

  const handleClose = () => {
    stopSession();
    onClose();
  };

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.card }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <MaterialIcons name="close" size={24} color={themeColors.icon} />
          </TouchableOpacity>

          {step === "choose" ? (
            <>
              <ThemedText type="subtitle" style={styles.title}>
                Qual sua intenção?
              </ThemedText>
              <View style={styles.grid}>
                {THEMES.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themeCard,
                      { borderColor: themeColors.icon + "20" },
                    ]}
                    onPress={() => startMeditation(theme)}
                  >
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: theme.color + "20" },
                      ]}
                    >
                      <MaterialIcons
                        name={theme.icon}
                        size={32}
                        color={theme.color}
                      />
                    </View>
                    <ThemedText style={styles.themeLabel}>
                      {theme.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.meditationHeader}>
                <ThemedText
                  type="subtitle"
                  style={[
                    styles.title,
                    { color: selectedTheme.color, marginBottom: 0 },
                  ]}
                >
                  {selectedTheme.label}
                </ThemedText>
                <TouchableOpacity onPress={toggleMute} style={styles.muteBtn}>
                  <MaterialIcons
                    name={isMuted ? "volume-off" : "volume-up"}
                    size={24}
                    color={themeColors.icon}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.animationArea}>
                <Animated.View
                  style={[
                    styles.breathingCircle,
                    { backgroundColor: selectedTheme.color + "30" },
                    animatedCircleStyle,
                  ]}
                />
                <View
                  style={[
                    styles.coreCircle,
                    { backgroundColor: selectedTheme.color },
                  ]}
                >
                  <MaterialIcons
                    name={selectedTheme.icon}
                    size={40}
                    color="#FFF"
                  />
                </View>
              </View>

              <View style={styles.textArea}>
                {loading ? (
                  <ActivityIndicator color={selectedTheme.color} size="large" />
                ) : (
                  <ThemedText style={styles.scriptText}>{script}</ThemedText>
                )}
              </View>

              <ThemedText style={styles.hint}>
                Inspire na expansão, expire na contração.
              </ThemedText>

              <TouchableOpacity
                style={[
                  styles.stopButton,
                  { borderColor: themeColors.destructive },
                ]}
                onPress={handleClose}
              >
                <ThemedText
                  style={{ color: themeColors.destructive, fontWeight: "600" }}
                >
                  Encerrar Sessão
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
    minHeight: 450,
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 5,
    zIndex: 10,
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
    width: "100%",
  },
  themeCard: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    padding: 15,
    borderRadius: 50,
  },
  themeLabel: {
    fontWeight: "600",
    fontSize: 16,
  },
  meditationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 30,
    position: "relative",
  },
  muteBtn: {
    position: "absolute",
    left: 0, // CORREÇÃO: Botão de volume movido para a esquerda para não sobrepor o X
    padding: 5,
  },
  animationArea: {
    height: 200,
    width: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  breathingCircle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  coreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  textArea: {
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  scriptText: {
    textAlign: "center",
    fontSize: 18,
    lineHeight: 28,
    fontStyle: "italic",
    fontWeight: "500",
  },
  hint: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 10,
    marginBottom: 25,
    textAlign: "center",
  },
  stopButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
});
