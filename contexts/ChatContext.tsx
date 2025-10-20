// contexts/ChatContext.tsx
import { useAuth } from "@/hooks/use-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Platform } from "react-native";

// Tipos (mantidos do chat.tsx original)
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

// Interface do Contexto
interface ChatContextType {
  conversations: Conversation[];
  selectedConversationId: string | null;
  selectedConversation: Conversation | undefined;
  conversationCounter: number;
  hydrated: boolean;
  authLoading: boolean; // Passar o estado de loading do auth
  selectConversation: (id: string) => void;
  addConversation: () => string; // Retorna o ID da nova conversa
  deleteConversation: (id: string, title: string) => void;
  updateConversationMessages: (
    conversationId: string,
    updater: (messages: ChatMessage[]) => ChatMessage[]
  ) => void;
  getChatModel: (
    options?: { systemInstruction?: string }
  ) => ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Hook para usar o contexto
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

// Chave do AsyncStorage (pode ser a mesma)
const CONVERSATIONS_STORAGE_KEY = "@estudai:chatConversations";

// Função helper para criar conversa
const createConversation = (index: number): Conversation => ({
  id: `conversation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: `Conversa ${index}`,
  messages: [],
});

// Provedor do Contexto
export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authIsLoading } = useAuth(); // Usando o hook useAuth
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [conversationCounter, setConversationCounter] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = `${CONVERSATIONS_STORAGE_KEY}:${user?.uid ?? "guest"}`;

  // Instância da IA (movida para cá)
  const genAIInstance = useMemo(() => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("EXPO_PUBLIC_GEMINI_API_KEY is not defined");
      // Retornar um objeto dummy ou lançar erro, dependendo da necessidade
      // Aqui, lançamos para falhar rápido se a chave estiver faltando
      throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is not defined");
    }
    return new GoogleGenerativeAI(apiKey);
  }, []);

  const getChatModel = useCallback(
    (options?: { systemInstruction?: string }) => {
      return genAIInstance.getGenerativeModel({
        model: "gemini-2.0-flash", // Ou outro modelo desejado
        systemInstruction: options?.systemInstruction,
      });
    },
    [genAIInstance]
  );

  // Carregar estado do AsyncStorage
  useEffect(() => {
    if (authIsLoading) return; // Espera autenticação

    let isMounted = true;

    const initializeDefaultConversation = () => {
      if (!isMounted) return;
      const initialConversation = createConversation(1);
      setConversations([initialConversation]);
      setSelectedConversationId(initialConversation.id);
      setConversationCounter(2);
      setHydrated(true); // Marca como hidratado mesmo ao inicializar
    };

    const loadState = async () => {
      setHydrated(false); // Reinicia hidratação ao mudar storageKey
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (!isMounted) return;

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
            setHydrated(true); // Marca como hidratado
            return;
          }
        }
        initializeDefaultConversation();
      } catch (error) {
        console.error("Erro ao carregar histórico de conversas:", error);
        initializeDefaultConversation();
      }
    };

    loadState();

    return () => {
      isMounted = false;
    };
  }, [storageKey, authIsLoading]); // Depende da chave e do loading do auth

  // Salvar estado no AsyncStorage
  useEffect(() => {
    if (!hydrated || authIsLoading) return; // Não salva antes de hidratar ou enquanto auth carrega

    const persistState = async () => {
      try {
        const payload: PersistedChatState = {
          conversations,
          selectedConversationId,
          counter: conversationCounter,
        };
        await AsyncStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (error) {
        console.error("Erro ao salvar histórico de conversas:", error);
      }
    };
    persistState();
  }, [
    conversations,
    selectedConversationId,
    conversationCounter,
    hydrated,
    storageKey,
    authIsLoading,
  ]);

  // Funções de manipulação (movidas e adaptadas)
  const selectConversation = useCallback((id: string) => {
    setSelectedConversationId(id);
  }, []);

  const addConversation = useCallback(() => {
    const newConversation = createConversation(conversationCounter);
    setConversations((prev) => [...prev, newConversation]);
    setSelectedConversationId(newConversation.id);
    setConversationCounter((prev) => prev + 1);
    // logAddConversation(); // Mover log para onde a função é chamada se necessário
    return newConversation.id; // Retorna ID para possível navegação
  }, [conversationCounter]);

  const internalDeleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== conversationId);
        if (updated.length === 0) {
          const fallback = createConversation(conversationCounter);
          setSelectedConversationId(fallback.id);
          setConversationCounter((prev) => prev + 1);
          return [fallback];
        }
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(updated[updated.length - 1].id);
        }
        return updated;
      });
      // logDeleteConversation(); // Mover log se necessário
    },
    [conversationCounter, selectedConversationId]
  );

  const deleteConversation = useCallback(
    (id: string, title: string) => {
      if (Platform.OS === "web") {
        if (window.confirm(`Tem certeza de que deseja excluir "${title}"?`)) {
          internalDeleteConversation(id);
        }
      } else {
        Alert.alert(
          "Excluir conversa",
          `Tem certeza de que deseja excluir "${title}"?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Excluir",
              style: "destructive",
              onPress: () => internalDeleteConversation(id),
            },
          ]
        );
      }
    },
    [internalDeleteConversation]
  );

  const updateConversationMessages = useCallback(
    (
      conversationId: string,
      updater: (messages: ChatMessage[]) => ChatMessage[]
    ) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, messages: updater(c.messages) } : c
        )
      );
    },
    []
  );

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  const value: ChatContextType = {
    conversations,
    selectedConversationId,
    selectedConversation,
    conversationCounter,
    hydrated,
    authLoading: authIsLoading, // Passa o estado de loading do auth
    selectConversation,
    addConversation,
    deleteConversation,
    updateConversationMessages,
    getChatModel,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
