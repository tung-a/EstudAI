# Astrum ✨

**Astrum** é uma aplicação mobile inovadora que combina astrologia, meditação, IA e gamificação para criar uma experiência personalizada e significativa de aprendizagem. O projeto transforma a jornada educacional em uma aventura cósmica, onde cada usuário recebe orientações baseadas em seu signo zodiacal e pode interagir com um assistente de IA alimentado pelo Google Gemini.

---

## 🎯 Visão Geral do Projeto

Astrum é um aplicativo cross-platform (Android, iOS e Web) construído com **Expo** e **React Native**, integrando:

- **Backend em Tempo Real**: Firebase Authentication + Firestore Database
- **IA Generativa**: Google Gemini 2.0 Flash para chat inteligente
- **Astrologia Integrada**: Sistema de signos, elementos e sinergia astral
- **Sistema de Cosméticos**: Loja com itens, moedas e inventário
- **Notificações**: Sistema de intenções compartilhadas entre usuários
- **Autenticação Multi-Plataforma**: Suporte para web e mobile

---

## 🚀 Arquitetura do Projeto

### Stack Tecnológico

```
Frontend:
├── React Native 0.81.5
├── Expo 54.0.12 (com Expo Router 6.0.15)
├── TypeScript 5.9.2
├── React 19.1.0
└── React Navigation 7.x

Backend & Data:
├── Firebase (Auth + Firestore)
├── Google Generative AI
├── AsyncStorage (persistência local)
└── Doppler (gerenciamento de secrets)

UI & Animações:
├── React Native Reanimated 4.1.1
├── Expo Linear Gradient
├── React Native Calendars
└── Material Icons (Expo Vector Icons)
```

### Estrutura de Diretórios

```
Astrum/
├── app/                           # Roteamento com Expo Router
│   ├── (auth)/                   # Fluxo de autenticação
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── welcome.tsx
│   ├── (user)/                   # Área autenticada - Usuários
│   │   ├── index.tsx             # Página Cosmos
│   │   ├── chat.tsx              # Chat com Oráculo (IA)
│   │   ├── agenda.tsx            # Rituais (Calendar)
│   │   ├── profile.tsx           # Perfil Astral
│   │   ├── account.tsx           # Gerenciamento da Conta
│   │   └── _layout.tsx           # Drawer + Tabs Navigation
│   ├── (admin)/                  # Área administrativa
│   │   ├── dashboard.tsx
│   │   ├── profile.tsx
│   │   └── users.tsx
│   ├── shop.tsx                  # Loja de Cosméticos (global)
│   ├── inventory.tsx             # Inventário
│   ├── modal.tsx                 # Modal genérico
│   └── _layout.tsx               # Root Layout com Providers
│
├── components/                    # Componentes reutilizáveis
│   ├── shop/
│   │   └── ShopCard.tsx          # Card para itens da loja
│   ├── agenda/
│   │   ├── AddEventModal.tsx
│   │   ├── AgendaListView.tsx
│   │   ├── DayTimelineView.tsx
│   │   └── WeekSelector.tsx
│   ├── ConstellationView.tsx     # Visualização de constelações
│   ├── MeditationModal.tsx       # Modal de meditação
│   ├── NotificationManager.tsx   # Gerenciador de notificações
│   ├── CustomDrawerContent.tsx
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ...
│
├── contexts/                      # Context API para estado global
│   ├── ChatContext.tsx           # Estado do chat + histórico
│   └── CosmeticsContext.tsx      # Moedas, inventário e cosméticos
│
├── hooks/                         # Custom hooks
│   ├── use-auth.tsx              # Autenticação e perfil do usuário
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
│
├── lib/                           # Utilitários e lógica
│   ├── astrology.ts              # Cálculos de signos e sinergia
│   ├── profilePictures.ts        # Mapeamento de avatares
│   ├── dateUtils.ts              # Utilitários de data
│   └── analytics.ts              # Análises
│
├── constants/
│   └── theme.ts                  # Paleta de cores
│
├── assets/
│   ├── images/
│   │   ├── zodiac/               # Imagens de signos (12 imagens)
│   │   ├── profile-pictures/     # Avatares por signo
│   │   └── ...ícones
│   └── sounds/                   # Áudio para meditação/notificações
│
├── android/                       # Configurações Android nativas
├── firebaseConfig.ts              # Configuração do Firebase
├── app.json                       # Configuração Expo
├── package.json                   # Dependências
├── tsconfig.json
└── eslint.config.js
```

---

## 🌟 Funcionalidades Implementadas

### 1. **Autenticação & Perfil do Usuário**

- Registro e login com Firebase Auth
- Persistência de autenticação (web e mobile)
- Seleção de signo zodiacal durante registro
- Perfil com informações do usuário
- Sistema de roles (admin/user)

**Arquivos**: `app/(auth)/*`, `hooks/use-auth.tsx`, `firebaseConfig.ts`

### 2. **Chat com IA (Oráculo)**

- Integração com Google Gemini 2.0 Flash
- Múltiplas conversas com persistência local
- Histórico salvo no AsyncStorage por usuário
- Sistema de prompts contextualizados
- Suporte a markdown na resposta

**Arquivos**: `app/(user)/chat.tsx`, `contexts/ChatContext.tsx`

### 3. **Agenda (Rituais)**

- Calendário com eventos pessoais
- Visualização por semana/dia
- Adição e gerenciamento de eventos
- Timeline de eventos do dia

**Arquivos**: `app/(user)/agenda.tsx`, `components/agenda/*`

### 4. **Sistema de Cosméticos com Loja**

- Moeda in-game: **Poeira Estelar** (Stardust)
- 3 tipos de itens: Card Skins, Backgrounds, Profile Pictures
- 4 raridades: Common, Rare, Epic, Legendary
- Compra e equipamento de itens
- Inventário persistente no Firestore
- Estilos visuais pré-configurados para cada item

**Arquivos**: `app/shop.tsx`, `contexts/CosmeticsContext.tsx`, `components/shop/*`

### 5. **Notificações em Tempo Real**

- Sistema de "vibrações" baseado em intenções
- Notificações são enviadas entre usuários
- 4 tipos de intenções: Luz, Coragem, Cura, Clareza
- Modal animado com feedback visual
- Persistência de notificações no Firestore

**Arquivos**: `components/NotificationManager.tsx`

### 6. **Sistema de Astrologia**

- Cálculo automático do signo solar baseado em data de nascimento
- 12 signos zodiacais com imagens associadas
- 4 elementos (Fogo, Terra, Ar, Água)
- **Sinergia Astral**: Sistema que calcula compatibilidade entre dois signos
  - Mesmo elemento: "Espelhos da Alma" (score 5)
  - Combinações harmônicas: "Expansão e Movimento", "Jardim Fértil" (score 4)
  - Opostos: "Vapor e Intensidade", "Céu e Terra" (score 3)
  - Fricção: "Encontro de Forças" (score 2)

**Arquivos**: `lib/astrology.ts`

### 7. **Navegação Multi-Nível**

- Root Layout com Providers globais
- Stack Screens para (auth), (user), (admin)
- Drawer Navigation na área de usuário
- Tab Navigation com 5 abas principais
- Deep Linking com Expo Router

**Arquivos**: `app/*/_layout.tsx`

### 8. **Sistema de Perfis Cosméticos**

- Avatar padrão por signo zodiacal
- Customização de skins de cartas
- Fundos personalizados
- Perfil visual único por usuário

---

## 🔧 Contextos Globais (Context API)

### **AuthContext** (`hooks/use-auth.tsx`)

Gerencia:

- Estado de autenticação Firebase
- Dados do usuário logado
- Role do usuário (admin/user)
- Loading de autenticação

```typescript
useAuth() → { user, loading }
```

### **ChatContext** (`contexts/ChatContext.tsx`)

Gerencia:

- Múltiplas conversas
- Histórico de mensagens
- Estado de hidratação (AsyncStorage)
- Instância do Gemini AI
- Persistência de conversas por usuário

```typescript
useChat() → {
  conversations,
  selectedConversation,
  addConversation,
  deleteConversation,
  updateConversationMessages,
  getChatModel,
  ...
}
```

### **CosmeticsContext** (`contexts/CosmeticsContext.tsx`)

Gerencia:

- Moeda (Stardust)
- Inventário do usuário
- Itens equipados (skin, background, avatar)
- Transações de compra
- Sincronização com Firestore

```typescript
useCosmetics() → {
  currency,
  inventory,
  buyItem,
  equipItem,
  addStardust,
  refreshUserData,
  ...
}
```

---

## 📱 Fluxo do Usuário

### 1. **Login / Registro**

```
welcome.tsx → login.tsx ↔ register.tsx → seleção de signo → Dashboard
```

### 2. **Área Autenticada (User)**

```
Drawer Navigation
├── Cosmos (index) - Dashboard principal
├── Oráculo (chat) - Chat com IA
├── Rituais (agenda) - Calendário
├── Astral (profile) - Perfil astrológico
└── Perfil (account) - Gerenciamento de conta

Global:
└── Shop - Loja de cosméticos
    └── Inventory - Inventário
```

### 3. **Admin**

```
dashboard → profile → users
```

---

## 🔐 Segurança & Configuração

### Variáveis de Ambiente (via Doppler)

```env
EXPO_PUBLIC_FIREBASE_API_KEY=***
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=***
EXPO_PUBLIC_FIREBASE_PROJECT_ID=***
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=***
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=***
EXPO_PUBLIC_FIREBASE_APP_ID=***
EXPO_PUBLIC_GEMINI_API_KEY=***
```

### Firebase Firestore Structure

```
users/
├── {uid}/
│   ├── email
│   ├── name
│   ├── zodiacSign
│   ├── role (admin/user)
│   ├── wallet
│   │   └── stardust (moeda)
│   ├── inventory (array de IDs)
│   ├── equipped
│   │   ├── skin
│   │   ├── background
│   │   └── profilePicture
│   └── notifications/ (subcollection)
│       └── {notificationId}
│           ├── type
│           ├── intentionId
│           ├── intentionLabel
│           ├── fromName
│           └── read (boolean)
```

---

## 🚀 Como Rodar a Aplicação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (global)
- Conta Firebase configurada
- Chave de API do Google Gemini

### 1. Clonar e Instalar Dependências

```bash
git clone https://github.com/tung-a/Astrum.git
cd Astrum
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# Criar .env ou usar Doppler
# Adicionar todas as variáveis EXPO_PUBLIC_* listadas acima
```

### 3. Iniciar a Aplicação

**Android:**

```bash
npm run android
# ou
doppler run -- npx expo start --android
```

**iOS:**

```bash
npm run ios
# ou
doppler run -- npx expo start --ios
```

**Web:**

```bash
npm run web
# ou
doppler run -- npx expo start --web
```

**Desenvolvimento:**

```bash
npm start
# Escaneie o QR code com Expo Go no seu dispositivo
```

### 4. Scripts Disponíveis

```json
{
  "start": "doppler run -- npx expo start",
  "android": "doppler run -- npx expo start --android",
  "ios": "doppler run -- npx expo start --ios",
  "web": "doppler run -- npx expo start --web",
  "lint": "npx expo lint",
  "reset-project": "node ./scripts/reset-project.js"
}
```

---

## 🎨 Design & Tema

### Paleta de Cores (theme.ts)

- **Tema Claro**: Cores soft e pastel
- **Tema Escuro**: Tons profundos com acentos vibrantes
- **Cores de Intenção**:
  - Luz: `#FFD700` (Dourado)
  - Coragem: `#FF5722` (Laranja)
  - Cura: `#4CAF50` (Verde)
  - Clareza: `#2196F3` (Azul)

### Estilos Cosméticos (CosmeticsContext.tsx)

```typescript
COSMETIC_STYLES: {
  skin_classic, skin_gold, skin_cyber, skin_dark, bg_void, bg_nebula, bg_temple;
}
```

---

## 📊 Estatísticas do Projeto

| Métrica           | Valor              |
| ----------------- | ------------------ |
| Versão            | 1.0.0              |
| Plataformas       | Android, iOS, Web  |
| Signos Zodiacais  | 12 (+ 12 avatares) |
| Itens Cosméticos  | 7+ (expansível)    |
| Telas             | 15+                |
| Componentes       | 20+                |
| Contextos Globais | 3                  |
| Dependências      | 30+                |
| Tamanho do Bundle | ~15-20MB (base)    |

---

## 🔮 Funcionalidades Futuras

- [ ] Compatibilidade com mais plataformas (Desktop)
- [ ] Sistema de amigos e social
- [ ] Meditações guiadas com áudio
- [ ] Desafios semanais com recompensas
- [ ] Análise de padrões de estudo
- [ ] Recomendações personalizadas via IA
- [ ] Sistema de rankings
- [ ] Integração com calendários externos
- [ ] Modo offline aprimorado
- [ ] Tema de personagem evoluível

---

## 📚 Dependências Principais

```json
{
  "react": "19.1.0",
  "react-native": "0.81.5",
  "expo": "~54.0.12",
  "expo-router": "~6.0.15",
  "firebase": "^12.3.0",
  "@react-native-firebase/app": "^23.4.0",
  "@react-native-firebase/analytics": "^23.4.0",
  "@google/generative-ai": "^0.24.1",
  "react-native-reanimated": "~4.1.1",
  "react-native-calendars": "^1.1313.0",
  "@react-navigation/native": "^7.1.8",
  "@react-navigation/drawer": "^7.5.0",
  "@react-navigation/bottom-tabs": "^7.4.0"
}
```

---

## 🤝 Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/MinhaFeature`
2. Commit suas mudanças: `git commit -m 'Add MinhaFeature'`
3. Push para a branch: `git push origin feature/MinhaFeature`
4. Abra um Pull Request

---

## 📖 Recursos e Documentação

- [Documentação Expo](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Generative AI API](https://ai.google.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📝 Licença

Este projeto é privado e pertence a **tung-a/Astrum**. Todos os direitos reservados.

---

## 👥 Autores

- **Desenvolvedor Principal**: Tung A. ([@tung-a](https://github.com/tung-a))

---

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório ou entre em contato através do email do projeto.

---

**Última atualização**: Dezembro 2025  
**Status do Projeto**: Em desenvolvimento ativo 🚀
