// frontend/components/form/DatePickerField.tsx - ✅ NOUVEAU: Composant DatePicker
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, CommonStyles } from '@/constants/theme';

interface DatePickerFieldProps {
  label: string;
  date: Date | null;
  onPress: () => void;
  onClear?: () => void;
  disabled?: boolean;
}

export default function DatePickerField({
                                          label,
                                          date,
                                          onPress,
                                          onClear,
                                          disabled,
                                        }: DatePickerFieldProps) {
  const dateString = date ? date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Non définie';

  return (
      <View style={styles.container}>
        <Text style={CommonStyles.label}>{label}</Text>
        <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
          <Ionicons name="calendar" size={20} color={Colors.primary.blue} />
          <Text style={styles.dateText}>{dateString}</Text>
          {date && onClear && !disabled && (
              <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={Colors.text.light} />
              </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dateText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    fontWeight: FontWeight.medium,
  },
  clearButton: {
    padding: Spacing.xs,
  },
});