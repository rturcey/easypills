// frontend/app/index.tsx - Onboarding optimisé
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import AppLogo from '@/components/shared/AppLogo';

export default function OnboardingScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <View style={styles.logoWrapper}>
                        <AppLogo size="large" />
                    </View>

                    <Text style={styles.appName}>EasyPills</Text>
                    <Text style={styles.tagline}>N'oubliez plus vos médicaments</Text>
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                    <View style={styles.feature}>
                        <View style={[styles.featureIcon, { backgroundColor: `${Colors.primary.blue}20` }]}>
                            <Ionicons name="time" size={24} color={Colors.primary.blue} />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Rappels intelligents</Text>
                            <Text style={styles.featureDescription}>Notifications au bon moment</Text>
                        </View>
                    </View>

                    <View style={styles.feature}>
                        <View style={[styles.featureIcon, { backgroundColor: `${Colors.primary.turquoise}20` }]}>
                            <Ionicons name="shield-checkmark" size={24} color={Colors.primary.turquoise} />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>100% privé</Text>
                            <Text style={styles.featureDescription}>Vos données restent sur votre appareil</Text>
                        </View>
                    </View>

                    <View style={styles.feature}>
                        <View style={[styles.featureIcon, { backgroundColor: `${Colors.primary.orange}20` }]}>
                            <Ionicons name="trending-up" size={24} color={Colors.primary.orange} />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Suivi simplifié</Text>
                            <Text style={styles.featureDescription}>Visualisez votre observance</Text>
                        </View>
                    </View>
                </View>

                {/* CTA Buttons */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push('/today')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={Colors.gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.primaryButtonText}>Commencer</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Disclaimer */}
                <View style={styles.disclaimerContainer}>
                    <Text style={styles.disclaimerText}>
                        EasyPills est un aide-mémoire personnel. Il ne remplace pas l'avis d'un professionnel de santé.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: Spacing.xxxl,
    },
    logoSection: {
        alignItems: 'center',
        paddingTop: Spacing.xxxl,
    },
    logoWrapper: {
        marginBottom: Spacing.xl,
    },
    appName: {
        fontSize: 40,
        fontWeight: FontWeight.bold,
        color: Colors.primary.blue,
        marginBottom: Spacing.sm,
    },
    tagline: {
        fontSize: FontSize.lg,
        color: Colors.text.secondary,
        textAlign: 'center',
        maxWidth: 300,
    },
    featuresSection: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.lg,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        backgroundColor: Colors.background.primary,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadow.small,
    },
    featureIcon: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: FontSize.md,
        color: Colors.text.secondary,
    },
    buttonsContainer: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    primaryButton: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadow.large,
    },
    buttonGradient: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: Colors.text.white,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    disclaimerContainer: {
        paddingHorizontal: Spacing.xxxl,
        paddingBottom: Platform.OS === 'ios' ? Spacing.sm : Spacing.xl,
    },
    disclaimerText: {
        fontSize: FontSize.xs,
        color: Colors.text.light,
        textAlign: 'center',
        lineHeight: 18,
    },
});