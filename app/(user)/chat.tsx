// app/(user)/chat.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useChat } from "@/contexts/ChatContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logSendMessage } from "@/lib/analytics";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextStyle, // Import TextStyle para tipagem
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";

// Tipos
type ChatMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

// Configuração de geração
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export default function ChatScreen() {
  const {
    selectedConversation,
    hydrated,
    authLoading,
    updateConversationMessages,
    getChatModel,
  } = useChat();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const messages = useMemo(
    () => selectedConversation?.messages ?? [],
    [selectedConversation]
  );
  const canSendMessage = input.trim().length > 0 && !loading;

  useEffect(() => {
    setInput("");
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

  // --- Funções de Envio e Sugestões ---
  const parseSuggestedQuestions = (raw: string): string[] => {
    // ...(lógica de parse inalterada)...
    if (!raw) {
      return [];
    }
    // Helper to remove ```json ... ``` wrappers and trim
    const sanitizeRaw = (input: string) =>
      input
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .replace(/^json\s*/i, "")
        .trim();

    // Helper to normalize a single potential question string
    const normalizeQuestionCandidate = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return "";
      }
      // Remove leading/trailing quotes (single, double, smart)
      const stripQuotes = trimmed
        .replace(/^[\s"'`“”«»]+/, "")
        .replace(/[\s"'`“”«»]+$/, "");
      // Remove trailing punctuation except question marks, condense spaces
      const stripTrailingPunctuation = stripQuotes
        .replace(/[\s,;:]+$/, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!stripTrailingPunctuation) {
        return "";
      }
      // Ensure only one question mark at the end, if any
      const singleQuestionMark = stripTrailingPunctuation.replace(/\?+$/, "?");
      // Add question mark if missing
      return singleQuestionMark.endsWith("?")
        ? singleQuestionMark
        : `${singleQuestionMark}?`;
    };

    // Helper to split lines that might contain multiple enumerated or question-separated items
    const splitCombinedEntries = (items: string[]) => {
      const expanded: string[] = [];
      items.forEach((item) => {
        const trimmed = item.trim();
        if (!trimmed) return;

        // Try splitting by common list markers (like "1.", "-", "•") at the start of lines or after whitespace
        const enumeratedParts = trimmed
          .split(/(?:^|\s)(?:\d+\s*[.)]|[-•])\s*/g)
          .map((part) => part.trim())
          .filter((part) => part.length > 0);

        if (enumeratedParts.length >= 2) {
          // Successfully split by enumeration
          enumeratedParts.forEach((part) => {
            const normalized = normalizeQuestionCandidate(part);
            if (normalized) expanded.push(normalized);
          });
          return; // Skip further processing for this item
        }

        // Try splitting by question marks followed by optional space or end of line
        const questionSegments = trimmed
          .split(/\?(?:\s+|$)/)
          .map((segment) => segment.trim())
          .filter((segment) => segment.length > 0);

        if (questionSegments.length > 1) {
          // Successfully split by question marks
          questionSegments.forEach((segment) => {
            const normalized = normalizeQuestionCandidate(segment);
            if (normalized) expanded.push(normalized);
          });
          return; // Skip further processing for this item
        }

        // If no splits occurred, treat the item as a single candidate
        const normalized = normalizeQuestionCandidate(trimmed);
        if (normalized) expanded.push(normalized);
      });
      return expanded;
    };

    // Helper to remove duplicates and limit to 3
    const dedupeAndTrim = (items: string[]) => {
      const seen = new Set<string>();
      const results: string[] = [];
      items.forEach((item) => {
        const normalized = item.replace(/\s+/g, " ").trim(); // Normalize whitespace
        if (!normalized) return;
        const key = normalized.toLowerCase(); // Case-insensitive check
        if (!seen.has(key)) {
          seen.add(key);
          results.push(normalized);
        }
      });
      return results.slice(0, 3); // Limit to max 3
    };

    const normalizeSuggestions = (items: string[]) =>
      dedupeAndTrim(splitCombinedEntries(items));

    // 1. Sanitize the input first
    const cleanedRaw = sanitizeRaw(raw);

    // 2. Try parsing as JSON array
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
      /* Ignore parsing errors, proceed to next method */
    }

    // 3. Try normalizing single quotes to double quotes for pseudo-JSON
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
        /* Fall through to string splitting */
      }
    }

    // 4. Fallback: Split by lines, handle list markers
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

    // Try to handle cases where a single line might contain multiple items separated by markers
    const aggregated: string[] = [];
    rawLines.forEach((line) => {
      // Match common list prefixes like '1.', '-', '•'
      const bulletMatch = line.match(/^([-•]|\d+[.)])\s*(.*)$/);
      const cleanedLine = bulletMatch
        ? bulletMatch[2].trim()
        : line
            .replace(/^["'`\[]+/, "")
            .replace(/["'`\]]+$/, "")
            .trim();

      // If it starts like a list item or it's the first line, assume new item
      if (bulletMatch || aggregated.length === 0) {
        if (cleanedLine) aggregated.push(cleanedLine);
      } else {
        // Append to the last item if it doesn't look like a new list item (heuristic)
        if (aggregated.length > 0) {
          aggregated[aggregated.length - 1] = `${
            aggregated[aggregated.length - 1]
          } ${cleanedLine}`.trim();
        } else if (cleanedLine) {
          aggregated.push(cleanedLine);
        }
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
    // ...(lógica inalterada)...
    const model = getChatModel(); // Obtém o modelo do contexto
    if (!model) return []; // Retorna vazio se o modelo não estiver disponível

    try {
      const followUpResult = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                // Prompt aprimorado para garantir JSON
                text: `Given the last user question and the assistant's answer, suggest exactly 3 concise follow-up questions in Portuguese that the user might ask next to continue the conversation productively. Format the response ONLY as a valid JSON array of strings, like ["Question 1?", "Question 2?", "Question 3?"]. Do not include any other text before or after the JSON array.

User Question: "${previousQuestion}"
Assistant Answer: "${answer}"

Follow-up suggestions (JSON array only):`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.5, // Temperatura mais baixa pode ajudar na consistência
          maxOutputTokens: 256,
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
    // ...(lógica inalterada)...
    if (!canSendMessage || !selectedConversation) return;

    const model = getChatModel(); // Obtém o modelo do contexto
    if (!model) {
      Alert.alert("Erro", "Não foi possível inicializar o modelo de IA.");
      return;
    }

    const trimmedInput = input.trim();
    const conversationId = selectedConversation.id;
    const previousMessages = [...selectedConversation.messages];
    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: trimmedInput }],
    };

    // Atualização otimista
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

      // Atualiza com a resposta da IA
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
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage: ChatMessage = {
        role: "model",
        parts: [{ text: "Desculpe, ocorreu um erro. Tente novamente." }],
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
    // ...(lógica inalterada)...
    setInput(suggestion);
    setSuggestedQuestions([]);
  };

  // --- Define estilos básicos para o Markdown ---
  // CORREÇÃO: Tipar fontWeight explicitamente
  const markdownStyles = useMemo(
    () => ({
      body: {
        fontSize: 16,
        lineHeight: 22,
        color: themeColors.text,
      } satisfies TextStyle, // Usa 'satisfies' para checagem sem alargar o tipo
      strong: {
        fontWeight: "bold" as const, // Define como o literal 'bold'
        // A cor será sobrescrita dinamicamente
      } satisfies TextStyle,
      list_item: {
        marginVertical: 4,
        // Cor será sobrescrita dinamicamente
      } satisfies TextStyle,
      // Adicione outros estilos conforme necessário
    }),
    [themeColors.text]
  );

  // --- Renderização ---
  if (!hydrated || authLoading) {
    // ...(loading indicator inalterado)...
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <ThemedText style={[styles.loadingText, { color: themeColors.text }]}>
          Carregando...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!selectedConversation) {
    // ...(nenhuma conversa selecionada inalterado)...
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Nenhuma conversa selecionada.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Lista de Mensagens */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => `${selectedConversation.id}-${index}`}
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
                  item.role === "user" ? themeColors.accent : themeColors.card,
              },
            ]}
          >
            <Markdown
              // CORREÇÃO: Assegura que o tipo dos estilos passados seja compatível
              style={{
                body: {
                  ...markdownStyles.body,
                  color: item.role === "user" ? "#FFFFFF" : themeColors.text,
                },
                strong: {
                  ...markdownStyles.strong, // Inclui fontWeight: 'bold'
                  color: item.role === "user" ? "#FFFFFF" : themeColors.text, // Define a cor
                },
                list_item: {
                  ...markdownStyles.list_item,
                  color: item.role === "user" ? "#FFFFFF" : themeColors.text,
                  // A lib pode precisar de mais estilos para bullet points, etc.
                },
                // Adicione outros estilos aqui se necessário
              }}
            >
              {item.parts[0].text}
            </Markdown>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.listEmpty}>
            <MaterialIcons
              name="auto-awesome"
              size={48}
              color={themeColors.icon + "80"}
            />
            <ThemedText
              style={[styles.listEmptyText, { color: themeColors.text }]}
            >
              Como posso te ajudar a estudar hoje?
            </ThemedText>
          </View>
        }
        ListFooterComponent={
          suggestedQuestions.length > 0 ? <View style={{ height: 20 }} /> : null
        }
      />

      {/* Área de Sugestões */}
      {suggestedQuestions.length > 0 && !loading && (
        <View style={styles.suggestionsWrapper}>
          {suggestedQuestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion}-${index}`}
              style={[
                styles.suggestionButton,
                {
                  backgroundColor: themeColors.card + "B3",
                  borderColor: themeColors.icon + "40",
                },
              ]}
              onPress={() => handleApplySuggestion(suggestion)}
            >
              <Text
                style={[styles.suggestionText, { color: themeColors.text }]}
              >
                {suggestion}
              </Text>
              <MaterialIcons
                name="north-east"
                size={16}
                color={themeColors.icon}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Área de Input */}
      <View
        style={[
          styles.inputAreaContainer,
          {
            borderTopColor: themeColors.icon + "30",
            backgroundColor: themeColors.background,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.icon + "50",
              color: themeColors.text,
            },
          ]}
          value={input}
          onChangeText={setInput}
          placeholder="Digite sua dúvida..."
          placeholderTextColor={themeColors.icon}
          editable={!loading}
          multiline
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          style={[
            styles.sendButton,
            {
              backgroundColor: canSendMessage
                ? themeColors.accent
                : themeColors.icon + "80",
            },
          ]}
          disabled={!canSendMessage || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  messagesListEmpty: {
    justifyContent: "center",
    alignItems: "center",
  },
  listEmpty: {
    alignItems: "center",
    padding: 20,
  },
  listEmptyText: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 16,
    opacity: 0.7,
  },
  messageContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 12,
    maxWidth: "85%",
    alignSelf: "flex-start",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  modelMessageContainer: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
  },
  suggestionsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 8,
    marginTop: 4,
  },
  suggestionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    marginHorizontal: 6,
  },
  inputAreaContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 18,
    marginRight: 8,
    fontSize: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
