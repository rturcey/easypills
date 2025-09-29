// frontend/components/form/ScheduleCard.tsx - ✅ AVEC MARGES CORRECTES

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface ScheduleCardProps {
  time: string;
  selectedDays: string[];
  onTimePress: () => void;
  onDayToggle: (day: string) => void;
  onRemove?: () => void;
  showTimePicker: boolean;
  onTimeChange: (event: any, date?: Date) => void;
  onCloseTimePicker: () => void;
  disabled?: boolean;
}

export default function ScheduleCard({
                                       time,
                                       selectedDays,
                                       onTimePress,
                                       onDayToggle,
                                       onRemove,
                                       showTimePicker,
                                       onTimeChange,
                                       onCloseTimePicker,
                                       disabled,
                                     }: ScheduleCardProps) {
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  return (
      // ✅ CORRECTIF: Ajout marginBottom pour l'espacement
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.timeSection}>
            <Ionicons name="time-outline" size={20} color={Colors.primary.blue} />
            <TouchableOpacity
                style={styles.timeButton}
                onPress={onTimePress}
                disabled={disabled}
                activeOpacity={0.7}
            >
              <Text style={styles.timeText}>{time}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {onRemove && (
              <TouchableOpacity
                  style={styles.removeButton}
                  onPress={onRemove}
                  disabled={disabled}
                  activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={24} color={Colors.status.error} />
              </TouchableOpacity>
          )}
        </View>

        <View style={styles.daysContainer}>
          {DAYS.map((day) => {
            const isSelected = selectedDays.includes(day);
            return (
                <TouchableOpacity
                    key={day}
                    style={[styles.dayButton, isSelected && styles.dayButtonActive]}
                    onPress={() => onDayToggle(day)}
                    disabled={disabled}
                    activeOpacity={0.7}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
            );
          })}
        </View>

        {showTimePicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                  value={parseTime(time)}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
              />
              {Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.doneButton} onPress={onCloseTimePicker}>
                    <Text style={styles.doneText}>OK</Text>
                  </TouchableOpacity>
              )}
            </View>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    // ✅ CORRECTIF: Marge en bas pour l'espacement
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  timeText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  dayButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
    minWidth: 48,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.blue,
  },
  dayText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  dayTextActive: {
    color: Colors.text.white,
  },
  pickerContainer: {
    marginTop: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  doneButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.primary.blue,
  },
  doneText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.white,
  },
});