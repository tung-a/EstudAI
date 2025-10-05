import { Platform } from "react-native";

const accentColor = "#E91E63"; // Cor de destaque principal
const destructiveColor = "#d9534f"; // Cor para ações de "perigo"

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: accentColor, // Unificado com a cor de destaque
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: accentColor,
    card: "#f9f9f9",
    accent: accentColor,
    destructive: destructiveColor,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: accentColor, // Unificado com a cor de destaque
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: accentColor,
    card: "#2c2c2e",
    accent: accentColor,
    destructive: destructiveColor,
  },
};

// ... (o restante do arquivo Fonts permanece o mesmo)
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
