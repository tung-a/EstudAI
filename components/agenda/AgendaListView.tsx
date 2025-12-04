import { Event } from "@/app/(user)/agenda";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDuration, formatHeaderTitle } from "@/lib/dateUtils";
import { MaterialIcons } from "@expo/vector-icons";
import { forwardRef, useMemo, useState } from "react";
import {
  SectionList,
  SectionListProps,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown, { MarkdownNode } from "react-native-markdown-display";
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

type AgendaListViewProps = {
  events: { [date: string]: Event[] };
  onDeleteEvent: (eventId: string) => void;
  todayString: string;
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
    const datesWithEvents = Object.keys(events);
    const allDatesSet = new Set(datesWithEvents);
    allDatesSet.add(todayString);
    const allSortedDates = Array.from(allDatesSet).sort();
    return allSortedDates.map((date) => ({
      title: date,
      data: events[date] || [],
    }));
  }, [events, todayString]);

  const markdownRules: any = useMemo(
    () => ({
      strong: (node: MarkdownNode, children: any) => (
        <Text
          key={node.key}
          style={{ fontWeight: "bold", color: themeColors.text, fontSize: 13 }}
        >
          {children}
        </Text>
      ),
      text: (node: MarkdownNode) => (
        <Text
          key={node.key}
          style={{ color: themeColors.text, fontSize: 13, lineHeight: 18 }}
        >
          {node.content}
        </Text>
      ),
      list_item: (node: MarkdownNode, children: any) => (
        <View key={node.key} style={{ flexDirection: "row" }}>
          <Text style={{ color: themeColors.text, marginRight: 5 }}>•</Text>
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      ),
      paragraph: (node: MarkdownNode, children: any) => (
        <View key={node.key} style={{ marginBottom: 5 }}>
          {children}
        </View>
      ),
    }),
    [themeColors.text]
  );

  return (
    <SectionList
      ref={ref}
      sections={sections}
      keyExtractor={(item, index) => item.id + index}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.listContentContainer}
      renderSectionHeader={({ section: { title, data } }) => (
        <View style={styles.sectionHeaderContainer}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingTop: 25,
              paddingBottom: 10,
            }}
          >
            <MaterialIcons
              name="auto-awesome"
              size={14}
              color={
                title === todayString ? themeColors.accent : themeColors.icon
              }
            />
            <ThemedText
              style={[
                styles.sectionHeader,
                title === todayString && { color: themeColors.accent },
                data.length === 0 && styles.emptySectionHeader,
              ]}
            >
              {formatHeaderTitle(title)}
            </ThemedText>
          </View>
          {data.length === 0 && sections.length > 0 && (
            <ThemedText style={styles.emptySectionText}>
              O silêncio reina no cosmos.
            </ThemedText>
          )}
        </View>
      )}
      renderItem={({ item, index }) => {
        const hasRecommendation = Boolean(item.studyRecommendation);
        const isExpanded = expandedEventId === item.id;

        return (
          <Animated.View
            entering={FadeInDown.delay(index * 200).duration(1000)}
            layout={Layout.delay(100).duration(500)}
          >
            <TouchableOpacity
              onPress={() => {
                if (hasRecommendation)
                  setExpandedEventId((c) => (c === item.id ? null : item.id));
              }}
              onLongPress={() => onDeleteEvent(item.id)}
              style={[
                styles.agendaEventItem,
                { backgroundColor: themeColors.card },
              ]}
              activeOpacity={hasRecommendation ? 0.7 : 1}
            >
              <View
                style={[
                  styles.accentLine,
                  { backgroundColor: themeColors.accent },
                ]}
              />

              <View style={styles.contentWrapper}>
                <View style={styles.topRow}>
                  <ThemedText style={styles.agendaEventTitle} numberOfLines={1}>
                    {item.title}
                  </ThemedText>
                  <View
                    style={[
                      styles.timeBadge,
                      { backgroundColor: themeColors.background },
                    ]}
                  >
                    <ThemedText style={{ fontSize: 12, fontWeight: "600" }}>
                      {item.time}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.subRow}>
                  <MaterialIcons
                    name="hourglass-empty"
                    size={12}
                    color={themeColors.icon}
                  />
                  <ThemedText style={styles.agendaEventDuration}>
                    {formatDuration(item.duration)}
                  </ThemedText>
                  {/* CORREÇÃO: Usando item.energy em vez de disciplinaNome */}
                  {item.energy && (
                    <>
                      <ThemedText style={styles.dotSeparator}>•</ThemedText>
                      <ThemedText
                        style={[
                          styles.agendaEventSubtitle,
                          { color: themeColors.accent },
                        ]}
                      >
                        {item.energy}
                      </ThemedText>
                    </>
                  )}
                </View>

                {hasRecommendation && (
                  <View
                    style={[
                      styles.recommendationSection,
                      { borderColor: themeColors.icon + "15" },
                    ]}
                  >
                    <View style={styles.recommendationHeader}>
                      <MaterialIcons
                        name="stars"
                        size={14}
                        color={themeColors.accent}
                      />
                      <ThemedText
                        style={[
                          styles.recommendationLabel,
                          { color: themeColors.accent },
                        ]}
                      >
                        Orientação Astral
                      </ThemedText>
                      <MaterialIcons
                        name={isExpanded ? "expand-less" : "expand-more"}
                        size={20}
                        color={themeColors.icon}
                        style={{ marginLeft: "auto" }}
                      />
                    </View>
                    {isExpanded && (
                      <View style={styles.recommendationTextContainer}>
                        <Markdown rules={markdownRules}>
                          {item.studyRecommendation || ""}
                        </Markdown>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
          
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="nights-stay"
            size={48}
            color={themeColors.icon + "40"}
          />
          <ThemedText style={styles.noEventsText}>
            Nenhum ritual agendado.
          </ThemedText>
          <ThemedText style={styles.noEventsSubText}>
            Toque em + para manifestar.
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
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptySectionHeader: { opacity: 0.5 },
  emptySectionText: {
    fontSize: 13,
    opacity: 0.5,
    fontStyle: "italic",
    paddingBottom: 15,
    paddingLeft: 24,
  },
  agendaEventItem: {
    flexDirection: "row",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  accentLine: { width: 6, height: "100%" },
  contentWrapper: { flex: 1, padding: 16 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  subRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  agendaEventTime: { fontSize: 16, fontWeight: "bold" },
  agendaEventDuration: { fontSize: 12, opacity: 0.7 },
  agendaEventTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  agendaEventSubtitle: { fontSize: 12, fontWeight: "500" },
  dotSeparator: { fontSize: 10, opacity: 0.4, marginHorizontal: 2 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  noEventsText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 18,
    fontWeight: "500",
    opacity: 0.8,
  },
  noEventsSubText: {
    textAlign: "center",
    marginTop: 5,
    fontSize: 14,
    opacity: 0.5,
  },
  recommendationSection: { marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  recommendationHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recommendationTextContainer: { marginTop: 8 },
  listItemStyle: { flexDirection: "row", marginBottom: 5, flexWrap: "wrap" },
});
