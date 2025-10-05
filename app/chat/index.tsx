import { ChatListDrawer } from "@/components/ChatListDrawer";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { Text, TouchableOpacity } from "react-native";

// Este é o layout do Drawer que contém a lista de chats e as telas de conversa.
export default function ChatDrawerLayout() {
  const navigation = useNavigation();
  const router = useRouter();

  return (
    <Drawer
      drawerContent={(props) => <ChatListDrawer {...props} />}
      screenOptions={{
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={{ marginLeft: 15 }}
          >
            <IconSymbol name="line.3.horizontal" size={24} color="#007AFF" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.back()} // Botão para fechar o modal
            style={{ marginRight: 15 }}
          >
            <Text style={{ color: "#007AFF", fontSize: 16 }}>Fechar</Text>
          </TouchableOpacity>
        ),
        headerTitleAlign: "center",
      }}
    >
      <Drawer.Screen
        name="[chatId]"
        options={{
          drawerItemStyle: { display: "none" },
          title: "EstudAI Chat",
        }}
      />
    </Drawer>
  );
}

// Precisamos de um componente de texto para o botão "Fechar"
