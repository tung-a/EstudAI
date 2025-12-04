import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, ZoomIn, ZoomOut } from "react-native-reanimated";

// Mapeamento de ícones e cores (igual ao account.tsx)
const INTENTION_MAP: Record<
  string,
  { icon: keyof typeof MaterialIcons.glyphMap; color: string }
> = {
  luz: { icon: "wb-sunny", color: "#FFD700" },
  coragem: { icon: "local-fire-department", color: "#FF5722" },
  cura: { icon: "spa", color: "#4CAF50" },
  clareza: { icon: "water-drop", color: "#2196F3" },
};

type NotificationData = {
  id: string;
  type: "intention";
  intentionId: string;
  intentionLabel: string;
  fromName: string;
  read: boolean;
};

export function NotificationManager() {
  const [activeNotification, setActiveNotification] =
    useState<NotificationData | null>(null);
  const user = auth.currentUser;
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    if (!user) return;

    // Escuta notificações não lidas
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Pega a primeira notificação não lida (uma por vez para não flodar)
      const changes = snapshot.docChanges();

      changes.forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data() as Omit<NotificationData, "id">;
          setActiveNotification({ id: change.doc.id, ...data });
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleDismiss = async () => {
    if (!activeNotification || !user) return;

    // Marca como lida no banco
    try {
      await updateDoc(
        doc(db, "users", user.uid, "notifications", activeNotification.id),
        {
          read: true,
        }
      );
    } catch (error) {
      console.error("Erro ao marcar notificação:", error);
    }

    setActiveNotification(null);
  };

  if (!activeNotification) return null;

  const styleData = INTENTION_MAP[activeNotification.intentionId] || {
    icon: "auto-awesome",
    color: themeColors.accent,
  };

  return (
    <Modal transparent visible={!!activeNotification} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          entering={ZoomIn.duration(500)}
          exiting={ZoomOut.duration(300)}
          style={[
            styles.card,
            { backgroundColor: themeColors.card, borderColor: styleData.color },
          ]}
        >
          <View
            style={[
              styles.iconHalo,
              { backgroundColor: styleData.color + "20" },
            ]}
          >
            {/* @ts-ignore: MaterialIcons types */}
            <MaterialIcons
              name={styleData.icon}
              size={48}
              color={styleData.color}
            />
          </View>

          <Animated.View entering={FadeIn.delay(300)}>
            <ThemedText
              type="title"
              style={{
                textAlign: "center",
                color: styleData.color,
                marginBottom: 8,
              }}
            >
              {activeNotification.intentionLabel}
            </ThemedText>

            <ThemedText
              style={{ textAlign: "center", fontSize: 16, opacity: 0.8 }}
            >
              <ThemedText type="defaultSemiBold">
                {activeNotification.fromName}
              </ThemedText>{" "}
              te enviou uma vibração de{" "}
              {activeNotification.intentionLabel.toLowerCase()}.
            </ThemedText>
          </Animated.View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: styleData.color }]}
            onPress={handleDismiss}
          >
            <ThemedText style={styles.buttonText}>Receber Energia</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "85%",
    maxWidth: 340,
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 2,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconHalo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  button: {
    marginTop: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 2,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
