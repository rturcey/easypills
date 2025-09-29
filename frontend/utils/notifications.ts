// utils/notifications.ts - Avec support Web
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getMedications, getTodayTakes, markAsTaken, getSettings } from '@/services/storage';

// ⚠️ Vérification si on est sur une plateforme native
const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

// Synchroniser toutes les notifications
export async function syncAllNotifications() {
  // 🔧 FIX : Ne pas exécuter sur le web
  if (!isNativePlatform) {
    console.log('Notifications not available on web platform');
    return;
  }

  const medications = await getMedications();
  const settings = await getSettings();

  // Vérifier si les notifications sont activées
  if (!settings.notificationsEnabled) {
    // Annuler toutes les notifications si désactivées
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Notifications disabled - all notifications cancelled');
    return;
  }

  // Annuler toutes les notifications existantes
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Replanifier pour tous les médicaments actifs
  for (const medication of medications) {
    if (!medication.paused) {
      await scheduleMedicationNotifications(medication);
    }
  }

  console.log('All notifications synced successfully');
}

// Fonction à appeler au démarrage de l'app
export async function initializeNotifications() {
  // 🔧 FIX : Ne pas exécuter sur le web
  if (!isNativePlatform) {
    console.log('Notifications initialization skipped on web platform');
    return;
  }

  await setupNotificationCategories();
  setupNotificationResponseHandler();
  await syncAllNotifications();
}

// Planifier toutes les notifications pour un médicament
export async function scheduleMedicationNotifications(medication: any) {
  // 🔧 FIX : Ne pas exécuter sur le web
  if (!isNativePlatform) {
    console.log('Notifications not available on web platform');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('Notifications not permitted');
    return;
  }

  // ... reste du code inchangé
}

// Annuler les notifications d'un médicament
export async function cancelMedicationNotifications(medicationId: string) {
  // 🔧 FIX : Ne pas exécuter sur le web
  if (!isNativePlatform) {
    return;
  }

  const allNotifications = await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of allNotifications) {
    if (notification.identifier.startsWith(medicationId)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Tester une notification immédiate (pour debug)
export async function testNotification() {
  // 🔧 FIX : Ne pas exécuter sur le web
  if (!isNativePlatform) {
    console.log('Test notification not available on web platform');
    alert('Les notifications ne sont pas disponibles sur le web. Veuillez tester sur iOS ou Android.');
    return;
  }

  const settings = await getSettings();
  const snoozeDuration = settings.snoozeDuration || 10;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Test EasyPills',
      body: 'Les notifications fonctionnent !',
      sound: true,
      categoryIdentifier: 'MEDICATION_REMINDER',
      data: {
        medicationId: 'test',
        medicationName: 'Médicament Test',
        dosage: '500mg',
        time: '12:00',
        takeId: 'test@2025-01-01@12:00',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, // ✅ AJOUTÉ
      seconds: 2,
    },
  });

  console.log(`Test notification scheduled (snooze: ${snoozeDuration} min)`);
}

// Planifier un snooze avec durée configurable
export async function snoozeNotification(medicationData: any) {
  // 🔧 FIX : Ne pas exécuter sur le web
  if (!isNativePlatform) {
    return;
  }

  // Récupérer la durée de snooze depuis les settings
  const settings = await getSettings();
  const snoozeTime = settings.snoozeDuration || 10; // minutes

  await Notifications.scheduleNotificationAsync({
    identifier: `${medicationData.medicationId}-snooze-${Date.now()}`,
    content: {
      title: '💊 Rappel reporté',
      body: `N'oubliez pas : ${medicationData.medicationName}`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: 'MEDICATION_REMINDER',
      data: medicationData,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, // ✅ AJOUTÉ
      seconds: snoozeTime * 60,
    },
  });
  console.log(`Notification snoozed for ${snoozeTime} minutes`);
}

// Configuration des catégories de notifications avec actions
export async function setupNotificationCategories() {
  // 🔧 FIX : Ne pas exécuter sur le web
  if (!isNativePlatform) {
    return;
  }

  // Récupérer la durée de snooze depuis les settings
  const settings = await getSettings();
  const snoozeDuration = settings.snoozeDuration || 10;

  await Notifications.setNotificationCategoryAsync('MEDICATION_REMINDER', [
    {
      identifier: 'TAKE',
      buttonTitle: '✓ Pris',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
      },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: `⏰ +${snoozeDuration} min`,
      options: {
        opensAppToForeground: false,
        isDestructive: false,
      },
    },
  ]);
}

// Demander les permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  // 🔧 FIX : Ne pas exécuter sur le web
  if (!isNativePlatform) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// Gérer les actions des notifications
export function setupNotificationResponseHandler() {
  // 🔧 FIX : Ne pas exécuter sur le web
  if (!isNativePlatform) {
    return;
  }

  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data as any; // ✅ AJOUTÉ

    if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      const { router } = await import('expo-router');
      if (router) {
        router.push({
          pathname: '/reminder',
          params: {
            medicationId: data.medicationId as string,          // ✅ Cast
            medicationName: data.medicationName as string,      // ✅ Cast
            dosage: (data.dosage || '') as string,             // ✅ Cast
            time: data.time as string,                         // ✅ Cast
            takeId: data.takeId as string,                     // ✅ Cast
            color: (data.color || '#F5A623') as string,        // ✅ Cast
          }
        });
      }
      return;
    }

    if (actionIdentifier === 'TAKE') {
      // Marquer comme pris
      try {
        const takeId = data.takeId as string;
        await markAsTaken(takeId, true);
        console.log('Medication marked as taken:', takeId);

        // Afficher une confirmation
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '✅ Prise enregistrée',
            body: `${data.medicationName} marqué comme pris`,
            sound: false,
          },
          trigger: null,
        });
      } catch (error) {
        console.error('Error marking medication as taken:', error);
      }
    } else if (actionIdentifier === 'SNOOZE') {
      // Reporter avec la durée configurée
      await snoozeNotification(data);

      // Récupérer la durée pour l'affichage
      const settings = await getSettings();
      const snoozeTime = settings.snoozeDuration || 10;

      // Afficher une confirmation
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Rappel reporté',
          body: `Je vous rappellerai dans ${snoozeTime} minutes`,
          sound: false,
        },
        trigger: null,
      });
    }
  });
}

// Vérifier le statut des permissions
export async function checkNotificationPermissions(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  // 🔧 FIX : Ne pas exécuter sur le web
  if (!isNativePlatform) {
    return {
      granted: false,
      canAskAgain: false,
    };
  }

  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain,
  };
}

// Configuration du comportement des notifications
if (isNativePlatform) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,  // ✅ AJOUTÉ
      shouldShowList: true,    // ✅ AJOUTÉ
    }),
  });
}