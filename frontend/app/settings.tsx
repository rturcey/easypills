// frontend/app/settings.tsx - ✅ HEADER SIMPLE + TOUT FONCTIONNEL

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, Modal, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, CommonStyles } from '@/constants/theme';
import TabBar from '@/components/navigation/TabBar';
import AppHeader from '@/components/shared/AppHeader';
import { LoadingScreen, MenuItem, AppLogo } from '@/components/shared';
import { getSettings, updateSettings, resetAllData } from '@/services/storage';
import { syncAllNotifications, testNotification } from '@/utils/notifications';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [snoozeDuration, setSnoozeDuration] = useState(10);
  const [isPremium, setIsPremium] = useState(false);
  const [discreteMode, setDiscreteMode] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);

  useFocusEffect(
      useCallback(() => {
        loadSettings();
      }, [])
  );

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setNotificationsEnabled(settings.notificationsEnabled ?? true);
      setSnoozeDuration(settings.snoozeDuration ?? 10);
      setIsPremium(settings.isPremium ?? false);
      setDiscreteMode(settings.discreteMode ?? false);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await updateSettings({ notificationsEnabled: value });
    await syncAllNotifications();
    Alert.alert(
        value ? '🔔 Notifications activées' : '🔕 Notifications désactivées',
        value ? 'Vous recevrez des rappels' : 'Les rappels sont désactivés'
    );
  };

  const handleSnoozeDurationChange = async (newDuration: number) => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    setSnoozeDuration(newDuration);
    await updateSettings({ snoozeDuration: newDuration });
    setShowSnoozeModal(false);
    await syncAllNotifications();
    Alert.alert('⏰ Durée modifiée', `Reporter de ${newDuration} minutes`);
  };

  const toggleDiscreteMode = async (value: boolean) => {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    setDiscreteMode(value);
    await updateSettings({ discreteMode: value });
    await syncAllNotifications();
    Alert.alert(
        value ? '🔒 Mode discret activé' : '🔓 Mode discret désactivé',
        value ? 'Infos masquées dans les notifs' : 'Infos affichées'
    );
  };

  const handleTestNotification = async () => {
    try {
      await testNotification();
      Alert.alert('✅ Test envoyé', 'Notification dans 2 secondes');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer');
    }
  };

  // ✅ CORRECTIF: Aide fonctionnelle
  const showHelp = () => {
    Alert.alert(
        '💡 Aide & FAQ',
        '• Comment ajouter un médicament ?\nClic sur + dans "Mes médicaments"\n\n• Comment modifier ?\nClic sur un médicament\n\n• Données sécurisées ?\nTout reste sur votre appareil\n\n• Aide ?\nsupport@easypills.fr',
        [{ text: 'OK' }]
    );
  };

  // ✅ CORRECTIF: Confidentialité fonctionnelle
  const showPrivacyPolicy = () => {
    Alert.alert(
        '🔒 Confidentialité',
        'EasyPills respecte votre vie privée :\n\n• Données locales uniquement\n• Aucun envoi serveur\n• Pas de collecte personnelle\n• Notifications locales\n\nC\'est un aide-mémoire, pas un avis médical.',
        [
          { text: 'Fermer', style: 'cancel' },
          {
            text: 'En savoir plus',
            onPress: () => Linking.openURL('https://easypills.fr/privacy')
          }
        ]
    );
  };

  // ✅ CORRECTIF: Réinitialisation fonctionnelle
  const handleResetApp = async () => {
    Alert.alert(
        '⚠️ Réinitialiser',
        'Supprimer TOUT ? Irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await resetAllData();

                const Notifications = await import('expo-notifications');
                const { Platform } = await import('react-native');
                if (Platform.OS !== 'web') {
                  await Notifications.cancelAllScheduledNotificationsAsync();
                }

                setNotificationsEnabled(true);
                setSnoozeDuration(10);
                setDiscreteMode(false);
                setIsPremium(false);

                Alert.alert('✅ Réussi', 'App réinitialisée', [
                  { text: 'OK', onPress: () => router.replace('/') }
                ]);
              } catch (error) {
                console.error('Reset error:', error);
                Alert.alert('Erreur', 'Impossible de réinitialiser');
              }
            },
          },
        ]
    );
  };

  const toggleDevPremium = async (value: boolean) => {
    setIsPremium(value);
    await updateSettings({ isPremium: value });
    Alert.alert(
        value ? '👑 Premium (DEV)' : '🔓 Désactivé',
        value ? 'Tout accessible' : 'Mode gratuit'
    );
  };

  if (loading) return <LoadingScreen />;

  return (
      <SafeAreaView style={CommonStyles.container} edges={['top']}>
        {/* ✅ CORRECTIF: Header simple */}
        <AppHeader title="Paramètres" showBackButton={false} />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <LinearGradient
              colors={Colors.gradients.primary}
              style={styles.profileCard}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color={Colors.primary.blue} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Mon profil</Text>
                <Text style={styles.profileSubtitle}>Données locales</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Premium */}
          {!isPremium && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>PREMIUM</Text>
                <TouchableOpacity style={styles.premiumBanner} onPress={() => router.push('/premium')}>
                  <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.premiumGradient}>
                    <View style={styles.premiumContent}>
                      <Ionicons name="star" size={28} color="#FFF" />
                      <View style={styles.premiumText}>
                        <Text style={styles.premiumTitle}>Passez à Premium</Text>
                        <Text style={styles.premiumSubtitle}>Scan ordonnance & code-barre</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={24} color="#FFF" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
          )}

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
            <View style={styles.card}>
              <MenuItem
                  icon="notifications"
                  iconColor={Colors.primary.blue}
                  title="Activer les rappels"
                  subtitle="Recevoir des notifications"
                  rightElement="switch"
                  switchValue={notificationsEnabled}
                  onSwitchChange={toggleNotifications}
              />

              <View style={styles.divider} />

              <MenuItem
                  icon="time"
                  iconColor={Colors.primary.turquoise}
                  title="Durée du snooze"
                  subtitle={isPremium ? `${snoozeDuration} minutes` : 'Premium'}
                  rightElement={isPremium ? "chevron" : "lock"}
                  onPress={() => isPremium ? setShowSnoozeModal(true) : router.push('/premium')}
              />

              <View style={styles.divider} />

              <MenuItem
                  icon="eye-off"
                  iconColor={Colors.status.warning}
                  title="Mode discret"
                  subtitle={isPremium ? 'Masquer infos notifs' : 'Premium'}
                  rightElement={isPremium ? "switch" : "lock"}
                  switchValue={discreteMode}
                  onSwitchChange={isPremium ? toggleDiscreteMode : undefined}
                  onPress={!isPremium ? () => router.push('/premium') : undefined}
              />

              <View style={styles.divider} />

              <MenuItem
                  icon="bulb"
                  iconColor={Colors.status.success}
                  title="Test notifications"
                  onPress={handleTestNotification}
              />
            </View>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>SUPPORT</Text>
            <View style={styles.card}>
              <MenuItem
                  icon="help-circle"
                  iconColor={Colors.status.success}
                  title="Aide & FAQ"
                  onPress={showHelp}
              />

              <View style={styles.divider} />

              <MenuItem
                  icon="shield-checkmark"
                  iconColor={Colors.primary.blue}
                  title="Confidentialité"
                  onPress={showPrivacyPolicy}
              />
            </View>
          </View>

          {/* Danger */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>ZONE SENSIBLE</Text>
            <View style={styles.card}>
              <MenuItem
                  icon="trash"
                  iconColor={Colors.status.error}
                  title="Réinitialiser"
                  subtitle="Tout supprimer"
                  onPress={handleResetApp}
              />
            </View>
          </View>

          {/* Dev */}
          {__DEV__ && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>DEV MODE</Text>
                <View style={styles.card}>
                  <MenuItem
                      icon="code"
                      iconColor="#9333EA"
                      title="Premium (Dev)"
                      subtitle={isPremium ? 'ON' : 'OFF'}
                      rightElement="switch"
                      switchValue={isPremium}
                      onSwitchChange={toggleDevPremium}
                  />
                </View>
              </View>
          )}

          {/* Info */}
          <View style={styles.appInfo}>
            <AppLogo size="sm" />
            <Text style={styles.appVersion}>EasyPills v1.0.0</Text>
            <Text style={styles.appDisclaimer}>
              Aide-mémoire personnel.{'\n'}
              Pas un avis médical.
            </Text>
          </View>
        </ScrollView>

        {/* Modal Snooze */}
        <Modal visible={showSnoozeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Durée du snooze</Text>
              {[5, 10, 15, 30].map((duration) => (
                  <TouchableOpacity
                      key={duration}
                      style={[styles.modalOption, snoozeDuration === duration && styles.modalOptionSelected]}
                      onPress={() => handleSnoozeDurationChange(duration)}
                  >
                    <Text style={[styles.modalOptionText, snoozeDuration === duration && styles.modalOptionTextSelected]}>
                      {duration} minutes
                    </Text>
                  </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSnoozeModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TabBar />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  profileCard: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#FFF',
    marginBottom: 4,
  },
  profileSubtitle: { fontSize: FontSize.md, color: 'rgba(255, 255, 255, 0.9)' },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginHorizontal: Spacing.lg,
  },
  premiumBanner: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  premiumGradient: { padding: Spacing.lg },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  premiumText: { flex: 1 },
  premiumTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFF',
    marginBottom: 2,
  },
  premiumSubtitle: { fontSize: FontSize.sm, color: 'rgba(255, 255, 255, 0.9)' },
  appInfo: {
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
  },
  appVersion: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  appDisclaimer: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
    textAlign: 'center',
    lineHeight: 18,
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
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalOption: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.light,
    marginBottom: Spacing.sm,
  },
  modalOptionSelected: { backgroundColor: Colors.primary.blue },
  modalOptionText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  modalOptionTextSelected: { color: '#FFF' },
  modalCancel: {
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  modalCancelText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});