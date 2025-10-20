// app/(user)/_layout.tsx
import { CustomDrawerContent } from "@/components/CustomDrawerContent"; // Importa o conteúdo da gaveta
import { HapticTab } from "@/components/haptic-tab";
import { ThemedText } from "@/components/themed-text"; // Import ThemedText
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { ChatProvider } from "@/contexts/ChatContext"; // Importa o provider do chat
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons"; // Ícone do menu
import { createDrawerNavigator } from "@react-navigation/drawer"; // Importa Drawer
import { DrawerActions, useNavigation } from "@react-navigation/native"; // Para abrir a gaveta
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native"; // Import View
import { TouchableOpacity } from "react-native-gesture-handler"; // Para botão do header

// Cria o Navegador de Gaveta
const Drawer = createDrawerNavigator();

// Componente que contém as Tabs (necessário para aninhar)
function TabLayout() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation(); // Hook para acessar a navegação (e abrir a gaveta)
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        // headerShown: false, // Header será mostrado em algumas telas
        tabBarButton: HapticTab,
        headerStyle: {
          backgroundColor: themeColors.card, // Cor de fundo do header
          elevation: 0, // Remove sombra no Android
          shadowOpacity: 0, // Remove sombra no iOS
          borderBottomWidth: 1,
          borderBottomColor: themeColors.icon + "20", // Borda sutil
        },
        headerTintColor: themeColors.text, // Cor do título e ícones
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false, // Esconde header na Home
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          headerShown: true, // Mostra header SÓ na tela de Chat
          headerTitle: "", // Remove o título padrão do header, o chat.tsx colocará o seu
          headerLeft: () => (
            // Define o componente esquerdo do header
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                style={{ marginLeft: 15, padding: 5 }} // Adiciona padding para toque fácil
              >
                <MaterialIcons name="menu" size={28} color={themeColors.icon} />
              </TouchableOpacity>
              {/* Adiciona o nome da IA aqui */}
              <ThemedText
                type="subtitle"
                style={{ marginLeft: 10, fontSize: 18 }}
              >
                Estud.IA
              </ThemedText>
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
          // title: "Chat IA", // Pode remover ou manter se quiser na Tab Bar
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          headerShown: false, // Esconde header na Agenda
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          headerShown: false, // Esconde header no Perfil
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Layout principal do usuário agora é um Drawer
export default function UserDrawerLayout() {
  return (
    // Envolve com o ChatProvider para dar acesso ao contexto
    <ChatProvider>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />} // Usa o conteúdo personalizado
        screenOptions={{
          headerShown: false, // Esconde o header padrão do Drawer
          drawerType: "slide", // Ou 'front', 'back'
          swipeEnabled: false, // Permite abrir arrastando
        }}
      >
        {/* A única tela do Drawer contém o TabLayout */}
        <Drawer.Screen
          name="(tabs)" // Nome da rota que contém as Tabs
          component={TabLayout}
          options={
            {
              // Opções específicas para a tela que contém as tabs, se necessário
            }
          }
        />
      </Drawer.Navigator>
    </ChatProvider>
  );
}
