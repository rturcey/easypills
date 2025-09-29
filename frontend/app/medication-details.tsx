// frontend/app/medication-details.tsx - ✅ CORRECTIF: Validation ID + Navigation
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMedicationById, deleteMedication, type Medication } from '@/services/storage';
import { cancelMedicationNotifications } from '@/utils/notifications';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import AppHeader from '@/components/shared/AppHeader';
import { LoadingScreen, ProgressBar } from '@/components/shared';
import { getIconById } from '@/constants/medicationIcons';

const DAYS_LABELS: Record<number, string> = {
    1: 'Lun',
    2: 'Mar',
    3: 'Mer',
    4: 'Jeu',
    5: 'Ven',
    6: 'Sam',
    7: 'Dim',
};

export default function MedicationDetailsScreen() {
    const params = useLocalSearchParams();
    const medicationId = params.id as string;
    const insets = useSafeAreaInsets();

    const [medication, setMedication] = useState<Medication | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const loadMedication = useCallback(async () => {
        console.log('Loading medication with ID:', medicationId);

        // ✅ CORRECTIF 1: Validation améliorée des IDs
        if (!medicationId || ['undefined', 'null', null, undefined].includes(medicationId as any)) {
            console.error('Invalid medication ID:', medicationId);
            Alert.alert('Erreur', 'ID du médicament invalide', [
                { text: 'OK', onPress: () => router.replace('/manage-medications') }
            ]);
            return;
        }

        try {
            setLoading(true);
            const med = await getMedicationById(medicationId);

            console.log('Medication loaded:', med);

            if (!med) {
                console.error('Medication not found');
                Alert.alert('Erreur', 'Médicament introuvable', [
                    { text: 'OK', onPress: () => router.replace('/manage-medications') }
                ]);
                return;
            }

            setMedication(med);
        } catch (error) {
            console.error('Error loading medication:', error);
            Alert.alert('Erreur', 'Impossible de charger le médicament', [
                { text: 'OK', onPress: () => router.replace('/manage-medications') }
            ]);
        } finally {
            setLoading(false);
        }
    }, [medicationId]);

    // Charger au montage et au focus
    useFocusEffect(
        useCallback(() => {
            loadMedication();
        }, [loadMedication])
    );

    const handleDelete = async () => {
        if (!medication) return;

        try {
            setDeleting(true);
            console.log('Deleting medication:', medication.id);

            // Annuler les notifications avant suppression
            await cancelMedicationNotifications(medication.id);

            // Supprimer le médicament
            await deleteMedication(medication.id);

            console.log('Medication deleted successfully');

            // Fermer la modal
            setShowDeleteModal(false);

            // ✅ CORRECTIF 2: Navigation améliorée
            // On utilise replace pour éviter de pouvoir revenir sur un médicament supprimé
            router.replace('/manage-medications');
        } catch (error) {
            console.error('Error deleting medication:', error);
            Alert.alert('Erreur', 'Impossible de supprimer le médicament');
            setDeleting(false);
        }
    };

    const handleEdit = () => {
        if (!medication) return;
        router.push(`/edit-medication?id=${medication.id}`);
    };

    if (loading) {
        return <LoadingScreen text="Chargement du médicament..." />;
    }

    if (!medication) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <AppHeader
                    title="Détails"
                    showLogo={false}
                    leftAction={{
                        icon: 'chevron-back',
                        onPress: () => router.replace('/manage-medications'),
                    }}
                />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={64} color={Colors.status.error} />
                    <Text style={styles.errorText}>Médicament introuvable</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.replace('/manage-medications')}
                    >
                        <Text style={styles.backButtonText}>Retour à la liste</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const iconData = getIconById(medication.icon || 'pill');
    const iconColor = medication.color || Colors.primary.blue;
    const isActive = !medication.paused;

    // Formater les jours
    const daysDisplay = medication.days === 'daily'
        ? 'Tous les jours'
        : medication.monthlyDays && medication.monthlyDays.length > 0
            ? `Jours du mois : ${medication.monthlyDays.join(', ')}`
            : Array.isArray(medication.days)
                ? medication.days.map(d => DAYS_LABELS[d]).join(', ')
                : 'Non défini';

    // Formater les horaires
    const timesDisplay = medication.times.join(', ');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader
                title="Détails du médicament"
                showLogo={false}
                leftAction={{
                    icon: 'chevron-back',
                    onPress: () => router.back(),
                }}
                rightActions={[
                    {
                        icon: 'create-outline',
                        onPress: handleEdit,
                    },
                ]}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
                showsVerticalScrollIndicator={false}
            >
                {/* En-tête avec icône */}
                <View style={styles.header}>
                    <View style={[styles.iconCircle, { backgroundColor: `${iconColor}20` }]}>
                        <Ionicons name={iconData?.icon as any || 'medical'} size={48} color={iconColor} />
                    </View>

                    <Text style={styles.medicationName}>{medication.name}</Text>

                    {medication.dosage && (
                        <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                    )}

                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: isActive ? Colors.status.success : Colors.status.warning }
                    ]}>
                        <Ionicons
                            name={isActive ? 'checkmark-circle' : 'pause-circle'}
                            size={16}
                            color="#FFF"
                        />
                        <Text style={styles.statusText}>
                            {isActive ? 'Actif' : 'En pause'}
                        </Text>
                    </View>
                </View>

                {/* Informations principales */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations</Text>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoLabel}>
                                <Ionicons name="time" size={20} color={Colors.primary.blue} />
                                <Text style={styles.infoLabelText}>Horaires</Text>
                            </View>
                            <Text style={styles.infoValue}>{timesDisplay}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.infoLabel}>
                                <Ionicons name="calendar" size={20} color={Colors.primary.turquoise} />
                                <Text style={styles.infoLabelText}>Jours</Text>
                            </View>
                            <Text style={styles.infoValue}>{daysDisplay}</Text>
                        </View>

                        {medication.startISO && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <View style={styles.infoLabel}>
                                        <Ionicons name="play" size={20} color={Colors.status.success} />
                                        <Text style={styles.infoLabelText}>Début</Text>
                                    </View>
                                    <Text style={styles.infoValue}>
                                        {new Date(medication.startISO).toLocaleDateString('fr-FR')}
                                    </Text>
                                </View>
                            </>
                        )}

                        {medication.endISO && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <View style={styles.infoLabel}>
                                        <Ionicons name="stop" size={20} color={Colors.status.error} />
                                        <Text style={styles.infoLabelText}>Fin</Text>
                                    </View>
                                    <Text style={styles.infoValue}>
                                        {new Date(medication.endISO).toLocaleDateString('fr-FR')}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={handleEdit}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="create" size={20} color={Colors.primary.blue} />
                        <Text style={styles.editButtonText}>Modifier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => setShowDeleteModal(true)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="trash" size={20} color={Colors.status.error} />
                        <Text style={styles.deleteButtonText}>Supprimer</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal de confirmation de suppression */}
            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => !deleting && setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <Ionicons name="warning" size={48} color={Colors.status.error} />
                        </View>

                        <Text style={styles.modalTitle}>Supprimer ce médicament ?</Text>
                        <Text style={styles.modalText}>
                            Cette action est irréversible. Toutes les données liées à ce médicament seront supprimées.
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalCancelText}>Annuler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalDeleteButton}
                                onPress={handleDelete}
                                disabled={deleting}
                                activeOpacity={0.8}
                            >
                                {deleting ? (
                                    <Text style={styles.modalDeleteText}>Suppression...</Text>
                                ) : (
                                    <Text style={styles.modalDeleteText}>Supprimer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: Colors.background.primary,
        paddingVertical: Spacing.xxxl,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    medicationName: {
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    medicationDosage: {
        fontSize: FontSize.lg,
        color: Colors.text.secondary,
        marginBottom: Spacing.md,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    statusText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.text.white,
    },
    section: {
        padding: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    infoCard: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    infoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    infoLabelText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        color: Colors.text.secondary,
    },
    infoValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.text.primary,
        textAlign: 'right',
        flex: 1,
        marginLeft: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border.light,
        marginVertical: Spacing.sm,
    },
    actionsSection: {
        padding: Spacing.xl,
        paddingTop: 0,
        gap: Spacing.md,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.background.primary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: Colors.primary.blue,
    },
    editButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.primary.blue,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: '#FEE',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: Colors.status.error,
    },
    deleteButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.status.error,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xxl,
    },
    errorText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.text.primary,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    backButton: {
        backgroundColor: Colors.primary.blue,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.lg,
    },
    backButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.text.white,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        backgroundColor: Colors.background.primary,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        width: '100%',
        maxWidth: 400,
    },
    modalIcon: {
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    modalText: {
        fontSize: FontSize.md,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xxl,
    },
    modalActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: Colors.background.tertiary,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.text.primary,
    },
    modalDeleteButton: {
        flex: 1,
        backgroundColor: Colors.status.error,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    modalDeleteText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.text.white,
    },
});