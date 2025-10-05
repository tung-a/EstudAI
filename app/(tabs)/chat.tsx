import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is not defined");
}
const genAI = new GoogleGenerativeAI(API_KEY);

type ChatMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: input }],
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput("");

    try {
      const chatSession = model.startChat({
        history: messages,
        generationConfig,
      });

      const result = await chatSession.sendMessage(input);
      const modelMessage: ChatMessage = {
        role: "model",
        parts: [{ text: result.response.text() }],
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage: ChatMessage = {
        role: "model",
        parts: [{ text: "Ocorreu um erro ao processar sua solicitação." }],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <ThemedText style={styles.headerTitle}>EstudAI Assistant</ThemedText>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <FlatList
            data={messages}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageContainer,
                  item.role === "user"
                    ? [
                        styles.userMessageContainer,
                        { backgroundColor: themeColors.accent },
                      ]
                    : [
                        styles.modelMessageContainer,
                        { backgroundColor: themeColors.card },
                      ],
                ]}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: item.role === "user" ? "#FFFFFF" : themeColors.text,
                  }}
                >
                  {item.parts[0].text}
                </Text>
              </View>
            )}
          />
          <View
            style={[
              styles.inputContainer,
              {
                borderTopColor: themeColors.icon,
                backgroundColor: themeColors.background,
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.icon,
                  color: themeColors.text,
                },
              ]}
              value={input}
              onChangeText={setInput}
              placeholder="Digite sua dúvida..."
              placeholderTextColor={themeColors.icon}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              style={[
                styles.sendButton,
                { backgroundColor: themeColors.accent },
              ]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <MaterialIcons name="send" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 10,
  },
  messagesList: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    maxWidth: "80%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  modelMessageContainer: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
