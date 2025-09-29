// frontend/app/scan-prescription.tsx - ✅ BOUTON AJOUTER CORRIGÉ

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, CommonStyles } from '@/constants/theme';
import AppHeader from '@/components/shared/AppHeader';
import { LoadingScreen } from '@/components/shared';
import { extractMedicationsFromImage, type DetectedMedication } from '@/services/ocr-service';

export default function ScanPrescriptionScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<DetectedMedication[]>([]);
  const [selectedMeds, setSelectedMeds] = useState<Set<number>>(new Set());

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setMedications([]);
        setSelectedMeds(new Set());
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setMedications([]);
        setSelectedMeds(new Set());
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) return;

    setLoading(true);
    try {
      const detected = await extractMedicationsFromImage(imageUri);

      if (detected.length === 0) {
        Alert.alert(
            'Aucun médicament détecté',
            'Essayez avec une photo plus claire ou saisissez manuellement.'
        );
      } else {
        setMedications(detected);
        setSelectedMeds(new Set(detected.map((_, i) => i)));
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'analyser l\'image');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (index: number) => {
    setSelectedMeds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // ✅ CORRECTIF: Bouton Ajouter fonctionnel
  const handleAddSelected = () => {
    console.log('handleAddSelected called', { selectedMeds: selectedMeds.size });

    if (selectedMeds.size === 0) {
      Alert.alert('Aucune sélection', 'Veuillez sélectionner au moins un médicament');
      return;
    }

    const selected = Array.from(selectedMeds)
        .map(i => medications[i])
        .filter(Boolean);

    console.log('Selected medications:', selected);

    if (selected.length === 1) {
      // Un seul médicament
      const med = selected[0];
      console.log('Navigating to add-medication with:', med);
      router.push({
        pathname: '/add-medication',
        params: {
          fromScan: 'true',
          name: med.name,
          dosage: med.dosage || '',
          frequency: med.frequency || '',
        }
      });
    } else {
      // Plusieurs médicaments
      console.log('Adding multiple medications:', selected.length);
      addMedicationsSequentially(selected);
    }
  };

  const addMedicationsSequentially = (meds: DetectedMedication[]) => {
    if (meds.length === 0) {
      Alert.alert('Terminé', 'Tous les médicaments ont été ajoutés !', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    const [current, ...remaining] = meds;

    Alert.alert(
        `Ajouter ${current.name} ?`,
        current.dosage ? `Dosage : ${current.dosage}\n${current.frequency || ''}` : '',
        [
          {
            text: 'Passer',
            onPress: () => addMedicationsSequentially(remaining),
          },
          {
            text: 'Ajouter',
            onPress: () => {
              router.push({
                pathname: '/add-medication',
                params: {
                  fromScan: 'true',
                  name: current.name,
                  dosage: current.dosage || '',
                  frequency: current.frequency || '',
                  hasMore: remaining.length > 0 ? 'true' : 'false',
                  remainingMeds: JSON.stringify(remaining),
                }
              });
            },
          },
        ]
    );
  };

  if (loading) return <LoadingScreen text="Analyse de l'ordonnance..." />;

  return (
      <SafeAreaView style={CommonStyles.container} edges={['top']}>
        <AppHeader title="Scanner une ordonnance" showBackButton={true} />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          {!imageUri ? (
              <View style={styles.emptyState}>
                <View style={styles.iconContainer}>
                  <Ionicons name="document-text-outline" size={80} color={Colors.primary.blue} />
                </View>
                <Text style={styles.emptyTitle}>Scannez votre ordonnance</Text>
                <Text style={styles.emptySubtitle}>
                  Prenez une photo claire de votre ordonnance pour détecter automatiquement vos médicaments
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
                    <LinearGradient
                        colors={[Colors.primary.blue, Colors.primary.turquoise]}
                        style={styles.actionGradient}
                    >
                      <Ionicons name="camera" size={24} color="#FFF" />
                      <Text style={styles.actionText}>Prendre une photo</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButtonSecondary} onPress={pickImage}>
                    <Ionicons name="images" size={24} color={Colors.primary.blue} />
                    <Text style={styles.actionTextSecondary}>Choisir depuis la galerie</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.tips}>
                  <Text style={styles.tipsTitle}>💡 Conseils pour un meilleur scan</Text>
                  <View style={styles.tipsList}>
                    <Text style={styles.tipItem}>• Assurez-vous que l'ordonnance est bien éclairée</Text>
                    <Text style={styles.tipItem}>• Évitez les reflets et les ombres</Text>
                    <Text style={styles.tipItem}>• Cadrez l'ordonnance entièrement</Text>
                    <Text style={styles.tipItem}>• Gardez votre appareil stable</Text>
                  </View>
                </View>
              </View>
          ) : medications.length === 0 ? (
              <View style={styles.preview}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionButton} onPress={analyzeImage}>
                    <LinearGradient
                        colors={[Colors.primary.blue, Colors.primary.turquoise]}
                        style={styles.actionGradient}
                    >
                      <Ionicons name="scan" size={24} color="#FFF" />
                      <Text style={styles.actionText}>Analyser l'ordonnance</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => setImageUri(null)}>
                    <Ionicons name="refresh" size={24} color={Colors.primary.blue} />
                    <Text style={styles.actionTextSecondary}>Reprendre une photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
          ) : (
              <View style={styles.results}>
                <View style={styles.resultsHeader}>
                  <Ionicons name="checkmark-circle" size={28} color={Colors.status.success} />
                  <Text style={styles.resultsTitle}>
                    {medications.length} médicament{medications.length > 1 ? 's' : ''} détecté{medications.length > 1 ? 's' : ''}
                  </Text>
                </View>

                <Text style={styles.resultsSubtitle}>
                  Sélectionnez les médicaments à ajouter
                </Text>

                <View style={styles.medicationsList}>
                  {medications.map((med, index) => (
                      <TouchableOpacity
                          key={index}
                          style={[
                            styles.medicationCard,
                            selectedMeds.has(index) && styles.medicationCardSelected
                          ]}
                          onPress={() => toggleSelection(index)}
                          activeOpacity={0.7}
                      >
                        <View style={styles.medicationCheckbox}>
                          {selectedMeds.has(index) ? (
                              <Ionicons name="checkmark-circle" size={24} color={Colors.primary.blue} />
                          ) : (
                              <Ionicons name="ellipse-outline" size={24} color={Colors.border.default} />
                          )}
                        </View>

                        <View style={styles.medicationInfo}>
                          <Text style={styles.medicationName}>{med.name}</Text>
                          {med.dosage && (
                              <Text style={styles.medicationDosage}>💊 {med.dosage}</Text>
                          )}
                          {med.frequency && (
                              <Text style={styles.medicationFrequency}>🕐 {med.frequency}</Text>
                          )}
                        </View>

                        <View style={styles.confidenceBadge}>
                          <Text style={styles.confidenceText}>
                            {Math.round(med.confidence * 100)}%
                          </Text>
                        </View>
                      </TouchableOpacity>
                  ))}
                </View>

                {/* ✅ CORRECTIF: Bouton avec debug et activeOpacity */}
                <View style={styles.actions}>
                  <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        console.log('Button pressed!');
                        handleAddSelected();
                      }}
                      disabled={selectedMeds.size === 0}
                      activeOpacity={0.7}
                  >
                    <LinearGradient
                        colors={selectedMeds.size === 0
                            ? [Colors.border.light, Colors.border.default]
                            : [Colors.primary.blue, Colors.primary.turquoise]
                        }
                        style={styles.actionGradient}
                    >
                      <Ionicons name="add-circle" size={24} color="#FFF" />
                      <Text style={styles.actionText}>
                        Ajouter {selectedMeds.size > 0 ? `(${selectedMeds.size})` : ''}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => {
                    setImageUri(null);
                    setMedications([]);
                    setSelectedMeds(new Set());
                  }}>
                    <Ionicons name="refresh" size={24} color={Colors.primary.blue} />
                    <Text style={styles.actionTextSecondary}>Nouvelle analyse</Text>
                  </TouchableOpacity>
                </View>
              </View>
          )}
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  preview: { alignItems: 'center' },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  actionButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  actionText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: '#FFF',
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.light,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionTextSecondary: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.primary.blue,
  },
  tips: {
    width: '100%',
    padding: Spacing.lg,
    backgroundColor: Colors.background.light,
    borderRadius: BorderRadius.lg,
  },
  tipsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  tipsList: { gap: Spacing.xs },
  tipItem: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  results: { paddingBottom: Spacing.xxl },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  resultsTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  resultsSubtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
  },
  medicationsList: { gap: Spacing.md, marginBottom: Spacing.xl },
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.light,
    gap: Spacing.md,
  },
  medicationCardSelected: {
    borderColor: Colors.primary.blue,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  medicationCheckbox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationInfo: { flex: 1 },
  medicationName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs / 2,
  },
  medicationDosage: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs / 2,
  },
  medicationFrequency: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: Colors.background.light,
    borderRadius: BorderRadius.md,
  },
  confidenceText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
});