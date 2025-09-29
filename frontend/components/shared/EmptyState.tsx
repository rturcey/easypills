// frontend/components/shared/EmptyState.tsx - ✅ CORRECTIF: Avec subtitle
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string; // ✅ AJOUTÉ
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
                                     icon,
                                     title,
                                     subtitle, // ✅ AJOUTÉ
                                     actionLabel,
                                     onAction,
                                   }: EmptyStateProps) {
  return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <LinearGradient
              colors={Colors.gradients.primary as any}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
          >
            <Ionicons name={icon} size={48} color={Colors.text.white} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>{title}</Text>

        {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
        )}

        {actionLabel && onAction && (
            <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
              <LinearGradient
                  colors={Colors.gradients.primary as any}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>{actionLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  button: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  buttonGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  buttonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.white,
  },
});