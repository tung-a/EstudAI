import { Event, EventsByDate } from "@/app/(user)/agenda";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDuration, getLocalDate } from "@/lib/dateUtils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PIXELS_PER_HOUR = 80;

// Componente indicador de hora com lógica de timezone robusta
const CurrentTimeIndicator = ({ timezone }: { timezone: string }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  const getMinutesSinceMidnight = () => {
    try {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });
      const parts = formatter.formatToParts(currentTime);
      const hourPart = parts.find((p) => p.type === "hour");
      const minutePart = parts.find((p) => p.type === "minute");
      const hour = hourPart ? parseInt(hourPart.value, 10) % 24 : 0;
      const minute = minutePart ? parseInt(minutePart.value, 10) : 0;
      return hour * 60 + minute;
    } catch (e: any) {
      console.error("Erro ao calcular o horário com timezone:", e.message);
      // Fallback para o horário do sistema se o timezone for inválido
      return currentTime.getHours() * 60 + currentTime.getMinutes();
    }
  };

  const minutesSinceMidnight = getMinutesSinceMidnight();
  const topPosition = (minutesSinceMidnight / 60) * PIXELS_PER_HOUR;

  return (
    <View
      style={[styles.timeIndicator, { top: topPosition }]}
      pointerEvents="none"
    >
      <View style={styles.timeIndicatorDot} />
      <View style={styles.timeIndicatorLine} />
    </View>
  );
};

type DayTimelineViewProps = {
  events: EventsByDate;
  selectedDate: string;
  onDeleteEvent: (eventId: string) => void;
  timezone: string;
};

export const DayTimelineView = ({
  events,
  selectedDate,
  onDeleteEvent,
  timezone,
}: DayTimelineViewProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const isToday = selectedDate === getLocalDate();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isToday && scrollViewRef.current) {
      const now = new Date();
      const hour = parseInt(
        now.toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour12: false,
          hour: "2-digit",
        })
      );
      const minute = parseInt(
        now.toLocaleTimeString("en-US", {
          timeZone: timezone,
          minute: "2-digit",
        })
      );
      const minutesSinceMidnight = (hour % 24) * 60 + minute;

      const scrollToPosition =
        (minutesSinceMidnight / 60) * PIXELS_PER_HOUR - PIXELS_PER_HOUR * 1.5;

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, scrollToPosition),
          animated: true,
        });
      }, 300);
    }
  }, [isToday, selectedDate, timezone]);

  const laidOutEvents = useMemo(() => {
    const dayEvents: LayoutEvent[] = (events[selectedDate] || []).map(
      (event) => {
        const [hour, minute] = event.time.split(":").map(Number);
        const startMinutes = hour * 60 + minute;
        return {
          ...event,
          startMinutes,
          endMinutes: startMinutes + event.duration,
        };
      }
    );
    dayEvents.sort((a, b) => a.startMinutes - b.startMinutes);
    const groups: LayoutEvent[][] = [];
    for (const event of dayEvents) {
      let placed = false;
      for (const group of groups) {
        const lastEventInGroup = group[group.length - 1];
        if (event.startMinutes < lastEventInGroup.endMinutes) {
          group.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([event]);
    }
    const finalLayout: any[] = [];
    for (const group of groups) {
      const columns: LayoutEvent[][] = [];
      for (const event of group) {
        let placedInColumn = false;
        for (const column of columns) {
          const lastInColumn = column[column.length - 1];
          if (event.startMinutes >= lastInColumn.endMinutes) {
            column.push(event);
            placedInColumn = true;
            break;
          }
        }
        if (!placedInColumn) columns.push([event]);
      }
      const numColumns = columns.length;
      for (let i = 0; i < numColumns; i++) {
        for (const event of columns[i]) {
          finalLayout.push({
            ...event,
            top: (event.startMinutes / 60) * PIXELS_PER_HOUR,
            height: (event.duration / 60) * PIXELS_PER_HOUR,
            width: `${100 / numColumns}%`,
            left: `${(i * 100) / numColumns}%`,
          });
        }
      }
    }
    return finalLayout;
  }, [events, selectedDate]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.timelineContainer}
      contentContainerStyle={{ height: 24 * PIXELS_PER_HOUR }}
      showsVerticalScrollIndicator={false}
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <View
          key={`hour-${i}`}
          style={[styles.hourContainer, { top: i * PIXELS_PER_HOUR }]}
        >
          <ThemedText style={styles.hourText}>{`${String(i).padStart(
            2,
            "0"
          )}:00`}</ThemedText>
          <View style={[styles.hourLine, { borderColor: themeColors.icon }]} />
        </View>
      ))}

      {isToday && <CurrentTimeIndicator timezone={timezone} />}

      {laidOutEvents.map((event) => (
        <TouchableOpacity
          key={event.id}
          onLongPress={() => onDeleteEvent(event.id)}
          style={[
            styles.timelineEvent,
            {
              top: event.top,
              height: Math.max(40, (event.duration / 60) * PIXELS_PER_HOUR - 2),
              width: event.width,
              left: event.left,
              backgroundColor: themeColors.accent,
              borderColor: themeColors.background,
            },
          ]}
        >
          <Text style={styles.timelineEventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.timelineEventTime}>
            {event.time} - {formatDuration(event.duration)}
          </Text>
        </TouchableOpacity>
      ))}
      {laidOutEvents.length === 0 && (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.noEventsText}>
            Nenhum evento para este dia.
          </ThemedText>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  timelineContainer: { flex: 1, paddingLeft: 60, paddingRight: 10 },
  hourContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  hourText: {
    position: "absolute",
    left: -55,
    top: -8,
    fontSize: 12,
    opacity: 0.5,
  },
  hourLine: { flex: 1, borderTopWidth: StyleSheet.hairlineWidth, opacity: 0.3 },
  timelineEvent: {
    position: "absolute",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    marginHorizontal: 1,
  },
  timelineEventTitle: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  timelineEventTime: { color: "#fff", fontSize: 12, opacity: 0.9 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  noEventsText: { textAlign: "center", fontSize: 16, opacity: 0.7 },
  timeIndicator: {
    position: "absolute",
    left: -50,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  timeIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.destructive,
  },
  timeIndicatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.light.destructive,
  },
});

type LayoutEvent = Event & {
  startMinutes: number;
  endMinutes: number;
};
