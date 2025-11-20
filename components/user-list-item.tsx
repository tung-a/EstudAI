import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
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

// Interface atualizada com os novos campos
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  zodiacSign?: string;
}

interface UserListItemProps {
  user: User;
}

const UserListItem: React.FC<UserListItemProps> = ({ user }) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const handleRoleChange = (newRole: "admin" | "user") => {
    Alert.alert(
      "Alterar Permissão",
      `Deseja alterar o nível espiritual de "${user.name}" para "${newRole}"?`,
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
      "Banir Viajante",
      `Tem certeza que deseja excluir "${user.name}" do sistema?`,
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

  return (
    <ThemedView
      lightColor={Colors.light.card}
      darkColor={Colors.dark.card}
      style={styles.card}
    >
      <Collapsible title={user.name}>
        <ThemedText style={styles.email}>{user.email}</ThemedText>

        {/* Novos Dados Místicos */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <MaterialIcons name="stars" size={16} color={themeColors.accent} />
            <ThemedText style={styles.detailText}>
              Signo:{" "}
              <ThemedText style={{ fontWeight: "bold" }}>
                {user.zodiacSign || "Não calculado"}
              </ThemedText>
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="cake" size={16} color={themeColors.icon} />
            <ThemedText style={styles.detailText}>
              Nasc.: {user.birthDate || "--/--/----"} às{" "}
              {user.birthTime || "--:--"}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="place" size={16} color={themeColors.icon} />
            <ThemedText style={styles.detailText}>
              Local: {user.birthPlace || "Desconhecido"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.roleSwitcher}>
          <ThemedText style={styles.roleLabel}>
            Acesso de Mestre (Admin)
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={confirmDeleteUser}
          >
            <MaterialIcons
              name="delete-outline"
              size={22}
              color={themeColors.destructive}
            />
            <ThemedText
              style={[styles.actionText, { color: themeColors.destructive }]}
            >
              Remover Conta
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
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  email: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
    marginBottom: 10,
  },
  detailsContainer: {
    marginTop: 8,
    gap: 6,
    backgroundColor: "rgba(128,128,128,0.05)",
    padding: 10,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(128,128,128,0.1)",
    marginVertical: 12,
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
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default UserListItem;
