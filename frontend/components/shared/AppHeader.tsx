// frontend/components/shared/AppHeader.tsx - ✅ HEADER SIMPLE ET ÉLÉGANT

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean; // Afficher le bouton retour
  rightActions?: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    badge?: number;
  }>;
}

export default function AppHeader({
                                    title,
                                    showBackButton = true,
                                    rightActions = []
                                  }: AppHeaderProps) {
  return (
      <View style={styles.container}>
        {/* Bouton retour à gauche */}
        <View style={styles.leftSection}>
          {showBackButton ? (
              <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
              >
                <Ionicons
                    name="chevron-back"
                    size={28}
                    color={Colors.primary.blue}
                />
              </TouchableOpacity>
          ) : (
              <View style={styles.backButton} />
          )}
        </View>

        {/* Titre centré */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Actions à droite */}
        <View style={styles.rightSection}>
          {rightActions.length > 0 ? (
              rightActions.map((action, index) => (
                  <TouchableOpacity
                      key={index}
                      style={styles.actionButton}
                      onPress={action.onPress}
                      activeOpacity={0.7}
                  >
                    <Ionicons
                        name={action.icon}
                        size={24}
                        color={Colors.primary.blue}
                    />
                    {action.badge !== undefined && action.badge > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {action.badge > 99 ? '99+' : action.badge}
                          </Text>
                        </View>
                    )}
                  </TouchableOpacity>
              ))
          ) : (
              <View style={styles.actionButton} />
          )}
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    minHeight: 56,
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 48,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.text.white,
  },
});