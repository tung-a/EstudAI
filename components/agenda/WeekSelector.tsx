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
  const firstMonth = firstDay.toLocaleDateString("pt-BR", { month: "long" });
  const lastMonth = lastDay.toLocaleDateString("pt-BR", { month: "long" });

  let monthLabel = firstMonth;
  if (firstMonth !== lastMonth) {
    monthLabel = `${firstMonth.substring(0, 3)} / ${lastMonth.substring(0, 3)}`;
  }
  monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <ThemedText style={styles.monthLabel}>
          {monthLabel} {firstDay.getFullYear()}
        </ThemedText>
        <View style={styles.navButtons}>
          <TouchableOpacity onPress={() => onWeekChange("prev")} hitSlop={20}>
            <MaterialIcons
              name="chevron-left"
              size={28}
              color={themeColors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onWeekChange("next")} hitSlop={20}>
            <MaterialIcons
              name="chevron-right"
              size={28}
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
            .toLocaleDateString("pt-BR", { weekday: "short" })
            .substring(0, 3)
            .toUpperCase();

          return (
            <TouchableOpacity
              key={dayString}
              onPress={() => onDateSelect(dayString)}
              style={styles.dayItem}
            >
              <ThemedText
                style={[
                  styles.dayAbbreviation,
                  { color: isSelected ? themeColors.accent : themeColors.icon },
                ]}
              >
                {dayAbbr}
              </ThemedText>
              <View
                style={[
                  styles.dateCircle,
                  isSelected && { backgroundColor: themeColors.accent },
                ]}
              >
                <Text
                  style={[
                    styles.dateNumber,
                    { color: themeColors.text },
                    isSelected && { color: "#fff" },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(128,128,128,0.1)",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  navButtons: {
    flexDirection: "row",
  },
  weekDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  dayItem: {
    alignItems: "center",
    padding: 4,
    borderRadius: 20,
  },
  dayAbbreviation: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.8,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
});
