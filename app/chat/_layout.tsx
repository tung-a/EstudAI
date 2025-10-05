import { Stack } from "expo-router";

// Este layout transforma a seção /chat em um Stack Navigator
// apresentado como um modal.
export default function ChatModalLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
