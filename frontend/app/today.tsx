// frontend/app/today.tsx - ✅ HEADER SIMPLE

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, CommonStyles } from '@/constants/theme';
import TabBar from '@/components/navigation/TabBar';
import AppHeader from '@/components/shared/AppHeader';
import { LoadingScreen, StatsCard, EmptyState } from '@/components/shared';
import MedicationTakeCard from '@/components/medication/MedicationTakeCard';
import { getMedications, getTodaySchedule, markTaken, type MedicationTake } from '@/services/storage';

export default function TodayScreen() {
    const insets = useSafeAreaInsets();
    const [takes, setTakes] = useState<MedicationTake[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadTodaySchedule = useCallback(async () => {
        try {
            const schedule = await getTodaySchedule();
            setTakes(schedule);
        } catch (error) {
            console.error('Error loading schedule:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadTodaySchedule();
        }, [loadTodaySchedule])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadTodaySchedule();
        setRefreshing(false);
    }, [loadTodaySchedule]);

    const handleToggleTake = useCallback(async (id: string, next: boolean) => {
        await markTaken(id, next);
        setTakes(prev => prev.map(t => t.id === id ? { ...t, taken: next } : t));
    }, []);

    if (loading) return <LoadingScreen />;

    const takenCount = takes.filter(t => t.taken).length;
    const totalCount = takes.length;
    const adherence = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

    return (
        <SafeAreaView style={CommonStyles.container} edges={['top']}>
            {/* ✅ CORRECTIF: Pas de bouton retour sur Today */}
            <AppHeader
                title="Aujourd'hui"
                showBackButton={false}
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting */}
                <View style={styles.greeting}>
                    <Text style={styles.greetingText}>{greeting} 👋</Text>
                    <Text style={styles.dateText}>
                        {new Date().toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        })}
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <LinearGradient
                        colors={adherence >= 80 ? [Colors.status.success, '#16A34A'] : [Colors.status.warning, '#F97316']}
                        style={styles.statsGradient}
                    >
                        <View style={styles.statsContent}>
                            <Text style={styles.statsValue}>{adherence}%</Text>
                            <Text style={styles.statsLabel}>Observance</Text>
                        </View>
                        <View style={styles.statsContent}>
                            <Text style={styles.statsValue}>{takenCount}/{totalCount}</Text>
                            <Text style={styles.statsLabel}>Prises</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Prises du jour */}
                {takes.length === 0 ? (
                    <EmptyState
                        icon="checkmark-circle"
                        title="Aucune prise aujourd'hui"
                        message="Vous n'avez aucun médicament prévu pour aujourd'hui."
                        actionText="Gérer mes médicaments"
                        onAction={() => router.push('/manage-medications')}
                    />
                ) : (
                    <View style={styles.takesContainer}>
                        <Text style={styles.takesTitle}>Vos prises du jour</Text>
                        {takes.map((take) => (
                            <MedicationTakeCard
                                key={take.id}
                                take={take}
                                onToggle={handleToggleTake}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            <TabBar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    greeting: {
        padding: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    greetingText: {
        fontSize: FontSize.xxxl,
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    dateText: {
        fontSize: FontSize.md,
        color: Colors.text.secondary,
        textTransform: 'capitalize',
    },
    statsContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    statsGradient: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statsContent: {
        alignItems: 'center',
    },
    statsValue: {
        fontSize: FontSize.xxxl,
        fontWeight: FontWeight.bold,
        color: '#FFF',
        marginBottom: Spacing.xs,
    },
    statsLabel: {
        fontSize: FontSize.md,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    takesContainer: {
        padding: Spacing.xl,
    },
    takesTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.lg,
    },
});