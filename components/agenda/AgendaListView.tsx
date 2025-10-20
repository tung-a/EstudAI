// components/agenda/AgendaListView.tsx
import { Event } from "@/app/(user)/agenda";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDuration, formatHeaderTitle } from "@/lib/dateUtils";
import { MaterialIcons } from "@expo/vector-icons";
import React, { forwardRef, useMemo, useState } from "react";
import {
  SectionList,
  SectionListProps,
  StyleSheet,
  Text, // Importar Text
  TouchableOpacity,
  View,
} from "react-native";
// Ajuste na importação para incluir tipos necessários para rules
import Markdown, {
  MarkdownNode,
  MarkdownRules,
  RenderState,
} from "react-native-markdown-display";

type AgendaListViewProps = {
  events: { [date: string]: Event[] }; // Tipo EventsByDate inline ou importado
  onDeleteEvent: (eventId: string) => void;
  todayString: string; // Data de hoje no formato YYYY-MM-DD
} & Pick<
  SectionListProps<Event>,
  "ListHeaderComponent" | "stickySectionHeadersEnabled"
>;

export const AgendaListView = forwardRef<
  SectionList<Event>,
  AgendaListViewProps
>(({ events, onDeleteEvent, todayString, ...sectionListProps }, ref) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const sections = useMemo(() => {
    // ... (lógica das seções inalterada) ...
    const datesWithEvents = Object.keys(events);
    const allDatesSet = new Set(datesWithEvents);
    allDatesSet.add(todayString);
    const allSortedDates = Array.from(allDatesSet).sort();
    return allSortedDates.map((date) => ({
      title: date,
      data: events[date] || [],
    }));
  }, [events, todayString]);

  // --- Estilo Base Dinâmico para Texto Markdown ---
  const baseTextStyle = useMemo(
    () => ({
      color: themeColors.text,
      fontSize: 13,
      lineHeight: 18,
    }),
    [themeColors.text]
  );

  // --- Regras para o Markdown ---
  // Tipar o objeto de regras com MarkdownRules
  const markdownRules: MarkdownRules = useMemo(
    () => ({
      // Regra para **texto** (negrito)
      strong: (
        node: MarkdownNode,
        children: React.ReactNode,
        parent: MarkdownNode,
        state: RenderState
      ) => (
        // Aplicar estilo base + negrito
        <Text key={node.key} style={[baseTextStyle, { fontWeight: "bold" }]}>
          {children}
        </Text>
      ),
      // Regra para *texto* (itálico)
      em: (
        node: MarkdownNode,
        children: React.ReactNode,
        parent: MarkdownNode,
        state: RenderState
      ) => (
        // Aplicar estilo base + itálico
        <Text key={node.key} style={[baseTextStyle, { fontStyle: "italic" }]}>
          {children}
        </Text>
      ),
      // Regra fundamental para texto puro - APLICA ESTILOS BASE AQUI
      // Esta regra é crucial para evitar o erro "Text strings must be rendered..."
      text: (
        node: MarkdownNode,
        children: React.ReactNode,
        parent: MarkdownNode,
        state: RenderState
      ) => {
        // A regra 'text' recebe o conteúdo diretamente em node.content
        // Não precisa processar 'children' aqui, apenas retornar o <Text> formatado
        return (
          <Text key={node.key} style={baseTextStyle}>
            {String(node.content)} {/* Garante que é string */}
          </Text>
        );
      },
      // Regra para itens de lista
      list_item: (
        node: MarkdownNode,
        children: React.ReactNode,
        parent: MarkdownNode,
        state: RenderState
      ) => (
        <View key={node.key} style={styles.listItemStyle}>
          {/* Marcador usa o estilo base */}
          <Text style={[baseTextStyle, { marginRight: 5 }]}>
            {parent.type === "bullet_list"
              ? "• "
              : `${node.index != null ? node.index + 1 : 0}. `}
          </Text>
          {/* A View contém os children processados por outras regras (incluindo 'text') */}
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      ),
      // Regra para parágrafo - apenas adiciona margem
      paragraph: (
        node: MarkdownNode,
        children: React.ReactNode,
        parent: MarkdownNode,
        state: RenderState
      ) => (
        <View key={node.key} style={{ marginBottom: 8 }}>
          {children}
        </View>
      ),
      // Adiciona regras para as listas apenas para margens
      bullet_list: (
        node: MarkdownNode,
        children: React.ReactNode,
        parent: MarkdownNode,
        state: RenderState
      ) => (
        <View key={node.key} style={{ marginBottom: 8 }}>
          {children}
        </View>
      ),
      ordered_list: (
        node: MarkdownNode,
        children: React.ReactNode,
        parent: MarkdownNode,
        state: RenderState
      ) => (
        <View key={node.key} style={{ marginBottom: 8 }}>
          {children}
        </View>
      ),
    }),
    [themeColors.text, baseTextStyle]
  ); // Adicionado baseTextStyle como dependência

  return (
    <SectionList
      ref={ref}
      sections={sections}
      keyExtractor={(item, index) => item.id + index}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.listContentContainer}
      renderSectionHeader={({ section: { title, data } }) => (
        <View style={styles.sectionHeaderContainer}>
          <ThemedText
            style={[
              styles.sectionHeader,
              title === todayString && styles.todayHeader,
              data.length === 0 && styles.emptySectionHeader,
            ]}
          >
            {formatHeaderTitle(title)}
          </ThemedText>
          {data.length === 0 && sections.length > 0 && (
            <ThemedText style={styles.emptySectionText}>
              Nenhum evento para este dia.
            </ThemedText>
          )}
        </View>
      )}
      renderItem={({ item }) => {
        const hasRecommendation = Boolean(item.studyRecommendation);
        const isExpanded = expandedEventId === item.id;

        return (
          <TouchableOpacity
            onPress={() => {
              if (hasRecommendation) {
                setExpandedEventId((current) =>
                  current === item.id ? null : item.id
                );
              }
            }}
            onLongPress={() => onDeleteEvent(item.id)}
            style={[
              styles.agendaEventItem,
              { backgroundColor: themeColors.card },
            ]}
            activeOpacity={hasRecommendation ? 0.7 : 1}
          >
            <View style={styles.eventTimeDetails}>
              <ThemedText style={styles.agendaEventTime}>
                {item.time}
              </ThemedText>
              <ThemedText style={styles.agendaEventDuration}>
                {formatDuration(item.duration)}
              </ThemedText>
            </View>
            <View
              style={[
                styles.eventTitleBar,
                { backgroundColor: themeColors.accent },
              ]}
            />
            <View style={styles.agendaEventTitleContainer}>
              <ThemedText style={styles.agendaEventTitle} numberOfLines={2}>
                {item.title}
              </ThemedText>
              {item.disciplinaNome && (
                <ThemedText
                  style={styles.agendaEventSubtitle}
                  numberOfLines={1}
                >
                  {item.disciplinaNome}
                </ThemedText>
              )}
              {hasRecommendation && (
                <View
                  style={[
                    styles.recommendationSection,
                    { borderColor: themeColors.icon + "30" },
                  ]}
                >
                  <View style={styles.recommendationHeader}>
                    <ThemedText style={styles.recommendationLabel}>
                      Sugestão de estudo
                    </ThemedText>
                    <MaterialIcons
                      name={isExpanded ? "expand-less" : "expand-more"}
                      size={20}
                      color={themeColors.icon}
                    />
                  </View>
                  {isExpanded && (
                    <View style={styles.recommendationTextContainer}>
                      {/* Removido style prop, usando apenas rules */}
                      <Markdown rules={markdownRules}>
                        {item.studyRecommendation || ""}
                      </Markdown>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="event-busy"
            size={40}
            color={themeColors.icon + "80"}
          />
          <ThemedText style={styles.noEventsText}>
            Nenhum evento agendado.
          </ThemedText>
        </View>
      }
      {...sectionListProps}
    />
  );
});

AgendaListView.displayName = "AgendaListView";

const styles = StyleSheet.create({
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  sectionHeaderContainer: {},
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    paddingTop: 25,
    paddingBottom: 8,
  },
  todayHeader: {
    color: Colors.light.tint,
  },
  emptySectionHeader: {
    opacity: 0.8,
  },
  emptySectionText: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: "italic",
    paddingBottom: 15,
  },
  agendaEventItem: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventTimeDetails: {
    width: 65,
    alignItems: "flex-start",
    paddingTop: 2,
  },
  agendaEventTime: {
    fontSize: 16,
    fontWeight: "bold",
  },
  agendaEventDuration: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  eventTitleBar: {
    width: 4,
    minHeight: 40,
    borderRadius: 2,
    marginRight: 12,
    alignSelf: "stretch",
  },
  agendaEventTitleContainer: {
    flex: 1,
  },
  agendaEventTitle: {
    fontSize: 16,
  },
  agendaEventSubtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  noEventsText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 16,
    opacity: 0.7,
  },
  recommendationSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recommendationLabel: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.9,
  },
  recommendationTextContainer: {
    marginTop: 8,
  },
  listItemStyle: {
    flexDirection: "row",
    marginBottom: 5,
    flexWrap: "wrap",
  },
});
