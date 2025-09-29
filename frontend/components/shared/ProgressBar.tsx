// frontend/components/shared/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface ProgressBarProps {
  percentage: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export default function ProgressBar({
  percentage,
  height = 8,
  color = Colors.status.success,
  backgroundColor = Colors.background.tertiary,
}: ProgressBarProps) {
  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, percentage))}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
