import { Platform } from "react-native";

// --- PALETA MÍSTICA ---
const accentColor = "#9C27B0"; // Roxo Ametista
const secondaryColor = "#FFD700"; // Dourado (para detalhes)
const destructiveColor = "#ef5350";

export const Colors = {
  light: {
    text: "#2D1B4E", // Roxo muito escuro
    background: "#F3E5F5", // Lilás bem claro
    tint: accentColor,
    icon: "#7B1FA2",
    tabIconDefault: "#BA68C8",
    tabIconSelected: accentColor,
    card: "#FFFFFF",
    accent: accentColor,
    destructive: destructiveColor,
  },
  dark: {
    text: "#E1BEE7", // Lilás claro
    background: "#120024", // Roxo quase preto (cosmos)
    tint: secondaryColor, // Dourado no escuro fica ótimo
    icon: "#E040FB",
    tabIconDefault: "#7B1FA2",
    tabIconSelected: secondaryColor,
    card: "#2A0A3B", // Roxo escuro para cards
    accent: accentColor,
    destructive: destructiveColor,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
