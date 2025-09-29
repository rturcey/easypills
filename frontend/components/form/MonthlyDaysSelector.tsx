// frontend/components/form/MonthlyDaysSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, CommonStyles } from '@/constants/theme';

interface MonthlyDaysSelectorProps {
  selectedDays: number[];
  onToggleDay: (day: number) => void;
  disabled?: boolean;
}

export default function MonthlyDaysSelector({
  selectedDays,
  onToggleDay,
  disabled,
}: MonthlyDaysSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={CommonStyles.label}>Jours du mois</Text>
      <View style={styles.grid}>
        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
          const isSelected = selectedDays.includes(day);
          return (
            <TouchableOpacity
              key={day}
              onPress={() => onToggleDay(day)}
              style={[styles.dayButton, isSelected && styles.dayButtonActive]}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dayButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  dayButtonActive: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.blue,
  },
  dayText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  dayTextActive: {
    color: Colors.text.white,
  },
});
