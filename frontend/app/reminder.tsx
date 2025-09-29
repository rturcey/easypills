// frontend/app/reminder.tsx - Design épuré et fidèle
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { markAsTaken, getSettings } from '@/services/storage';
import { snoozeNotification } from '@/utils/notifications';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { AppLogo } from '@/components/shared';
import { Ionicons } from '@expo/vector-icons';

export default function ReminderScreen() {
    const params = useLocalSearchParams();

    const medicationName = (params.medicationName as string) || "Médicament";
    const dosage = (params.dosage as string) || "";
    const time = (params.time as string) || "00:00";
    const takeId = (params.takeId as string) || "";
    const medicationId = (params.medicationId as string) || "";
    const discreteMode = params.discreteMode === 'true';

    const [isDismissed, setIsDismissed] = useState(false);
    const [snoozeDuration, setSnoozeDuration] = useState(10);
    const [isPremium, setIsPremium] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await getSettings();
        setSnoozeDuration(settings.snoozeDuration || 10);
        setIsPremium(settings.isPremium || false);
    };

    const handleTaken = async () => {
        try {
            if (takeId) {
                await markAsTaken(takeId, true);
            }

            setIsDismissed(true);

            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();

            setTimeout(() => {
                router.replace('/today');
            }, 2000);
        } catch (error) {
            console.error('Error marking medication:', error);
            router.replace('/today');
        }
    };

    const handleSnooze = async () => {
        if (!isPremium) {
            router.replace('/premium');
            return;
        }

        try {
            await snoozeNotification({
                medicationId,
                medicationName,
                dosage,
                time,
                takeId,
            });
            router.replace('/today');
        } catch (error) {
            console.error('Error snoozing notification:', error);
            router.replace('/today');
        }
    };

    const handleSkip = () => {
        router.replace('/today');
    };

    if (isDismissed) {
        return (
            <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.successContainer}
            >
                <Animated.View
                    style={[
                        styles.successContent,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    <View style={styles.successIcon}>
                        <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <Text style={styles.successTitle}>Parfait !</Text>
                    <Text style={styles.successText}>Prise enregistrée</Text>
                </Animated.View>
            </LinearGradient>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.logoContainer}>
                    <AppLogo size="md" />
                </View>
                <Text style={styles.time}>{time}</Text>
                <Text style={styles.subtitle}>C'est l'heure de votre médicament</Text>
            </LinearGradient>

            {/* Contenu */}
            <View style={styles.content}>
                <View style={styles.medInfo}>
                    <Text style={styles.medName}>
                        {discreteMode ? 'Votre médicament' : medicationName}
                    </Text>
                    {!discreteMode && dosage && (
                        <Text style={styles.medDosage}>{dosage}</Text>
                    )}
                    {discreteMode && (
                        <Text style={styles.discreteNote}>
                            🔒 Mode discret activé
                        </Text>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={handleTaken}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={Colors.gradients.primary}
                            style={styles.btnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.btnPrimaryText}>Médicament pris</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSnooze}
                        onPress={handleSnooze}
                        activeOpacity={0.8}
                    >
                        {isPremium ? (
                            <Text style={styles.btnSnoozeText}>
                                Reporter de{' '}
                                <View style={styles.durationBadge}>
                                    <Text style={styles.durationText}>{snoozeDuration}</Text>
                                </View>
                                {' '}min
                            </Text>
                        ) : (
                            <View style={styles.premiumBtnContent}>
                                <Ionicons name="lock-closed" size={20} color={Colors.primary.orange} />
                                <Text style={styles.btnSnoozeText}>
                                    Reporter (Premium)
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={handleSkip}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.btnSecondaryText}>Ignorer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        paddingTop: Spacing.xxl,
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: Spacing.lg,
    },
    time: {
        fontSize: 48,
        fontWeight: '300',
        color: '#FFF',
        marginBottom: Spacing.xs,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: FontWeight.medium,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxl,
        paddingBottom: Spacing.xl,
        justifyContent: 'space-between',
    },
    medInfo: {
        alignItems: 'center',
    },
    medName: {
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    medDosage: {
        fontSize: FontSize.lg,
        color: Colors.text.secondary,
        fontWeight: FontWeight.medium,
    },
    discreteNote: {
        fontSize: FontSize.sm,
        color: Colors.text.light,
        fontWeight: FontWeight.medium,
        marginTop: Spacing.xs,
    },
    actions: {
        gap: Spacing.md,
    },
    btnPrimary: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        shadowColor: Colors.primary.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnGradient: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
    },
    btnPrimaryText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: '#FFF',
    },
    btnSnooze: {
        backgroundColor: '#FEF3E2',
        borderWidth: 2,
        borderColor: Colors.primary.orange,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    btnSnoozeText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.primary.orange,
        flexDirection: 'row',
        alignItems: 'center',
    },
    durationBadge: {
        backgroundColor: Colors.primary.orange,
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    durationText: {
        fontSize: 15,
        fontWeight: FontWeight.bold,
        color: '#FFF',
    },
    premiumBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    btnSecondary: {
        backgroundColor: Colors.background.light,
        borderWidth: 2,
        borderColor: Colors.border.light,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
        alignItems: 'center',
    },
    btnSecondaryText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.text.secondary,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successContent: {
        alignItems: 'center',
    },
    successIcon: {
        width: 96,
        height: 96,
        backgroundColor: '#FFF',
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    checkmark: {
        fontSize: 56,
        color: Colors.primary.blue,
        fontWeight: 'bold',
    },
    successTitle: {
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: '#FFF',
        marginBottom: Spacing.xs,
    },
    successText: {
        fontSize: FontSize.lg,
        color: 'rgba(255, 255, 255, 0.9)',
    },
});