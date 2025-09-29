// frontend/app/manage-medications.tsx - ✅ HEADER SIMPLE + TOUS CORRECTIFS

import React, {useState, useCallback} from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMedications, updateMedication, deleteMedication, getSettings } from '@/services/storage';
import type { Medication } from '@/services/storage';
import { Colors, Spacing, CommonStyles, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import TabBar from '@/components/navigation/TabBar';
import AppHeader from '@/components/shared/AppHeader';
import { LoadingScreen, EmptyState } from '@/components/shared';
import MedicationListCard from '@/components/medication/MedicationListCard';
import AddMedicationModal from '@/components/medication/AddMedicationModal';

export default function ManageMedicationsScreen() {
  const insets = useSafeAreaInsets();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const loadData = async () => {
    try {
      const [meds, settings] = await Promise.all([
        getMedications(),
        getSettings(),
      ]);
      setMedications(meds);
      setIsPremium(settings.isPremium);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
      useCallback(() => {
        loadData();
      }, [])
  );

  const handleManualAdd = () => {
    setShowAddModal(false);
    router.push('/add-medication');
  };

  const handleScanPrescription = () => {
    if (!isPremium) {
      setShowAddModal(false);
      router.push('/premium');
      return;
    }
    setShowAddModal(false);
    router.push('/scan-prescription');
  };

  const handleScanBarcode = () => {
    if (!isPremium) {
      setShowAddModal(false);
      router.push('/premium');
      return;
    }
    setShowAddModal(false);
    router.push('/scan-barcode');
  };

  const toggleActive = async (id: string) => {
    try {
      const med = medications.find((m) => m.id === id);
      if (med) {
        await updateMedication(id, { paused: !med.paused });
        await loadData();
      }
    } catch (error) {
      console.error('Error toggling medication:', error);
      Alert.alert('Erreur', 'Impossible de modifier le médicament');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
        'Supprimer le médicament',
        'Êtes-vous sûr de vouloir supprimer ce médicament ? Cette action est irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteMedication(id);
                await loadData();
              } catch (error) {
                console.error('Error deleting medication:', error);
                Alert.alert('Erreur', 'Impossible de supprimer le médicament');
              }
            },
          },
        ]
    );
  };

  if (loading) return <LoadingScreen />;

  const activeMeds = medications.filter(m => !m.paused);
  const pausedMeds = medications.filter(m => m.paused);
  const totalTakes = medications.reduce((sum, med) =>
      sum + (med.paused ? 0 : (med.times?.length || 0)), 0
  );

  return (
      <SafeAreaView style={CommonStyles.container} edges={['top']}>
        {/* ✅ CORRECTIF: Header simple avec bouton + à droite */}
        <AppHeader
            title="Mes médicaments"
            showBackButton={false}
            rightActions={[{
              icon: 'add',
              onPress: () => setShowAddModal(true),
            }]}
        />

        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
        >
          {medications.length === 0 ? (
              <EmptyState
                  icon="medical"
                  title="Aucun médicament"
                  message="Ajoutez votre premier médicament pour commencer."
                  actionText="Ajouter un médicament"
                  onAction={() => setShowAddModal(true)}
              />
          ) : (
              <>
                {/* Statistiques */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{medications.length}</Text>
                    <Text style={styles.statLabel}>Médicaments</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{activeMeds.length}</Text>
                    <Text style={styles.statLabel}>Actifs</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{totalTakes}</Text>
                    <Text style={styles.statLabel}>Prises/jour</Text>
                  </View>
                </View>

                {/* Médicaments actifs */}
                {activeMeds.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        Actifs ({activeMeds.length})
                      </Text>
                      {activeMeds.map((med) => (
                          <MedicationListCard
                              key={med.id}
                              medication={med}
                              onPress={() => router.push(`/medication-details?id=${med.id}`)}
                              onEdit={() => router.push(`/edit-medication?id=${med.id}`)}
                              onTogglePause={() => toggleActive(med.id)}
                              onDelete={() => handleDelete(med.id)}
                          />
                      ))}
                    </View>
                )}

                {/* Médicaments en pause */}
                {pausedMeds.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        En pause ({pausedMeds.length})
                      </Text>
                      {pausedMeds.map((med) => (
                          <MedicationListCard
                              key={med.id}
                              medication={med}
                              onPress={() => router.push(`/medication-details?id=${med.id}`)}
                              onEdit={() => router.push(`/edit-medication?id=${med.id}`)}
                              onTogglePause={() => toggleActive(med.id)}
                              onDelete={() => handleDelete(med.id)}
                          />
                      ))}
                    </View>
                )}
              </>
          )}
        </ScrollView>

        <AddMedicationModal
            visible={showAddModal}
            isPremium={isPremium}
            onClose={() => setShowAddModal(false)}
            onManual={handleManualAdd}
            onScanPrescription={handleScanPrescription}
            onScanBarcode={handleScanBarcode}
        />

        <TabBar />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.primary.blue,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
});