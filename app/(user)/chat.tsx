import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useChat } from "@/contexts/ChatContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logSendMessage } from "@/lib/analytics";
import { MaterialIcons } from "@expo/vector-icons";
// Adicionados hooks nativos para garantir o recebimento dos parâmetros
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";

type ChatMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const SYSTEM_INSTRUCTION =
  "Você é um guia místico experiente, especialista em astrologia, cristais, tarot e energias sutis. " +
  "Seu objetivo é ajudar o usuário a encontrar equilíbrio e autoconhecimento. " +
  "Responda sempre com empatia, usando uma linguagem acolhedora e levemente esotérica. " +
  "Ao sugerir conselhos, baseie-se em trânsitos planetários gerais, propriedades de pedras ou arquétipos do tarot. " +
  "Responda sempre em português.";

const STARTER_QUESTIONS = [
  "🔮 Qual a energia de hoje?",
  "❤️ Previsão para o amor",
  "💎 Qual cristal usar?",
  "🌙 Como está a lua hoje?",
];

export default function ChatScreen() {
  const {
    selectedConversation,
    hydrated,
    authLoading,
    updateConversationMessages,
    getChatModel,
  } = useChat();

  // Hooks de navegação nativa
  const route = useRoute();
  const navigation = useNavigation();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  // --- CORREÇÃO: Captura de parâmetros robusta ---
  // Usa useFocusEffect para garantir que rode sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      const params = route.params as { initialPrompt?: string } | undefined;

      if (params?.initialPrompt) {
        setInput(params.initialPrompt);

        // Limpa os parâmetros para não preencher de novo se o usuário sair e voltar sem intenção
        navigation.setParams({ initialPrompt: undefined } as any);
      }
    }, [route.params, navigation])
  );
  // -----------------------------------------------

  const messages = useMemo(
    () => selectedConversation?.messages ?? [],
    [selectedConversation]
  );
  const canSendMessage = input.trim().length > 0 && !loading;

  // Limpa o input quando troca de conversa (mas não quando vem de outra aba com prompt)
  useEffect(() => {
    // Só limpa se NÃO tiver acabado de receber um prompt via rota
    const params = route.params as { initialPrompt?: string } | undefined;
    if (!params?.initialPrompt) {
      setInput("");
    }
    setSuggestedQuestions([]);
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  }, [messages]);

  const parseSuggestedQuestions = (raw: string): string[] => {
    if (!raw) return [];
    try {
      const start = raw.indexOf("[");
      const end = raw.lastIndexOf("]");
      if (start !== -1 && end !== -1) {
        const json = raw.substring(start, end + 1);
        return JSON.parse(json);
      }
    } catch (e) {
      console.error("Erro ao parsear sugestões:", e);
    }
    return [];
  };

  const getFollowUpSuggestions = async (
    previousQuestion: string,
    answer: string
  ): Promise<string[]> => {
    const model = getChatModel({ systemInstruction: SYSTEM_INSTRUCTION });
    if (!model) return [];

    try {
      const followUpResult = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Given the last user question and the assistant's answer, suggest exactly 3 concise follow-up questions in Portuguese that the user might ask next to deepen their spiritual or astrological understanding. Format the response ONLY as a valid JSON array of strings, like ["Qual meu cristal?", "E o amor?", "Previsão hoje?"]. Do not include any other text.

User Question: "${previousQuestion}"
Assistant Answer: "${answer}"

Follow-up suggestions (JSON array only):`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 256,
        },
      });

      const raw = followUpResult.response.text().trim();
      return parseSuggestedQuestions(raw);
    } catch (error) {
      return [];
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;

    if (
      (!textToSend.trim() && !input.trim()) ||
      loading ||
      !selectedConversation
    )
      return;

    const model = getChatModel({ systemInstruction: SYSTEM_INSTRUCTION });
    if (!model) {
      Alert.alert("Erro", "Não foi possível conectar ao Oráculo.");
      return;
    }

    const trimmedInput = textToSend.trim();
    const conversationId = selectedConversation.id;
    const previousMessages = [...selectedConversation.messages];
    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: trimmedInput }],
    };

    updateConversationMessages(conversationId, (prev) => [
      ...prev,
      userMessage,
    ]);
    setLoading(true);
    setInput("");
    setSuggestedQuestions([]);
    logSendMessage();

    try {
      const chatSession = model.startChat({
        history: previousMessages,
        generationConfig,
      });
      const result = await chatSession.sendMessage(trimmedInput);
      const responseText = result.response.text();
      const modelMessage: ChatMessage = {
        role: "model",
        parts: [{ text: responseText }],
      };

      updateConversationMessages(conversationId, (prev) => [
        ...prev,
        modelMessage,
      ]);

      const followUps = await getFollowUpSuggestions(
        trimmedInput,
        responseText
      );
      if (followUps.length > 0) {
        setSuggestedQuestions(followUps);
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          150
        );
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: "model",
        parts: [{ text: "As energias estão confusas. Tente novamente." }],
      };
      updateConversationMessages(conversationId, (prev) => [
        ...prev,
        errorMessage,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const markdownStyles = useMemo(
    () => ({
      body: {
        fontSize: 16,
        lineHeight: 24,
        color: themeColors.text,
      } satisfies TextStyle,
      strong: {
        fontWeight: "bold" as const,
        color: themeColors.accent,
      } satisfies TextStyle,
      list_item: { marginVertical: 4 } satisfies TextStyle,
    }),
    [themeColors.text]
  );

  if (!hydrated || authLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <ThemedText>Sintonizando frequências...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoiding}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ThemedView style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => `${selectedConversation?.id}-${index}`}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.messagesListEmpty,
          ]}
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
                      ? themeColors.accent
                      : themeColors.card,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                },
              ]}
            >
              {item.role === "model" && (
                <MaterialIcons
                  name="auto-awesome"
                  size={16}
                  color={themeColors.accent}
                  style={{ marginBottom: 5 }}
                />
              )}
              <Markdown
                style={{
                  body: {
                    ...markdownStyles.body,
                    color: item.role === "user" ? "#FFFFFF" : themeColors.text,
                  },
                  strong: {
                    ...markdownStyles.strong,
                    color:
                      item.role === "user" ? "#FFFFFF" : themeColors.accent,
                  },
                }}
              >
                {item.parts[0].text}
              </Markdown>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.listEmpty}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: themeColors.accent + "20" },
                ]}
              >
                <MaterialIcons
                  name="psychology"
                  size={64}
                  color={themeColors.accent}
                />
              </View>
              <ThemedText type="title" style={styles.emptyTitle}>
                Oráculo Virtual
              </ThemedText>
              <ThemedText style={styles.listEmptyText}>
                O universo está pronto para ouvir suas dúvidas. Pergunte sobre
                seu caminho, energias ou destino.
              </ThemedText>

              <View style={styles.starterContainer}>
                {STARTER_QUESTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.starterChip,
                      {
                        borderColor: themeColors.icon + "40",
                        backgroundColor: themeColors.card,
                      },
                    ]}
                    onPress={() => handleApplySuggestion(q)}
                  >
                    <Text style={{ color: themeColors.text }}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          ListFooterComponent={
            suggestedQuestions.length > 0 ? (
              <View style={{ height: 20 }} />
            ) : null
          }
        />

        {/* Área de Sugestões (Follow-up) */}
        {suggestedQuestions.length > 0 && !loading && (
          <View style={styles.suggestionsWrapper}>
            <ThemedText style={styles.suggestionLabel}>Sugestões:</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {suggestedQuestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestionButton,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.accent,
                    },
                  ]}
                  onPress={() => handleApplySuggestion(suggestion)}
                >
                  <MaterialIcons
                    name="auto-awesome"
                    size={14}
                    color={themeColors.accent}
                  />
                  <Text
                    style={[styles.suggestionText, { color: themeColors.text }]}
                  >
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View
          style={[
            styles.inputAreaContainer,
            {
              backgroundColor: themeColors.background,
              borderTopColor: "transparent",
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon + "30",
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder="Pergunte ao universo..."
              placeholderTextColor={themeColors.icon + "80"}
              editable={!loading}
              multiline
              // maxHeight removido daqui, tratado no style
            />
            <TouchableOpacity
              onPress={() => handleSendMessage()}
              style={[
                styles.sendButton,
                {
                  backgroundColor: canSendMessage
                    ? themeColors.accent
                    : themeColors.icon + "20",
                },
              ]}
              disabled={!canSendMessage || loading}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={canSendMessage ? "#fff" : themeColors.icon}
                />
              ) : (
                <MaterialIcons
                  name="send"
                  size={20}
                  color={canSendMessage ? "#fff" : themeColors.icon}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoiding: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  messagesListEmpty: { justifyContent: "center", alignItems: "center" },

  // Empty State Styles
  listEmpty: { alignItems: "center", padding: 30, marginTop: 20 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 24, marginBottom: 10, textAlign: "center" },
  listEmptyText: {
    textAlign: "center",
    fontSize: 16,
    opacity: 0.7,
    lineHeight: 24,
    marginBottom: 30,
  },
  starterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  starterChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 5,
  },

  // Message Bubbles
  messageContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    maxWidth: "85%",
  },
  userMessageContainer: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  modelMessageContainer: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },

  // Suggestions Area
  suggestionsWrapper: { paddingVertical: 10, paddingLeft: 16 },
  suggestionLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  suggestionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  suggestionText: { fontSize: 13, marginLeft: 6 },

  // Input Area
  inputAreaContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    marginLeft: 5,
  },
});
