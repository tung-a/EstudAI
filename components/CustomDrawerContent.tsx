// components/CustomDrawerContent.tsx
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useChat } from "@/contexts/ChatContext"; // Importa o hook do contexto
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logAddConversation } from "@/lib/analytics"; // Importa log de delete
import { MaterialIcons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    addConversation,
    deleteConversation, // Usaremos esta diretamente
  } = useChat();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const handleAddNewChat = () => {
    addConversation();
    logAddConversation();
    props.navigation.closeDrawer();
  };

  const handleSelectChat = (id: string) => {
    selectConversation(id);
    props.navigation.closeDrawer();
  };

  // Função para chamar a confirmação de exclusão
  const confirmAndDelete = (id: string, title: string) => {
    // A lógica de confirmação já está dentro de deleteConversation no contexto
    deleteConversation(id, title);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.card }]}
      edges={["top", "bottom"]}
    >
      <DrawerContentScrollView
        {...props}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Cabeçalho */}
        <View
          style={[
            styles.drawerHeader,
            { borderBottomColor: themeColors.icon + "30" },
          ]}
        >
          <ThemedText type="subtitle">Conversas</ThemedText>
        </View>

        {/* Lista de Conversas */}
        {conversations.map((conversation) => {
          const isActive = conversation.id === selectedConversationId;
          const itemBackgroundColor = isActive
            ? themeColors.accent + "20" // Fundo ativo ainda mais sutil
            : "transparent";
          const textColor = themeColors.text;
          const iconColor = isActive ? themeColors.accent : themeColors.icon;

          return (
            // O TouchableOpacity principal agora só seleciona
            <TouchableOpacity
              key={conversation.id}
              onPress={() => handleSelectChat(conversation.id)}
              // onLongPress removido daqui
              style={[
                styles.conversationItem,
                { backgroundColor: itemBackgroundColor },
              ]}
            >
              {/* Ícone e Texto da Conversa */}
              <MaterialIcons
                name="chat-bubble-outline"
                size={20}
                color={iconColor}
                style={styles.conversationIcon}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.conversationItemText,
                  { color: textColor },
                  isActive && styles.activeConversationText,
                ]}
              >
                {conversation.title}
              </Text>

              {/* Botão de Deletar (Ícone de Lixeira) */}
              <TouchableOpacity
                onPress={() =>
                  confirmAndDelete(conversation.id, conversation.title)
                }
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Aumenta área de toque
                style={styles.deleteButton}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={20} // Tamanho do ícone de lixeira
                  color={themeColors.icon + "99"} // Cor sutil para o ícone
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {/* Botão Nova Conversa */}
        <TouchableOpacity
          onPress={handleAddNewChat}
          style={[
            styles.newConversationButton,
            { borderColor: themeColors.icon + "50" },
          ]}
        >
          <MaterialIcons
            name="add-circle-outline"
            size={22}
            color={themeColors.accent}
            style={styles.conversationIcon} // Reusa o estilo do ícone para alinhamento
          />
          <Text
            style={[
              styles.newConversationButtonText,
              { color: themeColors.text },
            ]}
          >
            Nova conversa
          </Text>
        </TouchableOpacity>

        {/* Separador Opcional */}
        {/* <View style={[styles.separator, { backgroundColor: themeColors.icon + '30'}]} /> */}
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {},
  scrollViewContent: {
    paddingTop: 0,
    paddingBottom: 10,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10, // Diminuído um pouco para acomodar melhor
    paddingLeft: 16, // Padding esquerdo
    paddingRight: 10, // Padding direito menor para dar espaço ao botão delete
    marginBottom: 2,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  conversationIcon: {
    marginRight: 15,
    width: 20, // Garante alinhamento com o texto
    textAlign: "center",
  },
  conversationItemText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1, // Ocupa o espaço restante antes do botão delete
    marginRight: 8, // Espaço antes do botão delete
  },
  activeConversationText: {
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 6, // Área de toque ao redor do ícone
    borderRadius: 15, // Círculo sutil
    // backgroundColor: 'rgba(255,0,0,0.1)', // Para debug da área de toque
  },
  newConversationButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 15,
    marginHorizontal: 8,
  },
  newConversationButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    marginVertical: 10,
    marginHorizontal: 16,
  },
});
