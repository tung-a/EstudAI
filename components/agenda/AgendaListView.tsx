import { EventsByDate } from "@/app/(user)/agenda";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDuration, formatHeaderTitle } from "@/lib/dateUtils";
import React, { useMemo } from "react";
import { SectionList, StyleSheet, TouchableOpacity, View } from "react-native";

type AgendaListViewProps = {
  events: EventsByDate;
  onDeleteEvent: (eventId: string) => void;
};

export const AgendaListView = ({
  events,
  onDeleteEvent,
}: AgendaListViewProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const sections = useMemo(() => {
    const sortedDates = Object.keys(events).sort();
    return sortedDates.map((date) => ({
      title: date,
      data: events[date],
    }));
  }, [events]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingHorizontal: 20 }}
      renderSectionHeader={({ section: { title } }) => (
        <ThemedText style={styles.sectionHeader}>
          {formatHeaderTitle(title)}
        </ThemedText>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
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
            <ThemedText style={styles.agendaEventTitle}>
              {item.title}
            </ThemedText>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <ThemedText style={styles.noEventsText}>
          Nenhum evento agendado.
        </ThemedText>
      }
    />
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    paddingVertical: 15,
    paddingTop: 25,
  },
  agendaEventItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  eventTimeDetails: { width: 70, alignItems: "flex-start" },
  agendaEventTime: { fontSize: 16, fontWeight: "bold" },
  agendaEventDuration: { fontSize: 12, opacity: 0.7 },
  eventTitleBar: { width: 4, height: "100%", borderRadius: 2, marginRight: 12 },
  agendaEventTitleContainer: { flex: 1 },
  agendaEventTitle: { fontSize: 16 },
  noEventsText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    opacity: 0.7,
  },
});
