// app/_layout.tsx

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react"; // Importar o useState
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

// Importar o auth e a função de login anónimo
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { auth } from "../firebaseConfig";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null); // Estado para guardar o utilizador

  useEffect(() => {
    // Tenta fazer o login anónimo UMA VEZ quando a app carrega
    signInAnonymously(auth).catch((error) => {
      console.error("Erro no login anónimo automático:", error);
    });

    // Ouve as mudanças no estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log("Utilizador anónimo conectado:", currentUser.uid);
      } else {
        console.log("Nenhum utilizador conectado.");
      }
    });

    // Limpa o listener quando o componente desmonta
    return () => unsubscribe();
  }, []); // O array vazio [] garante que isto só corre uma vez

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
