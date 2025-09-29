// frontend/components/form/FrequencySelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, CommonStyles } from '@/constants/theme';

interface FrequencySelectorProps {
  value: 'weekly' | 'monthly';
  onChange: (value: 'weekly' | 'monthly') => void;
  disabled?: boolean;
}

export default function FrequencySelector({ value, onChange, disabled }: FrequencySelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={CommonStyles.label}>Fréquence</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          onPress={() => onChange('weekly')}
          style={[styles.button, value === 'weekly' && styles.buttonActive]}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={value === 'weekly' ? Colors.text.white : Colors.text.secondary}
          />
          <Text style={[styles.buttonText, value === 'weekly' && styles.buttonTextActive]}>
            Hebdomadaire
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => onChange('monthly')}
          style={[styles.button, value === 'monthly' && styles.buttonActive]}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={value === 'monthly' ? Colors.text.white : Colors.text.secondary}
          />
          <Text style={[styles.buttonText, value === 'monthly' && styles.buttonTextActive]}>
            Mensuel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  buttonActive: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.blue,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  buttonTextActive: {
    color: Colors.text.white,
  },
});
