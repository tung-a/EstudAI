import { auth, db } from "@/firebaseConfig";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./themed-text";

type ChatSession = {
  id: string;
  title: string;
};

export function ChatListDrawer(props: any) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "chats"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatSessions = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChatSession)
      );
      setChats(chatSessions);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateNewChat = async () => {
    if (!user) return;
    const newChatRef = await addDoc(
      collection(db, "users", user.uid, "chats"),
      {
        title: `Nova Conversa`,
        createdAt: serverTimestamp(),
      }
    );

    router.navigate(`/chat/${newChatRef.id}`);
    props.navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Histórico de Chats</ThemedText>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      {chats.map((chat) => (
        <TouchableOpacity
          key={chat.id}
          style={styles.chatItem}
          onPress={() => {
            router.push(`/chat/${chat.id}`);
            props.navigation.closeDrawer();
          }}
        >
          <Text style={styles.chatTitle}>{chat.title}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.newChatButton}
        onPress={handleCreateNewChat}
      >
        <Text style={styles.newChatButtonText}>+ Nova Conversa</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  chatItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  chatTitle: {
    fontSize: 16,
  },
  newChatButton: {
    backgroundColor: "#007AFF",
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  newChatButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
