import { CustomDrawerContent } from "@/components/CustomDrawerContent";
import { HapticTab } from "@/components/haptic-tab";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { ChatProvider } from "@/contexts/ChatContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

const Drawer = createDrawerNavigator();

function TabLayout() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarButton: HapticTab,
        headerStyle: {
          backgroundColor: themeColors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.icon + "20",
        },
        headerTintColor: themeColors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Cosmos", // Home virou Cosmos
          headerShown: false,
          tabBarIcon: ({ color }) => (
            // IconSymbol precisa ter mapeamento ou usar MaterialIcons direto se falhar
            <MaterialIcons name="auto-awesome" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Oráculo", // Chat virou Oráculo
          headerShown: true,
          headerTitle: "",
          headerLeft: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                style={{ marginLeft: 15, padding: 5 }}
              >
                <MaterialIcons name="menu" size={28} color={themeColors.icon} />
              </TouchableOpacity>
              <ThemedText
                type="subtitle"
                style={{ marginLeft: 10, fontSize: 18 }}
              >
                Guia Místico
              </ThemedText>
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="remove-red-eye" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Rituais", // Agenda virou Rituais
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="calendar-today" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Astral", // Perfil virou Astral
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="star" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function UserDrawerLayout() {
  return (
    <ChatProvider>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: "slide",
          swipeEnabled: false,
        }}
      >
        <Drawer.Screen name="(tabs)" component={TabLayout} />
      </Drawer.Navigator>
    </ChatProvider>
  );
}
