// frontend/app/history.tsx - ✅ CORRECTIF: Utilise le nouveau système d'historique
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHistoryForPeriod, type HistoryDay } from '@/services/storage'; // ✅ Nouveau
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import TabBar from '@/components/navigation/TabBar';
import AppHeader from '@/components/shared/AppHeader';
import { LoadingScreen, StatsCard, ProgressBar } from '@/components/shared';

type PeriodFilter = '7days' | '30days' | '90days';

// ✅ Type simplifié - on utilise maintenant le type du storage
type HistoryDayDisplay = {
  date: string;
  dateISO: string;
  dayOfWeek: string;
  taken: number;
  total: number;
  percentage: number;
  medications: Array<{
    name: string;
    time: string;
    taken: boolean;
    dosage?: string;
  }>;
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [historyData, setHistoryData] = useState<HistoryDayDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>('7days');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['Aujourd\'hui']));

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ Calculer les dates de début et fin
      const daysToShow = period === '7days' ? 7 : period === '30days' ? 30 : 90;
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - daysToShow + 1);

      const endDateStr = today.toISOString().split('T')[0];
      const startDateStr = startDate.toISOString().split('T')[0];

      // ✅ CORRECTIF: Utiliser la nouvelle fonction getHistoryForPeriod
      const historyPeriod = await getHistoryForPeriod(startDateStr, endDateStr);

      // ✅ Transformer en format d'affichage
      const history: HistoryDayDisplay[] = [];

      for (let i = 0; i < daysToShow; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Trouver les données pour ce jour
        const dayData = historyPeriod.find(h => h.date === dateStr);

        if (!dayData) {
          // Pas de données pour ce jour
          let dateLabel = dateStr;
          if (i === 0) dateLabel = "Aujourd'hui";
          else if (i === 1) dateLabel = "Hier";

          const dayOfWeek = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });

          history.push({
            date: dateLabel,
            dateISO: dateStr,
            dayOfWeek: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
            taken: 0,
            total: 0,
            percentage: 0,
            medications: [],
          });
          continue;
        }

        // Calculer les stats
        const takenCount = dayData.takes.filter(t => t.taken).length;
        const totalCount = dayData.takes.length;
        const percentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

        // Label de date
        let dateLabel = dateStr;
        if (i === 0) dateLabel = "Aujourd'hui";
        else if (i === 1) dateLabel = "Hier";

        const dayOfWeek = date.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });

        // Transformer les prises en format d'affichage
        const medications = dayData.takes.map(take => ({
          name: take.medicationName,
          time: take.scheduledTime,
          taken: take.taken,
          dosage: take.dosage,
        }));

        history.push({
          date: dateLabel,
          dateISO: dateStr,
          dayOfWeek: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
          taken: takenCount,
          total: totalCount,
          percentage,
          medications,
        });
      }

      setHistoryData(history);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(
      useCallback(() => {
        loadHistory();
      }, [loadHistory])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  if (loading) return <LoadingScreen />;

  // Calcul des statistiques avancées
  const overallAdherence = historyData.length > 0
      ? Math.round(historyData.reduce((sum, day) => sum + day.percentage, 0) / historyData.length)
      : 0;

  const bestDay = historyData.reduce((best, day) =>
      day.percentage > best.percentage ? day : best, historyData[0] || { percentage: 0, date: '-' });

  const worstDay = historyData.reduce((worst, day) =>
          day.total > 0 && day.percentage < worst.percentage ? day : worst,
      historyData.find(d => d.total > 0) || { percentage: 100, date: '-' });

  const perfectDays = historyData.filter(d => d.percentage === 100 && d.total > 0).length;
  const missedDoses = historyData.reduce((sum, day) => sum + (day.total - day.taken), 0);

  // Tendance (comparaison première vs dernière moitié)
  const halfPoint = Math.floor(historyData.length / 2);
  const firstHalfAvg = historyData.slice(0, halfPoint).reduce((sum, d) => sum + d.percentage, 0) / halfPoint || 0;
  const secondHalfAvg = historyData.slice(halfPoint).reduce((sum, d) => sum + d.percentage, 0) / (historyData.length - halfPoint) || 0;
  const trend = secondHalfAvg - firstHalfAvg;

  // Conseils personnalisés
  const getTips = () => {
    const tips = [];
    if (overallAdherence >= 90) {
      tips.push("🎉 Excellent ! Vous êtes très régulier dans vos prises.");
    } else if (overallAdherence >= 70) {
      tips.push("👍 Bon suivi ! Continuez vos efforts pour atteindre 90%.");
    } else {
      tips.push("💪 Utilisez les rappels pour ne manquer aucune prise.");
    }

    if (trend > 5) {
      tips.push("📈 Votre observance s'améliore ! Continuez comme ça.");
    } else if (trend < -5) {
      tips.push("📉 Votre observance baisse. Vérifiez vos rappels.");
    }

    if (missedDoses > 5) {
      tips.push("⏰ Pensez à activer le son pour vos notifications.");
    }

    return tips;
  };

  return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader
            title="Historique"
            showLogo={false}
            leftAction={{
              icon: 'chevron-back',
              onPress: () => {}, // Géré par TabBar
            }}
        />

        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
          {/* Filtres de période */}
          <View style={styles.filtersSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {[
                { id: '7days', label: '7 jours' },
                { id: '30days', label: '30 jours' },
                { id: '90days', label: '90 jours' },
              ].map((filter) => (
                  <TouchableOpacity
                      key={filter.id}
                      style={[styles.filterButton, period === filter.id && styles.filterButtonActive]}
                      onPress={() => setPeriod(filter.id as PeriodFilter)}
                      activeOpacity={0.7}
                  >
                    <Text style={[styles.filterText, period === filter.id && styles.filterTextActive]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Stats globales */}
          <View style={styles.statsSection}>
            <StatsCard
                type="progress"
                percentage={overallAdherence}
                subtitle="Observance moyenne"
                icon="analytics"
            />

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statGradient, { backgroundColor: Colors.status.success }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                  <Text style={styles.statValue}>{perfectDays}</Text>
                  <Text style={styles.statLabel}>Jours parfaits</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statGradient, { backgroundColor: Colors.status.warning }]}>
                  <Ionicons name="close-circle" size={24} color="#FFF" />
                  <Text style={styles.statValue}>{missedDoses}</Text>
                  <Text style={styles.statLabel}>Prises oubliées</Text>
                </View>
              </View>
            </View>

            {/* Meilleur/Pire jour */}
            <View style={styles.compareSection}>
              <View style={styles.compareCard}>
                <View style={styles.compareHeader}>
                  <Ionicons name="trophy" size={20} color={Colors.status.success} />
                  <Text style={styles.compareTitle}>Meilleur jour</Text>
                </View>
                <Text style={styles.compareDay}>{bestDay.date}</Text>
                <Text style={styles.comparePercentage}>{bestDay.percentage}%</Text>
              </View>

              <View style={styles.compareCard}>
                <View style={styles.compareHeader}>
                  <Ionicons name="warning" size={20} color={Colors.status.error} />
                  <Text style={styles.compareTitle}>À améliorer</Text>
                </View>
                <Text style={styles.compareDay}>{worstDay.date}</Text>
                <Text style={styles.comparePercentage}>{worstDay.percentage}%</Text>
              </View>
            </View>

            {/* Conseils personnalisés */}
            {getTips().length > 0 && (
                <View style={styles.tipsSection}>
                  <Text style={styles.sectionTitle}>Conseils personnalisés</Text>
                  {getTips().map((tip, idx) => (
                      <View key={idx} style={styles.tipCard}>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                  ))}
                </View>
            )}

            {/* Tendance */}
            {Math.abs(trend) > 1 && (
                <View style={styles.trendCard}>
                  <View style={styles.trendHeader}>
                    <Ionicons
                        name={trend > 0 ? "trending-up" : "trending-down"}
                        size={24}
                        color={trend > 0 ? Colors.status.success : Colors.status.error}
                    />
                    <Text style={styles.trendTitle}>
                      Tendance : {trend > 0 ? 'En amélioration' : 'En baisse'}
                    </Text>
                  </View>
                  <Text style={styles.trendValue}>
                    {trend > 0 ? '+' : ''}{Math.round(trend)}% sur la période
                  </Text>
                </View>
            )}
          </View>

          {/* Historique détaillé */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Historique détaillé</Text>
            {historyData.map((day, idx) => {
              const isExpanded = expandedDays.has(day.date);

              return (
                  <TouchableOpacity
                      key={idx}
                      style={styles.dayCard}
                      onPress={() => toggleDayExpansion(day.date)}
                      activeOpacity={0.7}
                  >
                    <View style={styles.dayHeader}>
                      <View style={styles.dayInfo}>
                        <Text style={styles.dayDate}>{day.date}</Text>
                        <Text style={styles.dayWeek}>{day.dayOfWeek}</Text>
                      </View>

                      <View style={styles.dayStats}>
                        <Text style={styles.dayCount}>
                          {day.taken}/{day.total}
                        </Text>
                        <View style={[
                          styles.dayBadge,
                          { backgroundColor: day.percentage === 100 ? Colors.status.success :
                                day.percentage >= 75 ? Colors.primary.orange : Colors.status.error }
                        ]}>
                          <Text style={styles.dayPercentage}>{day.percentage}%</Text>
                        </View>
                      </View>

                      <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={24}
                          color={Colors.text.secondary}
                      />
                    </View>

                    {isExpanded && day.medications.length > 0 && (
                        <View style={styles.dayDetails}>
                          {day.medications.map((med, medIdx) => (
                              <View key={medIdx} style={styles.medRow}>
                                <Ionicons
                                    name={med.taken ? "checkmark-circle" : "close-circle"}
                                    size={20}
                                    color={med.taken ? Colors.status.success : Colors.text.light}
                                />
                                <View style={styles.medInfo}>
                                  <Text style={[styles.medName, !med.taken && styles.medNameMissed]}>
                                    {med.name}
                                  </Text>
                                  {med.dosage && (
                                      <Text style={styles.medDosage}>{med.dosage}</Text>
                                  )}
                                </View>
                                <Text style={styles.medTime}>{med.time}</Text>
                              </View>
                          ))}
                        </View>
                    )}

                    {isExpanded && day.medications.length === 0 && (
                        <View style={styles.emptyDay}>
                          <Text style={styles.emptyDayText}>Aucun médicament prévu ce jour</Text>
                        </View>
                    )}
                  </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TabBar currentTab="history" />
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
  filtersSection: {
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  filters: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.blue,
  },
  filterText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.text.white,
  },
  statsSection: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.text.white,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  compareSection: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  compareCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  compareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  compareTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  compareDay: {
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  comparePercentage: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  tipsSection: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  tipCard: {
    backgroundColor: '#EFF6FF',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.blue,
  },
  tipText: {
    fontSize: FontSize.sm,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  trendCard: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  trendTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  trendValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  historySection: {
    padding: Spacing.xl,
    paddingTop: 0,
  },
  dayCard: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayInfo: {
    flex: 1,
  },
  dayDate: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  dayWeek: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  dayStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.md,
  },
  dayCount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  dayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  dayPercentage: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text.white,
  },
  dayDetails: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    gap: Spacing.md,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  medNameMissed: {
    color: Colors.text.light,
    textDecorationLine: 'line-through',
  },
  medDosage: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  medTime: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  emptyDay: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
});