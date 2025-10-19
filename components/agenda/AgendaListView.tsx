// components/agenda/AgendaListView.tsx
import { Event, EventsByDate } from "@/app/(user)/agenda";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDuration, formatHeaderTitle } from "@/lib/dateUtils";
import { MaterialIcons } from "@expo/vector-icons"; // Importar ícones
import { forwardRef, useMemo, useState } from "react";
import {
  SectionList,
  SectionListProps,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type AgendaListViewProps = {
  events: EventsByDate;
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
    // Pega todas as datas que têm eventos
    const datesWithEvents = Object.keys(events);
    // Cria um Set para garantir datas únicas e adiciona 'hoje'
    const allDatesSet = new Set(datesWithEvents);
    allDatesSet.add(todayString); // Garante que 'hoje' esteja no Set

    // Converte o Set de volta para array e ordena
    const allSortedDates = Array.from(allDatesSet).sort();

    // Mapeia para o formato de sections, garantindo 'data' como array vazio se não houver eventos
    return allSortedDates.map((date) => ({
      title: date,
      data: events[date] || [], // Usa array vazio se events[date] for undefined
    }));
  }, [events, todayString]); // Depende dos eventos e de 'hoje'

  return (
    <SectionList
      ref={ref}
      sections={sections}
      keyExtractor={(item, index) => item.id + index} // Chave mais robusta
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.listContentContainer}
      renderSectionHeader={(
        { section: { title, data } } // Pega 'data' para checar se está vazio
      ) => (
        <View style={styles.sectionHeaderContainer}>
          <ThemedText
            style={[
              styles.sectionHeader,
              title === todayString && styles.todayHeader, // Estilo para hoje
              data.length === 0 && styles.emptySectionHeader, // Estilo para seção vazia
            ]}
          >
            {formatHeaderTitle(title)}
          </ThemedText>
          {/* Mostra mensagem se a seção estiver vazia E NÃO for o ListEmptyComponent geral */}
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
          >
            <View style={styles.eventTimeDetails}>
              <ThemedText style={styles.agendaEventTime}>{item.time}</ThemedText>
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
                <ThemedText style={styles.agendaEventSubtitle} numberOfLines={1}>
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
                    <ThemedText style={styles.recommendationText}>
                      {item.studyRecommendation}
                    </ThemedText>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        // Mostrado apenas se 'sections' estiver totalmente vazio
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
    flexGrow: 1, // Permite que ListEmptyComponent centralize
  },
  sectionHeaderContainer: {
    // Container para o header e texto de seção vazia
    // backgroundColor: 'transparent', // Garante fundo transparente
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    paddingTop: 25,
    paddingBottom: 8, // Menos padding embaixo para acomodar texto vazio
  },
  todayHeader: {
    color: Colors.light.tint, // Destaca o header de hoje
  },
  emptySectionHeader: {
    opacity: 0.8, // Header de dia vazio um pouco mais sutil (opcional)
  },
  emptySectionText: {
    // Texto mostrado abaixo do header se a seção estiver vazia
    fontSize: 14,
    opacity: 0.6,
    fontStyle: "italic",
    paddingBottom: 15, // Espaço abaixo do texto
    // paddingLeft: 5, // Pequeno indent
  },
  agendaEventItem: {
    flexDirection: "row",
    alignItems: "center",
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
    height: "80%",
    borderRadius: 2,
    marginRight: 12,
    alignSelf: "center",
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
    flex: 1, // Ocupa espaço
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200, // Altura mínima para centralizar bem
  },
  noEventsText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 16,
    opacity: 0.7,
  },
  recommendationSection: {
    marginTop: 8,
    paddingTop: 8,
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
  },
  recommendationText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
});
