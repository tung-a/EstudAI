import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const getWeekDays = (date: Date): Date[] => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 0);
  startOfWeek.setDate(diff);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(startOfWeek);
    nextDay.setDate(startOfWeek.getDate() + i);
    week.push(nextDay);
  }
  return week;
};

const formatDate = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

const dayAbbreviations = [
  "dom.",
  "seg.",
  "ter.",
  "qua.",
  "qui.",
  "sex.",
  "sáb.",
];

type CustomWeekViewProps = {
  events: { [date: string]: any[] };
  selectedDate: string;
  onDateSelect: (date: string) => void;
};

export const CustomWeekView = ({
  events,
  selectedDate,
  onDateSelect,
}: CustomWeekViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];

  const weekDays = getWeekDays(currentDate);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const weekLabel = `out. ${weekDays[0].getDate()} - out. ${weekDays[6].getDate()}, ${weekDays[0].getFullYear()}`;

  return (
    <View style={styles.container}>
      {/* Header com navegação da semana */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevWeek}>
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={themeColors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: themeColors.text }]}>
          {weekLabel}
        </Text>
        <TouchableOpacity onPress={handleNextWeek}>
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={themeColors.text}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.weekContainer}>
        {weekDays.map((day, index) => {
          const dayString = formatDate(day);
          const isSelected = dayString === selectedDate;
          const dayEvents = events[dayString] || [];

          return (
            <View
              key={dayString}
              style={[styles.dayColumn, { borderColor: themeColors.icon }]}
            >
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() => onDateSelect(dayString)}
              >
                <Text
                  style={[styles.dayAbbreviation, { color: themeColors.icon }]}
                >
                  {dayAbbreviations[day.getDay()]}
                </Text>
                <View
                  style={[
                    styles.dateContainer,
                    isSelected && { backgroundColor: themeColors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateNumber,
                      { color: themeColors.text },
                      isSelected && { color: "#fff", fontWeight: "bold" },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
              <ScrollView style={styles.eventsContainer}>
                {/* Aqui você pode renderizar os eventos do dia */}
                {dayEvents.map((event, eventIndex) => (
                  <View key={eventIndex} style={styles.eventItem}>
                    <ThemedText>{event.title}</ThemedText>
                  </View>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
  },
  weekContainer: {
    flex: 1,
    flexDirection: "row",
    borderTopWidth: 1,
  },
  dayColumn: {
    flex: 1,
    borderRightWidth: 1,
  },
  dayHeader: {
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dayAbbreviation: {
    textTransform: "lowercase",
    fontSize: 12,
    marginBottom: 8,
  },
  dateContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  dateNumber: {
    fontSize: 16,
  },
  eventsContainer: {
    flex: 1,
    padding: 5,
  },
  eventItem: {
    backgroundColor: "rgba(10, 126, 164, 0.1)",
    borderRadius: 4,
    padding: 8,
    marginBottom: 5,
  },
});
