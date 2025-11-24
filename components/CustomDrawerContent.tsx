import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useChat } from "@/contexts/ChatContext";
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ZodiacImages } from "@/lib/astrology";
import { MaterialIcons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore"; // <--- Alterado para onSnapshot
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    addConversation,
    deleteConversation,
  } = useChat();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const user = auth.currentUser;

  const [userSign, setUserSign] = useState<string | null>(null);

  // --- CORREÇÃO: Uso de onSnapshot para atualização em tempo real ---
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.zodiacSign) {
            setUserSign(data.zodiacSign);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [user]);
  // ------------------------------------------------------------------

  const handleAddNewChat = () => {
    addConversation();
    props.navigation.closeDrawer();
  };

  const handleSelectChat = (id: string) => {
    selectConversation(id);
    props.navigation.closeDrawer();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível desconectar.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.card }]}
      edges={["top", "bottom"]}
    >
      {/* Cabeçalho do Menu com Dados do Usuário */}
      <View
        style={[
          styles.userHeader,
          { borderBottomColor: themeColors.icon + "30" },
        ]}
      >
        <View
          style={[
            styles.avatar,
            {
              borderColor: themeColors.icon + "50",
              overflow: "hidden",
              borderWidth: 2,
              width: 54,
              height: 54,
              borderRadius: 27,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          {userSign && ZodiacImages[userSign] ? (
            <Image
              source={ZodiacImages[userSign]}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <MaterialIcons
              name="account-circle"
              size={50}
              color={themeColors.icon}
            />
          )}
        </View>
        <View style={styles.userInfo}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {user?.displayName || "Viajante"}
          </ThemedText>
          <ThemedText style={{ fontSize: 12, opacity: 0.7 }} numberOfLines={1}>
            {user?.email}
          </ThemedText>
        </View>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.sectionTitle}>
          <ThemedText type="subtitle" style={{ fontSize: 14, opacity: 0.6 }}>
            CONVERSAS
          </ThemedText>
        </View>

        {conversations.map((conversation) => {
          const isActive = conversation.id === selectedConversationId;
          return (
            <TouchableOpacity
              key={conversation.id}
              onPress={() => handleSelectChat(conversation.id)}
              style={[
                styles.conversationItem,
                {
                  backgroundColor: isActive
                    ? themeColors.accent + "20"
                    : "transparent",
                },
              ]}
            >
              <MaterialIcons
                name="chat-bubble-outline"
                size={20}
                color={isActive ? themeColors.accent : themeColors.icon}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.conversationItemText,
                  { color: themeColors.text },
                  isActive && { fontWeight: "bold", color: themeColors.accent },
                ]}
              >
                {conversation.title}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  deleteConversation(conversation.id, conversation.title)
                }
                hitSlop={10}
                style={styles.deleteButton}
              >
                <MaterialIcons
                  name="close"
                  size={16}
                  color={themeColors.icon + "80"}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={handleAddNewChat}
          style={[
            styles.actionButton,
            { borderColor: themeColors.icon + "50" },
          ]}
        >
          <MaterialIcons name="add" size={20} color={themeColors.text} />
          <Text style={[styles.actionButtonText, { color: themeColors.text }]}>
            Nova Conversa
          </Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* Rodapé com Logout */}
      <View
        style={[styles.footer, { borderTopColor: themeColors.icon + "30" }]}
      >
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons
            name="logout"
            size={20}
            color={themeColors.destructive}
          />
          <Text style={[styles.logoutText, { color: themeColors.destructive }]}>
            Sair da Conta
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  userHeader: {
    padding: 20,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  scrollViewContent: { paddingVertical: 10 },
  sectionTitle: { paddingHorizontal: 16, marginBottom: 8, marginTop: 10 },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  conversationItemText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  deleteButton: { padding: 4 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  actionButtonText: { marginLeft: 8, fontSize: 14, fontWeight: "600" },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    marginLeft: 10,
    fontWeight: "600",
    fontSize: 16,
  },
});
