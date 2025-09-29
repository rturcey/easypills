// frontend/components/shared/MenuItem.tsx - ✅ DESIGN SETTINGS CORRIGÉ

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  rightElement?: 'switch' | 'chevron' | 'external' | 'lock' | 'none';
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
}

export default function MenuItem({
                                   icon,
                                   iconColor = Colors.primary.blue,
                                   title,
                                   subtitle,
                                   rightElement = 'chevron',
                                   switchValue,
                                   onSwitchChange,
                                   onPress,
                                 }: MenuItemProps) {
  const content = (
      <>
        <View style={styles.left}>
          <View style={[styles.iconBox, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>

        {rightElement === 'switch' && (
            <Switch
                value={switchValue}
                onValueChange={onSwitchChange}
                trackColor={{
                  false: Colors.border.default,
                  true: Colors.primary.blue,
                }}
                thumbColor={switchValue ? Colors.primary.blue : Colors.text.secondary}
            />
        )}

        {rightElement === 'chevron' && (
            <Ionicons name="chevron-forward" size={20} color={Colors.text.light} />
        )}

        {rightElement === 'external' && (
            <Ionicons name="open-outline" size={20} color={Colors.text.light} />
        )}

        {rightElement === 'lock' && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={14} color="#FFA500" />
            </View>
        )}
      </>
  );

  // ✅ Si c'est un switch ou 'none', on ne wrap pas dans TouchableOpacity
  if (rightElement === 'switch' || rightElement === 'none') {
    return <View style={styles.container}>{content}</View>;
  }

  return (
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // ✅ CORRECTIF: Padding réduit et unifié
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});