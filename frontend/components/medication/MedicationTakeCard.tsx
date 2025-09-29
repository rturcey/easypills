// frontend/components/medication/MedicationTakeCard.tsx - ✅ CORRECTIF: Interface
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MedicationTake } from '@/services/storage';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

interface MedicationTakeCardProps {
  take: MedicationTake;
  onToggle: (id: string, taken: boolean) => void; // ✅ CORRECTIF: Signature complète
}

export default function MedicationTakeCard({ take, onToggle }: MedicationTakeCardProps) {
  const handleToggle = () => {
    onToggle(take.id, !take.taken);
  };

  return (
      <TouchableOpacity
          style={[styles.container, take.taken && styles.containerTaken]}
          onPress={handleToggle}
          activeOpacity={0.7}
      >
        <View style={styles.content}>
          <View style={styles.info}>
            <Text style={[styles.time, take.taken && styles.timeTaken]}>
              {take.scheduledTime}
            </Text>
            <Text style={[styles.name, take.taken && styles.nameTaken]}>
              {take.medicationName}
            </Text>
            {take.dosage && (
                <Text style={styles.dosage}>{take.dosage}</Text>
            )}
          </View>

          <View style={[
            styles.checkbox,
            take.taken && styles.checkboxChecked
          ]}>
            {take.taken && (
                <Ionicons name="checkmark" size={24} color={Colors.text.white} />
            )}
          </View>
        </View>
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  containerTaken: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.status.success,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  time: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary.blue,
    marginBottom: Spacing.xs,
  },
  timeTaken: {
    color: Colors.status.success,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  nameTaken: {
    color: Colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  dosage: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  checkbox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
  },
  checkboxChecked: {
    backgroundColor: Colors.status.success,
    borderColor: Colors.status.success,
  },
});