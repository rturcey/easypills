// Créer le fichier: frontend/components/medication/AddMedicationModal.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';

interface AddMedicationModalProps {
  visible: boolean;
  isPremium: boolean;
  onClose: () => void;
  onManual: () => void;
  onScanPrescription: () => void;
  onScanBarcode: () => void;
}

export default function AddMedicationModal({
  visible,
  isPremium,
  onClose,
  onManual,
  onScanPrescription,
  onScanBarcode,
}: AddMedicationModalProps) {
  
  const options = [
    {
      id: 'manual',
      icon: 'create-outline',
      title: 'Saisir manuellement',
      subtitle: 'Entrer les informations du médicament',
      color: Colors.primary.blue,
      isPremium: false,
      onPress: onManual,
    },
    {
      id: 'prescription',
      icon: 'document-text-outline',
      title: 'Scanner une ordonnance',
      subtitle: 'Reconnaissance automatique OCR',
      color: Colors.primary.turquoise,
      isPremium: true,
      onPress: onScanPrescription,
    },
    {
      id: 'barcode',
      icon: 'barcode-outline',
      title: 'Scanner un code-barre',
      subtitle: 'Code CIP13 sur la boîte',
      color: Colors.primary.orange,
      isPremium: true,
      onPress: onScanBarcode,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modalContent}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ajouter un médicament</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {options.map((option) => {
              const isLocked = option.isPremium && !isPremium;
              
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    isLocked && styles.optionLocked,
                  ]}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  {/* Icon */}
                  <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
                    <Ionicons name={option.icon as any} size={28} color={option.color} />
                  </View>

                  {/* Content */}
                  <View style={styles.optionContent}>
                    <View style={styles.optionHeader}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      {option.isPremium && (
                        <View style={styles.premiumBadge}>
                          <Ionicons name="diamond" size={12} color="#FFD700" />
                          <Text style={styles.premiumText}>Premium</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>

                  {/* Arrow / Lock */}
                  <Ionicons
                    name={isLocked ? 'lock-closed' : 'chevron-forward'}
                    size={22}
                    color={isLocked ? Colors.text.light : Colors.text.secondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Premium CTA si pas premium */}
          {!isPremium && (
            <View style={styles.premiumCTA}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.premiumGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="star" size={20} color="#FFF" />
                <Text style={styles.premiumCTAText}>
                  Débloquez le scan avec Premium
                </Text>
              </LinearGradient>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    gap: Spacing.md,
  },
  optionLocked: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs / 2,
  },
  optionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: BorderRadius.sm,
  },
  premiumText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: '#FFD700',
  },
  optionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  premiumCTA: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.medium,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  premiumCTAText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#FFF',
  },
});
