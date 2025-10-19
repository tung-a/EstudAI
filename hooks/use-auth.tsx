// hooks/use-auth.tsx
import { auth, db } from "@/firebaseConfig";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

// Remove 'timezone' da interface
interface AuthUser extends User {
  role?: "admin" | "user";
  // timezone?: string; // Removido
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUser({
            ...firebaseUser,
            role: userData.role || "user",
            // timezone: userData.timezone || "America/Sao_Paulo", // Removido
          });
        } else {
          // Se não houver doc, apenas define o usuário Firebase (sem role ou timezone)
          setUser({
            ...firebaseUser,
            role: "user", // Define um role padrão se necessário
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
