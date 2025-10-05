import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
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
                    ? styles.userMessageContainer
                    : styles.modelMessageContainer,
                  {
                    backgroundColor:
                      item.role === "user"
                        ? Colors.light.tint
                        : colorScheme === "dark"
                        ? "#2c2c2e"
                        : "#e5e5ea",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color:
                      item.role === "user" ? "white" : Colors[colorScheme].text,
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
                borderTopColor: Colors[colorScheme].icon,
                backgroundColor: Colors[colorScheme].background,
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#fff",
                  borderColor: Colors[colorScheme].icon,
                  color: Colors[colorScheme].text,
                },
              ]}
              value={input}
              onChangeText={setInput}
              placeholder="Digite sua mensagem..."
              placeholderTextColor={Colors[colorScheme].icon}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              style={styles.sendButton}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Enviar</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
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
  },
  modelMessageContainer: {
    alignSelf: "flex-start",
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
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
