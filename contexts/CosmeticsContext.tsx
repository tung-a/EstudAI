import { auth, db } from "@/firebaseConfig";
import { getDefaultProfilePictureId } from "@/lib/profilePictures";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";

// --- TIPOS ---
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type ItemType = "card_skin" | "background" | "profile_picture";

export type ShopItem = {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  price: number;
  image?: any;
  description?: string;
};

export type SkinStyle = {
  colors: string[];
  borderColor: string;
  iconColor: string;
};

export type BackgroundStyle = {
  colors: string[];
  textColor?: string;
};

// --- DEFINIÇÃO VISUAL DOS ITENS ---
export const COSMETIC_STYLES = {
  // SKINS
  skin_classic: {
    colors: ["#5e35b1", "#4527a0"],
    borderColor: "#b39ddb",
    iconColor: "rgba(255,255,255,0.5)",
  },
  skin_gold: {
    colors: ["#FFD700", "#FFA000"],
    borderColor: "#FFF8E1",
    iconColor: "#FFF",
  },
  skin_cyber: {
    colors: ["#212121", "#000000"],
    borderColor: "#00E5FF",
    iconColor: "#00E5FF",
  },
  skin_dark: {
    colors: ["#2b0000", "#000000"],
    borderColor: "#D50000",
    iconColor: "#D50000",
  },
  // BACKGROUNDS
  bg_void: { colors: ["transparent", "transparent"], textColor: undefined },
  bg_nebula: { colors: ["#2E004E", "#000000"], textColor: "#E1BEE7" },
  bg_temple: { colors: ["#3E2723", "#1B0000"], textColor: "#D7CCC8" },
};

export const MOCK_SHOP: ShopItem[] = [
  {
    id: "skin_classic",
    name: "Tarot Clássico",
    type: "card_skin",
    rarity: "common",
    price: 0,
    image: null,
  },
  {
    id: "skin_gold",
    name: "Alquimia Dourada",
    type: "card_skin",
    rarity: "legendary",
    price: 2000,
    image: null,
  },
  {
    id: "skin_cyber",
    name: "Oráculo Cyber",
    type: "card_skin",
    rarity: "epic",
    price: 1200,
    image: null,
  },
  {
    id: "skin_dark",
    name: "Lua Negra",
    type: "card_skin",
    rarity: "rare",
    price: 800,
    image: null,
  },
  {
    id: "bg_void",
    name: "Vazio Cósmico",
    type: "background",
    rarity: "common",
    price: 0,
    image: null,
  },
  {
    id: "bg_nebula",
    name: "Nebulosa Roxa",
    type: "background",
    rarity: "epic",
    price: 1500,
    image: null,
  },
  {
    id: "bg_temple",
    name: "Templo Antigo",
    type: "background",
    rarity: "rare",
    price: 500,
    image: null,
  },
];

interface CosmeticsContextType {
  currency: number;
  inventory: string[];
  equippedSkin: string;
  equippedBackground: string;
  equippedProfilePicture: string | null;
  buyItem: (item: ShopItem) => Promise<boolean>;
  equipItem: (item: ShopItem) => Promise<void>;
  addStardust: (amount: number) => Promise<void>;
  refreshUserData: (userOverride?: User | null) => Promise<void>;
  currentSkinStyle: SkinStyle;
  currentBackgroundStyle: BackgroundStyle;
}

const CosmeticsContext = createContext<CosmeticsContextType | undefined>(
  undefined
);

export const useCosmetics = () => {
  const context = useContext(CosmeticsContext);
  if (!context)
    throw new Error("useCosmetics must be used within a CosmeticsProvider");
  return context;
};

export const CosmeticsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState(0);
  const [inventory, setInventory] = useState<string[]>([
    "skin_classic",
    "bg_void",
  ]);
  const [equippedSkin, setEquippedSkin] = useState("skin_classic");
  const [equippedBackground, setEquippedBackground] = useState("bg_void");
  const [equippedProfilePicture, setEquippedProfilePicture] =
    useState<string | null>(null);
  const refreshUserDataInternal = useCallback(
    async (currentUser?: User | null) => {
      const targetUser = currentUser || user;
      if (!targetUser) return;

      const docRef = doc(db, "users", targetUser.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        if (data.wallet?.stardust !== undefined)
          setCurrency(data.wallet.stardust);

        const pendingUpdates: Record<string, any> = {};
        let inventoryFromDb = Array.isArray(data.inventory)
          ? (data.inventory as string[])
          : ["skin_classic", "bg_void"];

        if (!Array.isArray(data.inventory)) {
          pendingUpdates.inventory = inventoryFromDb;
        }

        const defaultProfilePictureId = getDefaultProfilePictureId(
          data.zodiacSign
        );

        if (
          defaultProfilePictureId &&
          !inventoryFromDb.includes(defaultProfilePictureId)
        ) {
          inventoryFromDb = [...inventoryFromDb, defaultProfilePictureId];
          pendingUpdates.inventory = inventoryFromDb;
        }

        setInventory(inventoryFromDb);

        const skinId = data.equipped?.skin || "skin_classic";
        const backgroundId = data.equipped?.background || "bg_void";
        const profilePictureId =
          data.equipped?.profilePicture || defaultProfilePictureId || null;

        setEquippedSkin(skinId);
        setEquippedBackground(backgroundId);
        setEquippedProfilePicture(profilePictureId);

        if (profilePictureId && !data.equipped?.profilePicture) {
          pendingUpdates["equipped.profilePicture"] = profilePictureId;
        }

        if (Object.keys(pendingUpdates).length > 0) {
          await updateDoc(docRef, pendingUpdates);
        }
      } else {
        // Novo usuário no Firestore
        const defaultProfilePictureId = getDefaultProfilePictureId(null);

        await setDoc(
          docRef,
          {
            wallet: { stardust: 500 },
            inventory: [
              "skin_classic",
              "bg_void",
              ...(defaultProfilePictureId ? [defaultProfilePictureId] : []),
            ],
            equipped: {
              skin: "skin_classic",
              background: "bg_void",
              profilePicture: defaultProfilePictureId ?? null,
            },
          },
          { merge: true }
        );

        setCurrency(500);
        setInventory([
          "skin_classic",
          "bg_void",
          ...(defaultProfilePictureId ? [defaultProfilePictureId] : []),
        ]);
        setEquippedSkin("skin_classic");
        setEquippedBackground("bg_void");
        setEquippedProfilePicture(defaultProfilePictureId || null);
      }
    },
    [user]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        refreshUserDataInternal(currentUser);
      } else {
        // RESET COMPLETO AO DESLOGAR (CORREÇÃO DO BUG)
        setCurrency(0);
        setInventory(["skin_classic", "bg_void"]);
        setEquippedSkin("skin_classic"); // <--- Importante
        setEquippedBackground("bg_void"); // <--- Importante
        setEquippedProfilePicture(null);
      }
    });
    return () => unsubscribe();
  }, [refreshUserDataInternal]);

  const addStardust = async (amount: number) => {
    if (!user) return;
    const oldCurrency = currency;
    setCurrency((prev) => prev + amount);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        "wallet.stardust": increment(amount),
      });
    } catch (error) {
      console.error("Erro ao adicionar saldo:", error);
      setCurrency(oldCurrency);
      Alert.alert("Erro", "Não foi possível processar a compra.");
    }
  };

  const buyItem = async (item: ShopItem): Promise<boolean> => {
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado.");
      return false;
    }
    if (inventory.includes(item.id)) {
      Alert.alert("Já possui", "Você já tem este item.");
      return false;
    }
    if (currency < item.price) {
      Alert.alert("Saldo Insuficiente", "Você precisa de mais Poeira Estelar.");
      return false;
    }

    const oldCurrency = currency;
    setCurrency((prev) => prev - item.price);
    setInventory((prev) => [...prev, item.id]);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        "wallet.stardust": increment(-item.price),
        inventory: arrayUnion(item.id),
      });
      return true;
    } catch (error) {
      console.error(error);
      setCurrency(oldCurrency);
      setInventory((prev) => prev.filter((id) => id !== item.id));
      Alert.alert("Erro", "Falha na transação.");
      return false;
    }
  };

  const equipItem = async (item: ShopItem) => {
    if (!user) return;

    if (item.type === "card_skin") setEquippedSkin(item.id);
    else if (item.type === "background") setEquippedBackground(item.id);
    else setEquippedProfilePicture(item.id);

    try {
      const fieldPath =
        item.type === "card_skin"
          ? "equipped.skin"
          : item.type === "background"
          ? "equipped.background"
          : "equipped.profilePicture";
      await updateDoc(doc(db, "users", user.uid), {
        [fieldPath]: item.id,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const currentSkinStyle = (COSMETIC_STYLES[
    equippedSkin as keyof typeof COSMETIC_STYLES
  ] || COSMETIC_STYLES.skin_classic) as SkinStyle;
  const currentBackgroundStyle = (COSMETIC_STYLES[
    equippedBackground as keyof typeof COSMETIC_STYLES
  ] || COSMETIC_STYLES.bg_void) as BackgroundStyle;

  return (
    <CosmeticsContext.Provider
      value={{
        currency,
        inventory,
        equippedSkin,
        equippedBackground,
        equippedProfilePicture,
        buyItem,
        equipItem,
        addStardust,
        refreshUserData: (override?: User | null) =>
          refreshUserDataInternal(override || user),
        currentSkinStyle,
        currentBackgroundStyle,
      }}
    >
      {children}
    </CosmeticsContext.Provider>
  );
};
