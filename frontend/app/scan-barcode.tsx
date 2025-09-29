// frontend/app/scan-barcode.tsx - ✅ SCAN FONCTIONNEL + IMAGE

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, CommonStyles } from '@/constants/theme';
import AppHeader from '@/components/shared/AppHeader';
import { LoadingScreen } from '@/components/shared';

// ✅ CORRECTIF: Importer le service barcode avec le bon chemin
import { findMedicationByBarcode, isValidCIP13 } from '@/services/barcode-service';

export default function ScanBarcodeScreen() {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission && Platform.OS !== 'web') {
      requestPermission();
    }
  }, [permission]);

  // ✅ CORRECTIF: Gérer les codes-barres scannés
  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    if (!data) {
      Alert.alert('Erreur', 'Code-barres non détecté');
      setScanned(false);
      return;
    }

    // Vérifier le format CIP13
    if (!isValidCIP13(data)) {
      Alert.alert(
          'Format invalide',
          `Le code scanné (${data}) n'est pas un code CIP13 valide (13 chiffres requis).`,
          [{ text: 'Réessayer', onPress: () => setScanned(false) }]
      );
      return;
    }

    setLoading(true);

    try {
      // ✅ CORRECTIF: Chercher le médicament dans le catalogue
      const found = await findMedicationByBarcode(data);

      if (found) {
        // Médicament trouvé, rediriger vers le formulaire
        router.push({
          pathname: '/add-medication',
          params: {
            fromScan: 'true',
            name: found.name,
            dosage: found.dosage || '',
          }
        });
      } else {
        Alert.alert(
            'Médicament introuvable',
            `Aucun médicament trouvé pour le code ${data}.\n\nVous pouvez l'ajouter manuellement.`,
            [
              { text: 'Annuler', style: 'cancel', onPress: () => setScanned(false) },
              {
                text: 'Ajouter manuellement',
                onPress: () => router.push('/add-medication')
              }
            ]
        );
      }
    } catch (error) {
      console.error('Error finding medication:', error);
      Alert.alert(
          'Erreur',
          'Impossible de rechercher le médicament.',
          [{ text: 'Réessayer', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECTIF: Permettre de scanner depuis une image
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        Alert.alert(
            'Scan d\'image',
            'Le décodage de code-barres depuis une image n\'est pas encore supporté dans cette version.\n\nUtilisez la caméra en direct pour scanner votre code-barres.',
            [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  if (loading) return <LoadingScreen text="Recherche du médicament..." />;

  // ✅ Web fallback
  if (Platform.OS === 'web') {
    return (
        <SafeAreaView style={CommonStyles.container} edges={['top']}>
          <AppHeader
              title="Scanner un code-barres"
              showLogo={false}
              leftAction={{ icon: 'chevron-back', onPress: () => router.back() }}
          />
          <View style={styles.center}>
            <Ionicons name="information-circle-outline" size={48} color={Colors.text.secondary} />
            <Text style={styles.info}>
              Le scan en direct n'est pas disponible sur le web.{'\n\n'}
              Utilisez l'application mobile pour scanner vos codes-barres.
            </Text>
            <TouchableOpacity style={styles.pickBtn} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={20} color="#fff" />
              <Text style={styles.pickText}>Choisir une image</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  // ✅ Demande de permission
  if (!permission) {
    return (
        <SafeAreaView style={CommonStyles.container} edges={['top']}>
          <AppHeader
              title="Scanner un code-barres"
              showLogo={false}
              leftAction={{ icon: 'chevron-back', onPress: () => router.back() }}
          />
          <LoadingScreen text="Demande d'autorisation..." />
        </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
        <SafeAreaView style={CommonStyles.container} edges={['top']}>
          <AppHeader
              title="Scanner un code-barres"
              showLogo={false}
              leftAction={{ icon: 'chevron-back', onPress: () => router.back() }}
          />
          <View style={styles.center}>
            <Ionicons name="camera-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.permissionTitle}>Autorisation requise</Text>
            <Text style={styles.permissionText}>
              EasyPills a besoin d'accéder à votre caméra pour scanner les codes-barres des médicaments.
            </Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Autoriser l'accès</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  // ✅ Scanner actif
  return (
      <SafeAreaView style={CommonStyles.container} edges={['top']}>
        <AppHeader
            title="Scanner un code-barres"
            showLogo={false}
            leftAction={{ icon: 'chevron-back', onPress: () => router.back() }}
        />

        <View style={styles.cameraContainer}>
          <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'code128', 'code39'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />

          {/* Overlay de cadrage */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />

                <Text style={styles.scanText}>
                  Alignez le code-barres{'\n'}dans le cadre
                </Text>
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom}>
              <View style={styles.instructions}>
                <Ionicons name="information-circle" size={20} color="#FFF" />
                <Text style={styles.instructionsText}>
                  Cherchez le code CIP13 sur la boîte du médicament
                </Text>
              </View>

              {scanned && (
                  <TouchableOpacity
                      style={styles.retryBtn}
                      onPress={() => setScanned(false)}
                  >
                    <Ionicons name="refresh" size={20} color="#FFF" />
                    <Text style={styles.retryText}>Réessayer</Text>
                  </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage}>
                <Ionicons name="images-outline" size={20} color="#FFF" />
                <Text style={styles.galleryText}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  info: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  pickBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary.blue,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pickText: { color: '#fff', fontWeight: FontWeight.semibold },
  permissionTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  permissionText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  permissionBtn: {
    backgroundColor: Colors.primary.blue,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 2, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  overlayMiddle: { flexDirection: 'row' },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  scanArea: {
    width: 280,
    height: 180,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFF',
    borderWidth: 3,
  },
  cornerTopLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  cornerTopRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  cornerBottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  cornerBottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  scanText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  overlayBottom: {
    flex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  instructionsText: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary.blue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  retryText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  galleryText: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});