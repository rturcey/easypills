// frontend/app/confirm-medications.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, CommonStyles } from '@/constants/theme';
import { Header } from '@/components/shared';
import type { ExtractedMedication } from '@/services/ocr-service';

export default function ConfirmMedicationsScreen() {
  const params = useLocalSearchParams();
  const medicationsData = params.medications as string;

  const [medications, setMedications] = useState<ExtractedMedication[]>(() => {
    try {
      return JSON.parse(medicationsData);
    } catch {
      return [];
    }
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    return new Set(medications.map((_, index) => index));
  });

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIds(newSet);
  };

  const handleConfirm = () => {
    const selectedMedications = medications.filter((_, index) => selectedIds.has(index));

    if (selectedMedications.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins un médicament');
      return;
    }

    if (selectedMedications.length === 1) {
      // Un seul médicament : aller directement au formulaire avec pré-remplissage
      const med = selectedMedications[0];
      router.replace({
        pathname: '/add-medication',
        params: {
          fromScan: 'true',
          name: med.name,
          dosage: med.dosage || '',
        },
      });
    } else {
      // Plusieurs médicaments : créer tous et retourner
      Alert.alert(
        'Médicaments détectés',
        `${selectedMedications.length} médicaments ont été détectés. Vous pourrez les configurer un par un.`,
        [
          {
            text: 'Continuer',
            onPress: () => {
              // Pour l'instant, créer le premier et permettre de créer les autres manuellement
              const med = selectedMedications[0];
              router.replace({
                pathname: '/add-medication',
                params: {
                  fromScan: 'true',
                  name: med.name,
                  dosage: med.dosage || '',
                  remainingMeds: JSON.stringify(selectedMedications.slice(1)),
                },
              });
            },
          },
        ]
      );
    }
  };

  if (medications.length === 0) {
    return (
      <SafeAreaView style={CommonStyles.container} edges={['top']}>
        <Header title="Confirmation" />
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.text.secondary} />
          <Text style={styles.emptyText}>Aucun médicament détecté</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CommonStyles.container} edges={['top']}>
      <Header title="Médicaments détectés" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary.blue} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Vérifiez les informations</Text>
            <Text style={styles.infoText}>
              Sélectionnez les médicaments à ajouter et vérifiez que les informations sont correctes.
            </Text>
          </View>
        </View>

        {/* Liste des médicaments */}
        <View style={styles.medicationsList}>
          {medications.map((med, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.medicationCard,
                selectedIds.has(index) && styles.medicationCardSelected,
              ]}
              onPress={() => toggleSelection(index)}
              activeOpacity={0.7}
            >
              <View style={styles.medicationHeader}>
                <View
                  style={[
                    styles.checkbox,
                    selectedIds.has(index) && styles.checkboxSelected,
                  ]}
                >
                  {selectedIds.has(index) && (
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  )}
                </View>

                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  {med.dosage && (
                    <Text style={styles.medicationDosage}>{med.dosage}</Text>
                  )}
                  {med.frequency && (
                    <Text style={styles.medicationFrequency}>
                      <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
                      {' '}{med.frequency}
                    </Text>
                  )}
                </View>

                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {Math.round(med.confidence * 100)}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.status.warning} />
          <Text style={styles.noteText}>
            Les informations extraites doivent être vérifiées avec votre ordonnance originale.
            EasyPills ne remplace pas l'avis d'un professionnel de santé.
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={selectedIds.size === 0}
        >
          <LinearGradient
            colors={Colors.gradients.primary}
            style={styles.confirmGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.confirmButtonText}>
              Confirmer ({selectedIds.size})
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: `${Colors.primary.blue}10`,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.blue,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs / 2,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  medicationsList: {
    gap: Spacing.md,
  },
  medicationCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  medicationCardSelected: {
    borderColor: Colors.primary.blue,
    backgroundColor: `${Colors.primary.blue}05`,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.blue,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs / 2,
  },
  medicationDosage: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs / 2,
  },
  medicationFrequency: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  confidenceBadge: {
    backgroundColor: Colors.status.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  confidenceText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.status.success,
  },
  noteCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: `${Colors.status.warning}10`,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  confirmButton: {
    flex: 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary.blue,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#FFF',
  },
});
