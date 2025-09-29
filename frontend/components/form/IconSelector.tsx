// frontend/components/form/IconSelector.tsx - ✅ 5 ICÔNES + MODAL COMPLÈTE

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEDICATION_ICONS } from '@/constants/medicationIcons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconId: string, color: string) => void;
  disabled?: boolean;
}

// ✅ Les 5 icônes les plus fréquentes
const FREQUENT_ICONS = ['pill', 'capsule', 'syrup', 'injection', 'inhaler'];

export default function IconSelector({ selectedIcon, onSelectIcon, disabled }: IconSelectorProps) {
  const [showAllModal, setShowAllModal] = useState(false);

  const frequentIcons = MEDICATION_ICONS.filter(icon => FREQUENT_ICONS.includes(icon.id));
  const selectedIconData = MEDICATION_ICONS.find(icon => icon.id === selectedIcon);

  const handleSelectIcon = (iconId: string, color: string) => {
    onSelectIcon(iconId, color);
    setShowAllModal(false);
  };

  return (
      <View style={styles.container}>
        <Text style={styles.label}>Type de médicament</Text>

        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
          {/* 5 icônes fréquentes */}
          {frequentIcons.map((item) => {
            const isSelected = selectedIcon === item.id;
            return (
                <TouchableOpacity
                    key={item.id}
                    onPress={() => onSelectIcon(item.id, item.color)}
                    style={[
                      styles.iconButton,
                      isSelected && {
                        backgroundColor: item.color,
                        borderColor: item.color,
                      },
                    ]}
                    activeOpacity={0.7}
                    disabled={disabled}
                >
                  <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={isSelected ? Colors.text.white : item.color}
                  />
                  <Text style={[styles.iconLabel, isSelected && styles.iconLabelActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
            );
          })}

          {/* Bouton + pour voir tous */}
          <TouchableOpacity
              style={[
                styles.iconButton,
                styles.moreButton,
                !FREQUENT_ICONS.includes(selectedIcon) && {
                  backgroundColor: selectedIconData?.color || Colors.primary.blue,
                  borderColor: selectedIconData?.color || Colors.primary.blue,
                }
              ]}
              onPress={() => setShowAllModal(true)}
              activeOpacity={0.7}
              disabled={disabled}
          >
            <Ionicons
                name="add-circle"
                size={32}
                color={
                  !FREQUENT_ICONS.includes(selectedIcon)
                      ? Colors.text.white
                      : Colors.primary.blue
                }
            />
            <Text style={[
              styles.iconLabel,
              !FREQUENT_ICONS.includes(selectedIcon) && styles.iconLabelActive
            ]}>
              {!FREQUENT_ICONS.includes(selectedIcon) && selectedIconData
                  ? selectedIconData.name
                  : 'Autre'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal avec toutes les icônes */}
        <Modal
            visible={showAllModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowAllModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setShowAllModal(false)}
            />

            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choisir un type</Text>
                <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setShowAllModal(false)}
                >
                  <Ionicons name="close" size={24} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.iconsGrid}>
                  {MEDICATION_ICONS.map((item) => {
                    const isSelected = selectedIcon === item.id;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => handleSelectIcon(item.id, item.color)}
                            style={[
                              styles.gridIcon,
                              isSelected && {
                                backgroundColor: item.color,
                                borderColor: item.color,
                              },
                            ]}
                            activeOpacity={0.7}
                        >
                          <Ionicons
                              name={item.icon as any}
                              size={28}
                              color={isSelected ? Colors.text.white : item.color}
                          />
                          <Text style={[
                            styles.gridIconLabel,
                            isSelected && styles.gridIconLabelActive
                          ]}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
    minWidth: 100,
  },
  moreButton: {
    borderStyle: 'dashed',
  },
  iconLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    marginTop: 6,
  },
  iconLabelActive: {
    color: Colors.text.white,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border.default,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.background.light,
  },
  modalScroll: {
    paddingHorizontal: Spacing.xl,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridIcon: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
    padding: Spacing.sm,
  },
  gridIconLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  gridIconLabelActive: {
    color: Colors.text.white,
  },
});