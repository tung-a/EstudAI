import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";

type UserProfile = {
  name: string;
  email: string;
  age?: string;
  school?: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile({
            name: user.displayName || "Usuário",
            email: user.email || "",
          });
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível fazer o logout.", error);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Meu Perfil</ThemedText>

      {profile && (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Nome:</Text>
          <Text style={styles.info}>{profile.name}</Text>

          <Text style={styles.label}>Email:</Text>
          <Text style={styles.info}>{profile.email}</Text>

          <Text style={styles.label}>Idade:</Text>
          <Text style={styles.info}>{profile.age}</Text>

          <Text style={styles.label}>Escola:</Text>
          <Text style={styles.info}>{profile.school}</Text>
        </View>
      )}

      <Button title="Sair (Logout)" onPress={handleLogout} color="red" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  infoContainer: {
    width: "100%",
    padding: 20,
    marginVertical: 30,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  info: {
    fontSize: 18,
    color: "#555",
    marginBottom: 10,
  },
});
