import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { doc, updateDoc } from "firebase/firestore";
import React from "react";
import { Alert, StyleSheet, Switch, View } from "react-native";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
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

  return (
    <ThemedView
      lightColor={Colors.light.card}
      darkColor={Colors.dark.card}
      style={styles.card}
    >
      <View style={styles.userInfo}>
        <ThemedText style={styles.name}>{user.name}</ThemedText>
        <ThemedText style={styles.email}>{user.email}</ThemedText>
      </View>
      <View style={styles.roleSwitcher}>
        <ThemedText style={styles.roleLabel}>Admin</ThemedText>
        <Switch
          value={user.role === "admin"}
          onValueChange={(isAdmin) =>
            handleRoleChange(isAdmin ? "admin" : "user")
          }
          trackColor={{ false: "#767577", true: themeColors.accent }}
          thumbColor={"#f4f3f4"}
        />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  email: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  roleSwitcher: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleLabel: {
    marginRight: 8,
    fontSize: 14,
  },
});

export default UserListItem;
