// frontend/components/shared/SubmitButton.tsx - ✅ CORRECTIF: Avec variant
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

interface SubmitButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary'; // ✅ AJOUTÉ
  icon?: keyof typeof Ionicons.glyphMap; // ✅ AJOUTÉ
}

export default function SubmitButton({
                                       title,
                                       onPress,
                                       loading = false,
                                       disabled = false,
                                       variant = 'primary', // ✅ AJOUTÉ
                                       icon, // ✅ AJOUTÉ
                                     }: SubmitButtonProps) {
  const isDisabled = disabled || loading;

  // ✅ Variant secondary = bouton simple sans gradient
  if (variant === 'secondary') {
    return (
        <TouchableOpacity
            style={[styles.button, styles.secondaryButton, isDisabled && styles.buttonDisabled]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
        >
          <View style={styles.content}>
            {loading ? (
                <ActivityIndicator color={Colors.primary.blue} />
            ) : (
                <>
                  {icon && <Ionicons name={icon} size={20} color={Colors.primary.blue} />}
                  <Text style={styles.secondaryText}>{title}</Text>
                </>
            )}
          </View>
        </TouchableOpacity>
    );
  }

  // Variant primary = gradient
  return (
      <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={onPress}
          disabled={isDisabled}
          activeOpacity={0.8}
      >
        <LinearGradient
            colors={isDisabled ? [Colors.border.medium, Colors.border.light] as any : Colors.gradients.primary as any}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
          {loading ? (
              <ActivityIndicator color={Colors.text.white} />
          ) : (
              <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.white,
  },
  secondaryButton: {
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: Colors.primary.blue,
    paddingVertical: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  secondaryText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.blue,
  },
});