// frontend/app/premium.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, CommonStyles } from '@/constants/theme';
import {AppHeader, AppLogo, Header} from '@/components/shared';
import { updateSettings, getSettings } from '@/services/storage';

type Plan = 'monthly' | 'yearly';

export default function PremiumScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const [purchasing, setPurchasing] = useState(false);

  const features = [
    {
      icon: 'camera',
      title: 'Scan d\'ordonnance',
      description: 'Reconnaissance automatique des médicaments et posologies',
      color: Colors.primary.blue,
    },
    {
      icon: 'barcode',
      title: 'Scan de code-barre',
      description: 'Identifiez vos médicaments instantanément',
      color: Colors.primary.turquoise,
    },
    {
      icon: 'time',
      title: 'Snooze personnalisé',
      description: 'Reportez vos rappels de 5, 10, 15 ou 30 minutes',
      color: Colors.primary.orange,
    },
    {
      icon: 'eye-off',
      title: 'Mode discret',
      description: 'Masquez les informations sensibles dans les notifications',
      color: Colors.status.warning,
    },
  ];

  const handlePurchase = async () => {
    setPurchasing(true);

    try {
      // TODO: Implémenter expo-in-app-purchases
      // Pour l'instant, simulation d'achat
      
      Alert.alert(
        '🎉 Bienvenue dans Premium !',
        'Votre abonnement est activé. Profitez de toutes les fonctionnalités !',
        [
          {
            text: 'Commencer',
            onPress: async () => {
              // Activer le Premium
              await updateSettings({ isPremium: true });
              router.replace('/settings');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Erreur', 'Impossible de finaliser l\'achat. Veuillez réessayer.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restaurer les achats',
      'Vérification de vos achats précédents...',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={CommonStyles.container} edges={['top']}>
      <AppHeader
          title="EasyPills Premium"
          showLogo={false}
          leftAction={{
            icon: 'close',
            onPress: () => router.back(),
          }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <AppLogo size="lg" />
          <Text style={styles.heroTitle}>Passez à Premium</Text>
          <Text style={styles.heroSubtitle}>
            Débloquez toutes les fonctionnalités pour une gestion optimale de vos médicaments
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                <Ionicons name={feature.icon as any} size={28} color={feature.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plans}>
          <Text style={styles.plansTitle}>Choisissez votre formule</Text>

          {/* Plan Annuel */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
          >
            <View style={styles.planHeader}>
              <View style={styles.planRadio}>
                {selectedPlan === 'yearly' && <View style={styles.planRadioInner} />}
              </View>
              <View style={styles.planInfo}>
                <View style={styles.planTitleRow}>
                  <Text style={styles.planTitle}>Annuel</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>-17%</Text>
                  </View>
                </View>
                <Text style={styles.planPrice}>9,99 € / an</Text>
                <Text style={styles.planSubtitle}>Soit 0,83 € / mois</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Plan Mensuel */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            <View style={styles.planHeader}>
              <View style={styles.planRadio}>
                {selectedPlan === 'monthly' && <View style={styles.planRadioInner} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>Mensuel</Text>
                <Text style={styles.planPrice}>0,99 € / mois</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handlePurchase}
          disabled={purchasing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={Colors.gradients.primary}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.ctaText}>
              {purchasing ? 'Traitement en cours...' : `S'abonner maintenant`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
          <Text style={styles.restoreText}>Restaurer mes achats</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.legal}>
          Paiement sécurisé via Google Play. Abonnement renouvelé automatiquement. 
          Annulation possible à tout moment dans les paramètres de votre compte.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  features: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs / 2,
  },
  featureDescription: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  plans: {
    marginBottom: Spacing.xl,
  },
  plansTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  planCardSelected: {
    borderColor: Colors.primary.blue,
    backgroundColor: `${Colors.primary.blue}05`,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary.blue,
  },
  planInfo: {
    flex: 1,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs / 2,
  },
  planTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  badge: {
    backgroundColor: Colors.status.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: '#FFF',
  },
  planPrice: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary.blue,
    marginBottom: Spacing.xs / 2,
  },
  planSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  ctaButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  ctaGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFF',
  },
  restoreButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.primary.blue,
  },
  legal: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});
