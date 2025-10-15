import { Platform } from "react-native";

// --- ESCOLHA SUA PALETA DE CORES AQUI ---
// Basta descomentar a linha da cor que você deseja usar
const accentColor = "#4f8dcfff"; // Azul Sereno (Padrão Implementado)
// const accentColor = "#F57C00"; // Laranja Vibrante
// const accentColor = "#2E7D32"; // Verde Esmeralda
// const accentColor = "#E91E63"; // Rosa Original

const destructiveColor = "#d9534f";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#f7f7f8", // Um branco um pouco mais suave
    tint: accentColor,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: accentColor,
    card: "#ffffff", // Cards brancos para contraste
    accent: accentColor,
    destructive: destructiveColor,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: accentColor,
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
