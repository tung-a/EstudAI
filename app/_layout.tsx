import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

// --- NOVOS IMPORTS (Trazidos da pasta user) ---
import { NotificationManager } from "@/components/NotificationManager";
import { ChatProvider } from "@/contexts/ChatContext";
import { CosmeticsProvider } from "@/contexts/CosmeticsContext"; //

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(auth)/login",
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === "admin") {
          router.replace("/(admin)/dashboard");
        } else {
          // Redireciona usuário logado para a área interna
          router.replace("/(user)");
        }
      } else {
        router.replace("/(auth)/login");
      }
      SplashScreen.hideAsync();
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      {/* A tela de shop é registrada automaticamente se o arquivo app/shop.tsx existir */}
      <Stack.Screen name="shop" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        {/* ENVOLVENDO O APP TODO COM OS CONTEXTOS GLOBAIS */}
        <ChatProvider>
          <CosmeticsProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              {/* Gerenciador de Notificações no topo para aparecer em qualquer lugar */}
              <NotificationManager />
              <RootLayoutNav />
              <StatusBar style="auto" />
            </ThemeProvider>
          </CosmeticsProvider>
        </ChatProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
