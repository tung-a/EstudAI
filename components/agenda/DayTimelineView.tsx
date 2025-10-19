// components/agenda/DayTimelineView.tsx
import { Event, EventsByDate } from "@/app/(user)/agenda";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDuration, getLocalDate } from "@/lib/dateUtils";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DimensionValue, // Import DimensionValue
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

const PIXELS_PER_HOUR = 80;

// Componente indicador de hora (simplificado, usa fuso do dispositivo)
const CurrentTimeIndicator = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timerId);
  }, []);

  const minutesSinceMidnight =
    currentTime.getHours() * 60 + currentTime.getMinutes();
  const topPosition = (minutesSinceMidnight / 60) * PIXELS_PER_HOUR;
  const indicatorColor = Colors.light.destructive; // Usando a cor diretamente

  return (
    <View
      style={[styles.timeIndicator, { top: topPosition }]}
      pointerEvents="none"
    >
      <View
        style={[styles.timeIndicatorDot, { backgroundColor: indicatorColor }]}
      />
      <View
        style={[styles.timeIndicatorLine, { backgroundColor: indicatorColor }]}
      />
    </View>
  );
};

// Tipos das Props (sem 'timezone')
type DayTimelineViewProps = {
  events: EventsByDate;
  selectedDate: string;
  onDeleteEvent: (eventId: string) => void;
};

// Tipo interno para eventos com layout calculado
type LayoutEvent = Event & {
  startMinutes: number;
  endMinutes: number;
  top: number;
  height: number;
  width: string; // Mantém como string para cálculo
  left: string; // Mantém como string para cálculo
};

export const DayTimelineView = ({
  events,
  selectedDate,
  onDeleteEvent,
}: DayTimelineViewProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const isToday = selectedDate === getLocalDate();
  const scrollViewRef = useRef<ScrollView>(null);

  // useEffect para scroll (inalterado)
  useEffect(() => {
    if (isToday && scrollViewRef.current) {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
      const scrollToPosition =
        (minutesSinceMidnight / 60) * PIXELS_PER_HOUR - PIXELS_PER_HOUR * 1.5;

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, scrollToPosition),
          animated: true,
        });
      }, 300);
    }
  }, [isToday, selectedDate]);

  // useMemo para calcular layout (inalterado)
  const laidOutEvents = useMemo(() => {
    const dayEventsRaw: (Event & {
      startMinutes: number;
      endMinutes: number;
    })[] = (events[selectedDate] || []).map((event) => {
      const [hour, minute] = event.time.split(":").map(Number);
      const startMinutes = hour * 60 + minute;
      return {
        ...event,
        startMinutes,
        endMinutes: startMinutes + event.duration,
      };
    });
    dayEventsRaw.sort((a, b) => a.startMinutes - b.startMinutes);

    const groups: (Event & { startMinutes: number; endMinutes: number })[][] =
      [];
    for (const event of dayEventsRaw) {
      let placed = false;
      for (const group of groups) {
        const groupEndTime = group.reduce(
          (maxEnd, ev) => Math.max(maxEnd, ev.endMinutes),
          0
        );
        if (event.startMinutes < groupEndTime) {
          group.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) {
        groups.push([event]);
      }
    }

    const finalLayout: LayoutEvent[] = [];
    for (const group of groups) {
      group.sort((a, b) => a.startMinutes - b.startMinutes);
      const columns: (Event & {
        startMinutes: number;
        endMinutes: number;
      })[][] = [];
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
        if (!placedInColumn) {
          columns.push([event]);
        }
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
      {/* Linhas de hora */}
      {Array.from({ length: 24 }).map((_, i) => (
        <View
          key={`hour-${i}`}
          style={[styles.hourContainer, { top: i * PIXELS_PER_HOUR }]}
        >
          <ThemedText style={styles.hourText}>{`${String(i).padStart(
            2,
            "0"
          )}:00`}</ThemedText>
          <View
            style={[styles.hourLine, { borderColor: themeColors.icon + "30" }]}
          />
        </View>
      ))}

      {/* Indicador de hora atual */}
      {isToday && <CurrentTimeIndicator />}

      {/* Renderiza os eventos posicionados */}
      {laidOutEvents.map((event) => {
        // --- CORREÇÃO: Define o estilo dinâmico com tipo explícito E cast para DimensionValue ---
        const dynamicEventStyle: ViewStyle = {
          position: "absolute",
          top: event.top,
          height: Math.max(25, event.height - 2),
          // Explicitamente diz ao TS que essas strings são DimensionValues válidos
          width: event.width as DimensionValue,
          left: event.left as DimensionValue,
          backgroundColor: themeColors.accent,
          borderColor: themeColors.background,
        };
        // --- FIM CORREÇÃO ---

        return (
          <TouchableOpacity
            key={event.id}
            onLongPress={() => onDeleteEvent(event.id)}
            style={[styles.timelineEvent, dynamicEventStyle]} // Combina estilos
            activeOpacity={0.8}
          >
            <Text style={styles.timelineEventTitle} numberOfLines={1}>
              {event.title}
            </Text>
            {event.height > 35 && (
              <Text style={styles.timelineEventTime} numberOfLines={1}>
                {event.time} ({formatDuration(event.duration)})
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Mensagem se não houver eventos no dia */}
      {laidOutEvents.length === 0 && (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="calendar-today"
            size={40}
            color={themeColors.icon + "80"}
          />
          <ThemedText style={styles.noEventsText}>
            Nenhum evento para este dia.
          </ThemedText>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  timelineContainer: {
    flex: 1,
    paddingLeft: 60,
    paddingRight: 10,
  },
  hourContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    height: 0,
  },
  hourText: {
    position: "absolute",
    left: -55,
    top: -8,
    fontSize: 12,
    opacity: 0.5,
  },
  hourLine: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    opacity: 0.3,
  },
  timelineEvent: {
    // position removido daqui
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "flex-start",
    marginHorizontal: 1,
  },
  timelineEventTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 2,
  },
  timelineEventTime: {
    color: "#fff",
    fontSize: 11,
    opacity: 0.9,
  },
  emptyContainer: {
    position: "absolute",
    top: "30%",
    left: 60,
    right: 10,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  noEventsText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 16,
    opacity: 0.7,
  },
  timeIndicator: {
    position: "absolute",
    left: -50,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    height: 0,
  },
  timeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: -4,
    zIndex: 11,
  },
  timeIndicatorLine: {
    flex: 1,
    height: 1.5,
  },
});
