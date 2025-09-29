// frontend/components/shared/StatsCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';

interface StatsCardProps {
  type: 'progress' | 'summary' | 'split';
  
  // Pour type 'progress'
  percentage?: number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  stats?: Array<{ number: number | string; label: string }>;
  
  // Pour type 'summary'
  summaryIcon?: keyof typeof Ionicons.glyphMap;
  summaryText?: string;
  summaryValue?: string;
  
  // Pour type 'split'
  leftValue?: number | string;
  leftLabel?: string;
  rightValue?: number | string;
  rightLabel?: string;
}

export default function StatsCard({
  type,
  percentage,
  subtitle,
  icon,
  stats,
  summaryIcon,
  summaryText,
  summaryValue,
  leftValue,
  leftLabel,
  rightValue,
  rightLabel,
}: StatsCardProps) {
  return (
    <LinearGradient
      colors={Colors.gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Type: Progress (today.tsx style) */}
      {type === 'progress' && (
        <>
          <View style={styles.header}>
            <View>
              <Text style={styles.mainValue}>{percentage}%</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            {icon && (
              <View style={styles.iconContainer}>
                <Ionicons name={icon} size={40} color={Colors.text.white} />
              </View>
            )}
          </View>

          {stats && stats.length > 0 && (
            <View style={styles.statsRow}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.stat}>
                  <Text style={styles.statNumber}>{stat.number}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Type: Summary (history.tsx style) */}
      {type === 'summary' && (
        <View style={styles.summaryContent}>
          {summaryIcon && (
            <Ionicons name={summaryIcon} size={32} color={Colors.text.white} />
          )}
          <View style={styles.summaryText}>
            <Text style={styles.summaryValue}>{summaryValue}</Text>
            <Text style={styles.subtitle}>{summaryText}</Text>
          </View>
        </View>
      )}

      {/* Type: Split (manage-medications.tsx style) */}
      {type === 'split' && (
        <View style={styles.splitContent}>
          <View style={styles.splitItem}>
            <Text style={styles.splitValue}>{leftValue}</Text>
            <Text style={styles.splitLabel}>{leftLabel}</Text>
          </View>
          <View style={styles.splitDivider} />
          <View style={styles.splitItem}>
            <Text style={styles.splitValue}>{rightValue}</Text>
            <Text style={styles.splitLabel}>{rightLabel}</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mainValue: {
    color: Colors.text.white,
    fontSize: 36,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: FontSize.md,
    marginTop: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.text.white,
    fontSize: 24,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  summaryText: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.text.white,
  },
  splitContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  splitItem: {
    alignItems: 'center',
  },
  splitValue: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.text.white,
  },
  splitLabel: {
    fontSize: FontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  splitDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
