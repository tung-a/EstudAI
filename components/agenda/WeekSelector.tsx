import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDate, getWeekDays } from "@/lib/dateUtils";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type WeekSelectorProps = {
  currentWeekStart: Date;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onWeekChange: (direction: "prev" | "next") => void;
};

export const WeekSelector = ({
  currentWeekStart,
  selectedDate,
  onDateSelect,
  onWeekChange,
}: WeekSelectorProps) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const weekDays = getWeekDays(currentWeekStart);

  const firstDay = weekDays[0];
  const lastDay = weekDays[6];

  // Formatação de Mês mais elegante
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const monthLabel = monthNames[firstDay.getMonth()];
  const yearLabel = firstDay.getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <View>
          <ThemedText style={styles.monthLabel}>
            {monthLabel} {yearLabel}
          </ThemedText>
        </View>
        <View style={styles.navButtons}>
          <TouchableOpacity
            onPress={() => onWeekChange("prev")}
            hitSlop={20}
            style={styles.navBtn}
          >
            <MaterialIcons
              name="chevron-left"
              size={24}
              color={themeColors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onWeekChange("next")}
            hitSlop={20}
            style={styles.navBtn}
          >
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={themeColors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekDaysContainer}>
        {weekDays.map((day) => {
          const dayString = formatDate(day);
          const isSelected = dayString === selectedDate;
          const dayAbbr = day
            .toLocaleDateString("pt-BR", { weekday: "narrow" })
            .toUpperCase(); // D, S, T...

          return (
            <TouchableOpacity
              key={dayString}
              onPress={() => onDateSelect(dayString)}
              style={styles.dayItem}
            >
              <ThemedText
                style={[
                  styles.dayAbbreviation,
                  {
                    color: isSelected ? themeColors.accent : themeColors.icon,
                    fontWeight: isSelected ? "bold" : "normal",
                  },
                ]}
              >
                {dayAbbr}
              </ThemedText>
              <View
                style={[
                  styles.dateCircle,
                  isSelected
                    ? { backgroundColor: themeColors.accent }
                    : { backgroundColor: "transparent" },
                ]}
              >
                <Text
                  style={[
                    styles.dateNumber,
                    { color: isSelected ? "#fff" : themeColors.text },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
              {/* Ponto indicador se tiver evento (simulado visualmente para consistência) */}
              {isSelected && (
                <View
                  style={[styles.dot, { backgroundColor: themeColors.accent }]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: "rgba(128,128,128,0.05)",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  monthLabel: { fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  navButtons: { flexDirection: "row", gap: 10 },
  navBtn: {
    padding: 4,
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 8,
  },
  weekDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  dayItem: { alignItems: "center", width: 40 },
  dayAbbreviation: { fontSize: 11, marginBottom: 8, opacity: 0.6 },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  dateNumber: { fontSize: 15, fontWeight: "500" },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
