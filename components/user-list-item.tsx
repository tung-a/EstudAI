import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible"; // Importando o componente de "gaveta"
import { Colors } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import React from "react";
import {
  Alert,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  age?: string;
  school?: string;
  goal?: string;
}

interface UserListItemProps {
  user: User;
}

const UserListItem: React.FC<UserListItemProps> = ({ user }) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const handleRoleChange = (newRole: "admin" | "user") => {
    Alert.alert(
      "Confirmar Alteração",
      `Tem certeza que deseja alterar a permissão de "${user.name}" para "${newRole}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            const userDocRef = doc(db, "users", user.id);
            await updateDoc(userDocRef, { role: newRole });
          },
        },
      ]
    );
  };

  const confirmDeleteUser = () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const userDocRef = doc(db, "users", user.id);
            await deleteDoc(userDocRef);
          },
        },
      ]
    );
  };

  // Ações futuras
  const suspendUser = () =>
    Alert.alert(
      "Função não implementada",
      "A suspensão de usuário ainda será desenvolvida."
    );
  const resetPassword = () =>
    Alert.alert(
      "Função não implementada",
      "O reset de senha ainda será desenvolvido."
    );

  return (
    <ThemedView
      lightColor={Colors.light.card}
      darkColor={Colors.dark.card}
      style={styles.card}
    >
      <Collapsible title={user.name}>
        <ThemedText style={styles.email}>{user.email}</ThemedText>
        <View style={styles.detailsContainer}>
          <ThemedText style={styles.detailText}>
            Idade: {user.age || "Não informado"}
          </ThemedText>
          <ThemedText style={styles.detailText}>
            Instituição: {user.school || "Não informada"}
          </ThemedText>
          <ThemedText style={styles.detailText}>
            Objetivo: {user.goal || "Não informado"}
          </ThemedText>
        </View>

        <View style={styles.separator} />

        <View style={styles.roleSwitcher}>
          <ThemedText style={styles.roleLabel}>
            Permissão de Administrador
          </ThemedText>
          <Switch
            value={user.role === "admin"}
            onValueChange={(isAdmin) =>
              handleRoleChange(isAdmin ? "admin" : "user")
            }
            trackColor={{ false: "#767577", true: themeColors.accent }}
            thumbColor={"#f4f3f4"}
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={resetPassword}>
            <MaterialIcons
              name="lock-reset"
              size={22}
              color={themeColors.icon}
            />
            <ThemedText style={styles.actionText}>Resetar Senha</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={suspendUser}>
            <MaterialIcons name="block" size={22} color={themeColors.icon} />
            <ThemedText style={styles.actionText}>Suspender</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={confirmDeleteUser}
          >
            <MaterialIcons
              name="delete"
              size={22}
              color={themeColors.destructive}
            />
            <ThemedText
              style={[styles.actionText, { color: themeColors.destructive }]}
            >
              Excluir
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Collapsible>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginVertical: 8,
  },
  email: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  detailsContainer: {
    marginTop: 12,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(128,128,128,0.2)",
    marginVertical: 16,
  },
  roleSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionsContainer: {
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionText: {
    fontSize: 14,
  },
});

export default UserListItem;
