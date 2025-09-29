// frontend/app/test.tsx - Route de test OCR COMPLÈTE
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { setOCRConfig, getOCRConfig } from '@/services/ocr-config';
import { extractMedicationsFromImage } from '@/services/ocr-service';
import type { ExtractedMedication } from '@/services/ocr-service';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, CommonStyles } from '@/constants/theme';
import { Header } from '@/components/shared';

export default function TestOCRScreen() {
    const [loading, setLoading] = useState(false);
    const [mockMode, setMockMode] = useState(true);
    const [results, setResults] = useState<ExtractedMedication[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

    const handleToggleMockMode = () => {
        const newMode = !mockMode;
        setMockMode(newMode);
        setOCRConfig({ mockMode: newMode });

        Alert.alert(
            newMode ? '🔧 Mode Mock activé' : '🔬 Mode Réel activé',
            newMode
                ? 'Les tests utiliseront des données simulées'
                : 'Les tests utiliseront Tesseract.js pour la vraie reconnaissance OCR'
        );
    };

    const handlePickImage = async () => {
        try {
            // Demander les permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission requise',
                    'L\'accès à la galerie photo est nécessaire pour sélectionner une image.'
                );
                return;
            }

            // Ouvrir le sélecteur d'images
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setSelectedImageUri(result.assets[0].uri);
                setResults(null);
                setError(null);

                Alert.alert(
                    '✅ Image sélectionnée',
                    'Appuyez sur "Lancer le test" pour extraire les médicaments'
                );
            }
        } catch (err) {
            console.error('Erreur sélection image:', err);
            Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
        }
    };

    const handleRunTest = async () => {
        // Vérifier qu'une image est sélectionnée en mode réel
        if (!mockMode && !selectedImageUri) {
            Alert.alert(
                '⚠️ Image requise',
                'En mode réel, vous devez d\'abord sélectionner une image d\'ordonnance',
                [
                    { text: 'Annuler' },
                    { text: 'Sélectionner', onPress: handlePickImage }
                ]
            );
            return;
        }

        setLoading(true);
        setResults(null);
        setError(null);

        try {
            console.log('🧪 Lancement du test OCR...');
            console.log('Mode:', mockMode ? 'MOCK' : 'REAL');
            console.log('Image URI:', selectedImageUri || 'mock-uri');

            // Configurer le mode
            setOCRConfig({ mockMode });

            // Lancer l'extraction (utilise l'URI mock ou réelle)
            const medications = await extractMedicationsFromImage(
                selectedImageUri || 'mock-uri'
            );

            console.log('✅ Médicaments détectés:', medications);
            setResults(medications);

            if (medications.length === 0) {
                Alert.alert(
                    '⚠️ Aucun médicament détecté',
                    mockMode
                        ? 'Le mode mock devrait retourner des données. Vérifiez la console.'
                        : 'Aucun médicament n\'a été détecté dans l\'image. Assurez-vous que le texte est lisible.'
                );
            } else {
                Alert.alert(
                    '✅ Test réussi !',
                    `${medications.length} médicament(s) détecté(s)`
                );
            }
        } catch (err) {
            console.error('❌ Erreur test OCR:', err);
            const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMsg);

            Alert.alert(
                '❌ Erreur',
                `Le test a échoué:\n\n${errorMsg}`,
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClearResults = () => {
        setResults(null);
        setError(null);
        setSelectedImageUri(null);
    };

    const currentConfig = getOCRConfig();

    return (
        <LinearGradient
            colors={[Colors.background.primary, Colors.background.secondary]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <Header
                    title="🧪 Test OCR"
                    onBack={() => router.back()}
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Section Configuration */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⚙️ Configuration</Text>

                        <TouchableOpacity
                            style={styles.configCard}
                            onPress={handleToggleMockMode}
                            activeOpacity={0.7}
                        >
                            <View style={styles.configContent}>
                                <View style={[
                                    styles.configIcon,
                                    { backgroundColor: mockMode ? Colors.primary.orange + '20' : Colors.primary.blue + '20' }
                                ]}>
                                    <Ionicons
                                        name={mockMode ? "construct" : "flask"}
                                        size={24}
                                        color={mockMode ? Colors.primary.orange : Colors.primary.blue}
                                    />
                                </View>
                                <View style={styles.configText}>
                                    <Text style={styles.configTitle}>
                                        {mockMode ? 'Mode Mock' : 'Mode Réel (Tesseract.js)'}
                                    </Text>
                                    <Text style={styles.configDescription}>
                                        {mockMode
                                            ? 'Utilise des données simulées pour les tests rapides'
                                            : 'Utilise Tesseract.js pour la vraie reconnaissance OCR'}
                                    </Text>
                                </View>
                                <Ionicons
                                    name={mockMode ? "toggle" : "toggle-outline"}
                                    size={32}
                                    color={mockMode ? Colors.primary.green : Colors.text.tertiary}
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Image sélectionnée */}
                        {selectedImageUri && (
                            <View style={styles.imagePreview}>
                                <Ionicons name="image" size={24} color={Colors.primary.blue} />
                                <Text style={styles.imagePreviewText} numberOfLines={1}>
                                    Image sélectionnée
                                </Text>
                                <TouchableOpacity onPress={() => setSelectedImageUri(null)}>
                                    <Ionicons name="close-circle" size={24} color={Colors.status.error} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Section Actions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🎬 Actions</Text>

                        {/* Sélectionner une image (seulement en mode réel) */}
                        {!mockMode && (
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handlePickImage}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="images" size={24} color={Colors.primary.blue} />
                                <Text style={styles.secondaryButtonText}>
                                    {selectedImageUri ? 'Changer l\'image' : 'Sélectionner une image'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Lancer le test */}
                        <TouchableOpacity
                            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                            onPress={handleRunTest}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={[Colors.primary.blue, Colors.primary.turquoise]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.actionButtonGradient}
                            >
                                {loading ? (
                                    <>
                                        <Ionicons name="hourglass" size={24} color="white" />
                                        <Text style={styles.actionButtonText}>
                                            {mockMode ? 'Test en cours...' : 'OCR en cours...'}
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="play-circle" size={24} color="white" />
                                        <Text style={styles.actionButtonText}>Lancer le test</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Effacer */}
                        {(results || error || selectedImageUri) && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClearResults}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash-outline" size={20} color={Colors.status.error} />
                                <Text style={styles.clearButtonText}>Tout effacer</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Section Erreur */}
                    {error && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>❌ Erreur</Text>
                            <View style={styles.errorCard}>
                                <Ionicons name="alert-circle" size={32} color={Colors.status.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        </View>
                    )}

                    {/* Section Résultats */}
                    {results && results.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                ✅ Résultats ({results.length})
                            </Text>

                            {results.map((med, index) => (
                                <View key={index} style={styles.resultCard}>
                                    <View style={styles.resultHeader}>
                                        <View style={styles.resultBadge}>
                                            <Text style={styles.resultBadgeText}>#{index + 1}</Text>
                                        </View>
                                        <View style={styles.resultSourceBadge}>
                                            <Ionicons
                                                name={med.source === 'barcode' ? 'barcode' : 'document-text'}
                                                size={14}
                                                color={Colors.text.white}
                                            />
                                            <Text style={styles.resultSourceText}>
                                                {med.source === 'barcode' ? 'Code-barres' : 'OCR'}
                                            </Text>
                                        </View>
                                        <Text style={styles.resultConfidence}>
                                            {Math.round(med.confidence * 100)}%
                                        </Text>
                                    </View>

                                    <Text style={styles.resultName}>{med.name}</Text>

                                    {med.matchedLabel && med.matchedLabel !== med.name && (
                                        <View style={styles.resultDetail}>
                                            <Ionicons name="checkmark-circle" size={16} color={Colors.primary.green} />
                                            <Text style={styles.resultDetailText}>Match: {med.matchedLabel}</Text>
                                        </View>
                                    )}

                                    {med.dosage && (
                                        <View style={styles.resultDetail}>
                                            <Ionicons name="medical" size={16} color={Colors.primary.blue} />
                                            <Text style={styles.resultDetailText}>{med.dosage}</Text>
                                        </View>
                                    )}

                                    {med.frequency && (
                                        <View style={styles.resultDetail}>
                                            <Ionicons name="time" size={16} color={Colors.primary.orange} />
                                            <Text style={styles.resultDetailText}>{med.frequency}</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Section Info */}
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle" size={24} color={Colors.primary.blue} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoText}>
                                <Text style={styles.infoTextBold}>Mode Mock:</Text> Données simulées pour tests rapides{'\n\n'}
                                <Text style={styles.infoTextBold}>Mode Réel:</Text> Utilise Tesseract.js pour reconnaissance OCR sur vos images d'ordonnances
                            </Text>
                        </View>
                    </View>

                    {/* Debug Info */}
                    {__DEV__ && (
                        <View style={styles.debugCard}>
                            <Text style={styles.debugTitle}>🐛 Debug Info</Text>
                            <Text style={styles.debugText}>
                                Platform: {Platform.OS}{'\n'}
                                Mock Mode: {currentConfig.mockMode ? 'YES' : 'NO'}{'\n'}
                                Image: {selectedImageUri ? 'Selected' : 'None'}{'\n'}
                                Loading: {loading ? 'YES' : 'NO'}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl * 2,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },

    // Configuration Card
    configCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...CommonStyles.shadow,
    },
    configContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    configIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    configText: {
        flex: 1,
    },
    configTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    configDescription: {
        fontSize: FontSize.sm,
        color: Colors.text.secondary,
        lineHeight: 18,
    },

    // Image Preview
    imagePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary.blue + '10',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginTop: Spacing.md,
    },
    imagePreviewText: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.primary.blue,
        fontWeight: FontWeight.medium,
    },

    // Action Buttons
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.md,
        borderWidth: 2,
        borderColor: Colors.primary.blue,
        ...CommonStyles.shadow,
    },
    secondaryButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.primary.blue,
    },
    actionButton: {
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        ...CommonStyles.shadow,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xl,
    },
    actionButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.text.white,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.md,
    },
    clearButtonText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.status.error,
    },

    // Error Card
    errorCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        gap: Spacing.md,
        borderWidth: 2,
        borderColor: Colors.status.error + '30',
    },
    errorText: {
        fontSize: FontSize.md,
        color: Colors.status.error,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Result Cards
    resultCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...CommonStyles.shadow,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    resultBadge: {
        backgroundColor: Colors.primary.blue + '20',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    resultBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.primary.blue,
    },
    resultSourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary.turquoise,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        flex: 1,
        marginLeft: Spacing.sm,
    },
    resultSourceText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: Colors.text.white,
    },
    resultConfidence: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.primary.green,
    },
    resultName: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    resultDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    resultDetailText: {
        fontSize: FontSize.sm,
        color: Colors.text.secondary,
    },

    // Info Card
    infoCard: {
        flexDirection: 'row',
        gap: Spacing.md,
        backgroundColor: Colors.primary.blue + '10',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginTop: Spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoText: {
        fontSize: FontSize.sm,
        color: Colors.text.secondary,
        lineHeight: 20,
    },
    infoTextBold: {
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
    },

    // Debug Card
    debugCard: {
        backgroundColor: '#000',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginTop: Spacing.lg,
    },
    debugTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: '#0F0',
        marginBottom: Spacing.xs,
    },
    debugText: {
        fontSize: FontSize.xs,
        color: '#0F0',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
});