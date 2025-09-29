// frontend/components/medication/MedicationListCard.tsx - ✅ MENU WEB-FRIENDLY

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Medication } from '@/services/storage';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

interface MedicationListCardProps {
  medication: Medication;
  onPress: () => void;
  onEdit: () => void;
  onTogglePause: () => void;
  onDelete: () => void;
}

export default function MedicationListCard({
                                             medication,
                                             onPress,
                                             onEdit,
                                             onTogglePause,
                                             onDelete,
                                           }: MedicationListCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const isActive = !medication.paused;
  const timesText = medication.times.join(', ');
  const hasDates = medication.startISO || medication.endISO;

  const handleMenuToggle = (e?: any) => {
    if (e) e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action: () => void) => (e?: any) => {
    if (e) e.stopPropagation();
    setShowMenu(false);
    // ✅ CORRECTIF: Utiliser setTimeout pour que le menu se ferme d'abord
    setTimeout(() => {
      action();
    }, 100);
  };

  return (
      <View style={styles.wrapper}>
        <TouchableOpacity
            style={[styles.container, !isActive && styles.containerInactive]}
            onPress={onPress}
            activeOpacity={0.7}
        >
          <View style={styles.content}>
            <View style={styles.main}>
              <View style={styles.header}>
                <View style={styles.nameSection}>
                  <Text style={[styles.name, !isActive && styles.nameInactive]}>
                    {medication.name}
                  </Text>
                  {!isActive && (
                      <View style={styles.pausedBadge}>
                        <Ionicons name="pause" size={12} color={Colors.status.warning} />
                        <Text style={styles.pausedText}>Pause</Text>
                      </View>
                  )}
                </View>

                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={handleMenuToggle}
                    activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {medication.dosage && (
                  <Text style={styles.dosage}>💊 {medication.dosage}</Text>
              )}

              <View style={styles.timesContainer}>
                <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.times}>{timesText}</Text>
              </View>

              {hasDates && (
                  <View style={styles.datesContainer}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.text.secondary} />
                    <Text style={styles.dates}>
                      {medication.startISO && `Du ${new Date(medication.startISO).toLocaleDateString('fr-FR')}`}
                      {medication.endISO && ` au ${new Date(medication.endISO).toLocaleDateString('fr-FR')}`}
                    </Text>
                  </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* ✅ CORRECTIF: Menu dropdown absolu (web-friendly) */}
        {showMenu && (
            <>
              <TouchableOpacity
                  style={styles.menuBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowMenu(false)}
              />
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleAction(onEdit)}
                    activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={20} color={Colors.primary.blue} />
                  <Text style={styles.menuItemText}>Modifier</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleAction(onTogglePause)}
                    activeOpacity={0.7}
                >
                  <Ionicons
                      name={isActive ? "pause-outline" : "play-outline"}
                      size={20}
                      color={Colors.status.warning}
                  />
                  <Text style={styles.menuItemText}>
                    {isActive ? 'Mettre en pause' : 'Réactiver'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleAction(onDelete)}
                    activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.status.error} />
                  <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
              </View>
            </>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  containerInactive: {
    opacity: 0.6,
    backgroundColor: Colors.background.light,
  },
  content: {
    padding: Spacing.lg,
  },
  main: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  nameSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  nameInactive: {
    color: Colors.text.secondary,
  },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
    borderRadius: BorderRadius.sm,
  },
  pausedText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.status.warning,
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.background.light,
  },
  dosage: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  timesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  times: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dates: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
  },
  // ✅ Menu dropdown absolu (meilleur pour web)
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? {
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
    } : {}),
  },
  menuDropdown: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    minWidth: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
      } as any,
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  menuItemText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  menuItemTextDanger: {
    color: Colors.status.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginHorizontal: Spacing.lg,
  },
});