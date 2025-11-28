import { CustomDrawerContent } from "@/components/CustomDrawerContent";
import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Tabs } from "expo-router"; //

// REMOVIDOS: ChatProvider, CosmeticsProvider, NotificationManager (já estão na raiz)

const Drawer = createDrawerNavigator();

function TabLayout() {
  const colorScheme = useColorScheme();
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
          title: "Cosmos",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="auto-awesome" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Oráculo",
          headerShown: true,
          headerTitle: "",
          // ... headerLeft mantido igual ao original ...
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="remove-red-eye" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Rituais",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="calendar-today" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Astral",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="star" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Perfil",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={28} color={color} />
          ),
        }}
      />
      {/* REMOVIDO: <Tabs.Screen name="shop" ... /> pois agora é uma tela global */}
    </Tabs>
  );
}

export default function UserDrawerLayout() {
  // Apenas o Drawer Navigator puro, sem providers em volta
  return (
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
  );
}
