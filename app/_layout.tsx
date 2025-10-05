import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { auth } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(auth)/login",
};

export default function RootLayout() {
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user); // Define se o usuário está logado ou não
      setAuthLoaded(true); // Marca que a verificação de auth foi concluída
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authLoaded) return;

    if (isLoggedIn) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [authLoaded, isLoggedIn, router]);

  useEffect(() => {
    if (authLoaded) {
      SplashScreen.hideAsync();
    }
  }, [authLoaded]);

  if (!authLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
