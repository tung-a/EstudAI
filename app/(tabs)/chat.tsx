import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
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
  TouchableOpacity,
  View,
} from "react-native";
// IMPORT ADICIONADO
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

type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

type PersistedChatState = {
  conversations: Conversation[];
  selectedConversationId: string | null;
  counter: number;
};

const CONVERSATIONS_STORAGE_KEY = "@estudai:chatConversations";

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const createConversation = (index: number): Conversation => ({
  id: `conversation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: `Conversa ${index}`,
  messages: [],
});

export default function ChatScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [conversationCounter, setConversationCounter] = useState(1);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId
  );
  const messages = selectedConversation?.messages ?? [];
  const canSendMessage = input.trim().length > 0 && !loading;

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => !prev);
  };

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(CONVERSATIONS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as PersistedChatState;
          if (parsed?.conversations?.length) {
            setConversations(parsed.conversations);
            setSelectedConversationId(
              parsed.selectedConversationId ?? parsed.conversations[0].id
            );
            setConversationCounter(
              parsed.counter ?? parsed.conversations.length + 1
            );
            return;
          }
        }

        const initialConversation = createConversation(1);
        setConversations([initialConversation]);
        setSelectedConversationId(initialConversation.id);
        setConversationCounter(2);
      } catch (error) {
        console.error("Erro ao carregar histórico de conversas:", error);
        const fallbackConversation = createConversation(1);
        setConversations([fallbackConversation]);
        setSelectedConversationId(fallbackConversation.id);
        setConversationCounter(2);
      } finally {
        setHydrated(true);
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const persistState = async () => {
      try {
        const payload: PersistedChatState = {
          conversations,
          selectedConversationId,
          counter: conversationCounter,
        };
        await AsyncStorage.setItem(
          CONVERSATIONS_STORAGE_KEY,
          JSON.stringify(payload)
        );
      } catch (error) {
        console.error("Erro ao salvar histórico de conversas:", error);
      }
    };

    persistState();
  }, [conversations, selectedConversationId, conversationCounter, hydrated]);

  useEffect(() => {
    setSuggestedQuestions([]);
  }, [selectedConversationId]);

  const updateConversationMessages = (
    conversationId: string,
    updater: (messages: ChatMessage[]) => ChatMessage[]
  ) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, messages: updater(conversation.messages) }
          : conversation
      )
    );
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setInput("");
    setSuggestedQuestions([]);
  };

  const handleAddConversation = () => {
    const newConversation = createConversation(conversationCounter);
    setConversations((prev) => [...prev, newConversation]);
    setSelectedConversationId(newConversation.id);
    setConversationCounter((prev) => prev + 1);
    setSuggestedQuestions([]);
    setInput("");
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations((prev) => {
      const updated = prev.filter(
        (conversation) => conversation.id !== conversationId
      );

      if (updated.length === 0) {
        const fallback = createConversation(conversationCounter);
        setSelectedConversationId(fallback.id);
        setConversationCounter((prevCounter) => prevCounter + 1);
        return [fallback];
      }

      if (selectedConversationId === conversationId) {
        const nextConversation = updated[updated.length - 1];
        setSelectedConversationId(nextConversation.id);
      }

      return updated;
    });

    setSuggestedQuestions([]);
    setInput("");
  };

  const confirmDeleteConversation = (conversationId: string, title: string) => {
    if (Platform.OS === "web") {
      const message = `Tem certeza de que deseja excluir "${title}"?`;
      const confirmed =
        typeof window !== "undefined" ? window.confirm(message) : false;
      if (confirmed) {
        handleDeleteConversation(conversationId);
      }
      return;
    }

    Alert.alert(
      "Excluir conversa",
      `Tem certeza de que deseja excluir "${title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => handleDeleteConversation(conversationId),
        },
      ]
    );
  };

  const parseSuggestedQuestions = (raw: string): string[] => {
    if (!raw) {
      return [];
    }

    const sanitizeRaw = (input: string) =>
      input
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .replace(/^json\s*/i, "")
        .trim();

    const splitCombinedEntries = (items: string[]) => {
      const expanded: string[] = [];

      items.forEach((item) => {
        const trimmed = item.trim();
        if (!trimmed) {
          return;
        }

        const enumeratedParts = trimmed
          .split(/(?:^|\s)(?:\d+\s*[.)]|[-•])\s*/g)
          .map((part) => part.trim())
          .filter((part) => part.length > 0);

        if (enumeratedParts.length >= 2) {
          enumeratedParts.forEach((part) => {
            const normalized = part.endsWith("?") ? part : `${part}?`;
            expanded.push(normalized);
          });
          return;
        }

        const questionSegments = trimmed
          .split(/\?(?:\s+|$)/)
          .map((segment) => segment.trim())
          .filter((segment) => segment.length > 0);

        if (questionSegments.length > 1) {
          questionSegments.forEach((segment) => {
            const normalized = segment.endsWith("?") ? segment : `${segment}?`;
            expanded.push(normalized);
          });
          return;
        }

        expanded.push(trimmed.endsWith("?") ? trimmed : `${trimmed}?`);
      });

      return expanded;
    };

    const dedupeAndTrim = (items: string[]) => {
      const seen = new Set<string>();
      const results: string[] = [];

      items.forEach((item) => {
        const normalized = item.replace(/\s+/g, " ").trim();
        if (!normalized) {
          return;
        }

        const key = normalized.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          results.push(normalized);
        }
      });

      return results;
    };

    const normalizeSuggestions = (items: string[]) =>
      dedupeAndTrim(splitCombinedEntries(items)).slice(0, 3);

    const cleanedRaw = sanitizeRaw(raw);

    try {
      const parsed = JSON.parse(cleanedRaw);
      if (Array.isArray(parsed)) {
        return normalizeSuggestions(
          parsed
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((item) => item.length > 0)
        );
      }
    } catch {
      // Ignored — fallback parsing below
    }

    // Attempt to normalize single-quoted pseudo JSON (e.g. ['a', 'b'])
    if (/^\s*\[.*\]\s*$/.test(cleanedRaw)) {
      const normalized = cleanedRaw
        .replace(/\s*,\s*\]/g, "]")
        .replace(/\s*,\s*\}/g, "}")
        .replace(/'([^']*)'/g, '"$1"');

      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          return normalizeSuggestions(
            parsed
              .map((item) => (typeof item === "string" ? item.trim() : ""))
              .filter((item) => item.length > 0)
          );
        }
      } catch {
        // fall through to string splitting
      }
    }

    const fallbackSource = cleanedRaw
      .replace(/\r/g, "\n")
      .replace(/^[\s\[]+/, "")
      .replace(/[\]\s]+$/, "")
      .trim();

    const rawLines = fallbackSource
      .replace(/\n{2,}/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (rawLines.length === 0) {
      return [];
    }

    const aggregated: string[] = [];

    rawLines.forEach((line) => {
      const bulletMatch = line.match(/^([-•]|\d+[.)])\s*(.*)$/);
      const cleanedLine = bulletMatch
        ? bulletMatch[2].trim()
        : line
            .replace(/^["'`\[]+/, "")
            .replace(/["'`\]]+$/, "")
            .trim();

      if (bulletMatch || aggregated.length === 0) {
        aggregated.push(cleanedLine);
      } else {
        aggregated[aggregated.length - 1] = `${
          aggregated[aggregated.length - 1]
        } ${cleanedLine}`.trim();
      }
    });

    return normalizeSuggestions(
      aggregated
        .map((item) => item.replace(/["'`]+$/g, "").trim())
        .filter((item) => item.length > 0)
    );
  };

  const getFollowUpSuggestions = async (
    previousQuestion: string,
    answer: string
  ): Promise<string[]> => {
    try {
      const followUpResult = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Você recebeu a pergunta e resposta abaixo. Sugira exatamente 3 possíveis próximas perguntas curtas em português, úteis para continuar a conversa. Responda APENAS com um JSON array de strings sem texto adicional.
Pergunta do usuário: "${previousQuestion}".
Resposta do assistente: "${answer}".`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 64,
          topP: 0.9,
          topK: 40,
        },
      });

      const raw = followUpResult.response.text().trim();
      return parseSuggestedQuestions(raw);
    } catch (error) {
      console.error("Erro ao gerar sugestão de pergunta:", error);
      return [];
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedConversation) {
      return;
    }

    const trimmedInput = input.trim();
    const conversationId = selectedConversation.id;
    const previousMessages = [...selectedConversation.messages];
    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: trimmedInput }],
    };

    updateConversationMessages(conversationId, (prevMessages) => [
      ...prevMessages,
      userMessage,
    ]);
    setLoading(true);
    setInput("");
    setSuggestedQuestions([]);

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

      updateConversationMessages(conversationId, (prevMessages) => [
        ...prevMessages,
        modelMessage,
      ]);

      const followUps = await getFollowUpSuggestions(
        trimmedInput,
        responseText
      );
      if (followUps.length > 0) {
        setSuggestedQuestions(followUps);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage: ChatMessage = {
        role: "model",
        parts: [{ text: "Ocorreu um erro ao processar sua solicitação." }],
      };
      updateConversationMessages(conversationId, (prevMessages) => [
        ...prevMessages,
        errorMessage,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: string, index: number) => {
    setInput(suggestion);
    setSuggestedQuestions((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  if (!hydrated || !selectedConversation) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <ThemedText style={[styles.loadingText, { color: themeColors.text }]}>
          Carregando conversas...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>
        <View style={styles.layout}>
          <View
            style={[
              styles.sidebar,
              sidebarExpanded
                ? styles.sidebarExpanded
                : styles.sidebarCollapsed,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.icon,
              },
            ]}
          >
            <TouchableOpacity
              onPress={toggleSidebar}
              style={[
                styles.sidebarToggle,
                !sidebarExpanded && styles.sidebarToggleCollapsed,
              ]}
            >
              <MaterialIcons
                name={sidebarExpanded ? "chevron-left" : "chevron-right"}
                size={24}
                color={themeColors.icon}
              />
              {sidebarExpanded ? (
                <Text
                  style={[
                    styles.sidebarToggleText,
                    { color: themeColors.text },
                  ]}
                >
                  Recolher
                </Text>
              ) : null}
            </TouchableOpacity>
            <ScrollView
              style={styles.conversationList}
              contentContainerStyle={[
                styles.conversationListContent,
                !sidebarExpanded && styles.conversationListContentCollapsed,
              ]}
              showsVerticalScrollIndicator={false}
            >
              {conversations.map((conversation) => {
                const isActive = conversation.id === selectedConversationId;
                const textColor = isActive ? "#FFFFFF" : themeColors.text;
                const iconColor = isActive ? "#FFFFFF" : themeColors.icon;
                const deleteIconColor = isActive ? "#FFFFFF" : themeColors.icon;
                const deleteButtonBackground = isActive
                  ? "rgba(255,255,255,0.15)"
                  : themeColors.background;
                return (
                  <View
                    key={conversation.id}
                    style={[
                      styles.conversationItem,
                      {
                        borderColor: themeColors.icon,
                        backgroundColor: isActive
                          ? themeColors.accent
                          : "transparent",
                      },
                      !sidebarExpanded && styles.conversationItemCollapsed,
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleSelectConversation(conversation.id)}
                      onLongPress={() =>
                        confirmDeleteConversation(
                          conversation.id,
                          conversation.title
                        )
                      }
                      delayLongPress={250}
                      style={[
                        styles.conversationBody,
                        !sidebarExpanded && styles.conversationBodyCollapsed,
                      ]}
                    >
                      <MaterialIcons
                        name="chat"
                        size={sidebarExpanded ? 20 : 22}
                        color={iconColor}
                      />
                      {sidebarExpanded ? (
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.conversationItemText,
                            { color: textColor },
                          ]}
                        >
                          {conversation.title}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                    {sidebarExpanded ? (
                      <TouchableOpacity
                        onPress={() =>
                          confirmDeleteConversation(
                            conversation.id,
                            conversation.title
                          )
                        }
                        style={[
                          styles.conversationDeleteButton,
                          {
                            backgroundColor: deleteButtonBackground,
                            borderColor: themeColors.icon,
                          },
                        ]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={18}
                          color={deleteIconColor}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              onPress={handleAddConversation}
              style={[
                styles.newConversationButton,
                {
                  borderColor: themeColors.icon,
                  backgroundColor: themeColors.background,
                },
                !sidebarExpanded && styles.newConversationButtonCollapsed,
              ]}
            >
              <MaterialIcons
                name="add"
                size={sidebarExpanded ? 20 : 24}
                color={themeColors.icon}
              />
              {sidebarExpanded ? (
                <Text
                  style={[
                    styles.newConversationButtonText,
                    { color: themeColors.text },
                  ]}
                >
                  Nova conversa
                </Text>
              ) : null}
            </TouchableOpacity>
          </View>
          <View style={styles.chatArea}>
            <ThemedText style={styles.headerTitle}>
              EstudAI Assistant
            </ThemedText>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.chatContent}
            >
              <FlatList
                data={messages}
                keyExtractor={(_, index) => index.toString()}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                  styles.messagesList,
                  messages.length === 0 && styles.messagesListEmpty,
                ]}
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
                        color:
                          item.role === "user" ? "#FFFFFF" : themeColors.text,
                      }}
                    >
                      {item.parts[0].text}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.listEmpty}>
                    <MaterialIcons
                      name="chat-bubble-outline"
                      size={32}
                      color={themeColors.icon}
                    />
                    <ThemedText
                      style={[
                        styles.listEmptyText,
                        { color: themeColors.text },
                      ]}
                    >
                      Comece uma conversa digitando sua pergunta abaixo.
                    </ThemedText>
                  </View>
                }
              />
              {suggestedQuestions.length > 0 ? (
                <View style={styles.suggestionsWrapper}>
                  {suggestedQuestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={`${suggestion}-${index}`}
                      style={[
                        styles.suggestionContainer,
                        {
                          backgroundColor: themeColors.card,
                          borderColor: themeColors.icon,
                        },
                      ]}
                      onPress={() => handleApplySuggestion(suggestion, index)}
                    >
                      <MaterialIcons
                        name="lightbulb-outline"
                        size={20}
                        color={themeColors.icon}
                      />
                      <Text
                        style={[
                          styles.suggestionText,
                          { color: themeColors.text },
                        ]}
                      >
                        {suggestion}
                      </Text>
                      <MaterialIcons
                        name="north-east"
                        size={18}
                        color={themeColors.icon}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
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
                    {
                      backgroundColor: themeColors.accent,
                      opacity: canSendMessage ? 1 : 0.6,
                    },
                  ]}
                  disabled={!canSendMessage}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <MaterialIcons name="send" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "left",
    paddingVertical: 10,
  },
  layout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    borderRightWidth: 1,
    paddingTop: 12,
    paddingBottom: 16,
  },
  sidebarExpanded: {
    width: 240,
    paddingHorizontal: 12,
  },
  sidebarCollapsed: {
    width: 72,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  sidebarToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sidebarToggleCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  sidebarToggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  conversationList: {
    flex: 1,
    alignSelf: "stretch",
  },
  conversationListContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  conversationListContentCollapsed: {
    alignItems: "center",
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    alignSelf: "stretch",
  },
  conversationItemCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 10,
    alignSelf: "stretch",
  },
  conversationBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  conversationBodyCollapsed: {
    justifyContent: "center",
  },
  conversationItemText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  conversationDeleteButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 6,
    marginLeft: 8,
  },
  newConversationButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    alignSelf: "stretch",
  },
  newConversationButtonCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 10,
    alignSelf: "center",
  },
  newConversationButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chatContent: {
    flex: 1,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 16,
  },
  messagesListEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  listEmpty: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  listEmptyText: {
    textAlign: "center",
    fontSize: 16,
    opacity: 0.7,
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
  suggestionsWrapper: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  suggestionContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    marginHorizontal: 8,
  },
});
