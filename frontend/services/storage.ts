// services/storage.ts - CORRECTIF: Système d'historique fonctionnel
import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  MEDS: 'pv2.meds',
  TODAY: 'pv2.today',
  HISTORY: 'pv2.history', // ✅ NOUVEAU: Stockage de l'historique
  VERSION: 'pv2.version',
  SETTINGS: 'pv2.settings',
};

export type Medication = {
  id: string;
  name: string;
  dosage?: string;
  times: string[];
  days?: number[] | 'daily';
  monthlyDays?: number[];
  startISO?: string;
  endISO?: string | null;
  paused?: boolean;
  color?: string;
  icon?: string;
};

export type MedicationTake = {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  taken: boolean;
  date: string;
  dosage?: string; // ✅ Ajout pour l'historique
};

export type Settings = {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeDuration: number;
  isPremium: boolean;
  discreteMode: boolean;
};

// ✅ NOUVEAU: Type pour l'historique
export type HistoryDay = {
  date: string; // YYYY-MM-DD
  takes: MedicationTake[];
};

const isoToday = () => new Date().toISOString().slice(0, 10);

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const s = await AsyncStorage.getItem(key);
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
}

async function writeJSON(key: string, v: any) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(v));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
    throw error;
  }
}

// ==========================================
// SETTINGS
// ==========================================

export async function getSettings(): Promise<Settings> {
  return readJSON<Settings>(K.SETTINGS, {
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    snoozeDuration: 10,
    isPremium: false,
    discreteMode: false,
  });
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeJSON(K.SETTINGS, settings);
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await saveSettings({ ...current, ...updates });
}

// ==========================================
// CRUD MEDICATIONS
// ==========================================

export async function getMedications(): Promise<Medication[]> {
  return readJSON<Medication[]>(K.MEDS, []);
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  try {
    const meds = await getMedications();
    const med = meds.find((m) => m.id === id);
    return med || null;
  } catch (error) {
    console.error('Error in getMedicationById:', error);
    return null;
  }
}

export async function addMedication(med: Medication): Promise<void> {
  const meds = await getMedications();
  meds.push(med);
  await writeJSON(K.MEDS, meds);
}

export async function saveMedication(med: Medication): Promise<void> {
  return addMedication(med);
}

export async function updateMedication(
    id: string,
    updates: Partial<Medication>
): Promise<void> {
  try {
    const meds = await getMedications();
    const index = meds.findIndex((m) => m.id === id);

    if (index === -1) {
      throw new Error('Medication not found');
    }

    meds[index] = { ...meds[index], ...updates };
    await writeJSON(K.MEDS, meds);
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
}

export async function deleteMedication(id: string): Promise<void> {
  try {
    const meds = await getMedications();
    const filtered = meds.filter((m) => m.id !== id);
    await writeJSON(K.MEDS, filtered);

    // Nettoyer les prises du jour
    const todayState = await readJSON<{ date: string; taken: Record<string, boolean> }>(
        K.TODAY,
        { date: '', taken: {} }
    );

    const cleanedTaken: Record<string, boolean> = {};
    for (const key in todayState.taken) {
      if (!key.startsWith(id + '@')) {
        cleanedTaken[key] = todayState.taken[key];
      }
    }

    todayState.taken = cleanedTaken;
    await writeJSON(K.TODAY, todayState);

    // ✅ NOUVEAU: Nettoyer l'historique
    await cleanMedicationFromHistory(id);
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
}

export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove([K.MEDS, K.TODAY, K.HISTORY, K.VERSION, K.SETTINGS]);
}

// ==========================================
// TODAY SCHEDULE
// ==========================================

export async function generateTodaySchedule() {
  const [meds, todayState] = await Promise.all([
    readJSON<Medication[]>(K.MEDS, []),
    readJSON<{ date: string; taken: Record<string, boolean> }>(K.TODAY, {
      date: '',
      taken: {},
    }),
  ]);

  const today = isoToday();
  if (todayState.date === today) return;

  const weekday = (new Date().getDay() + 6) % 7 + 1;
  const list: MedicationTake[] = [];

  for (const m of meds) {
    if (m.paused) continue;
    if (m.startISO && today < m.startISO) continue;
    if (m.endISO && m.endISO < today) continue;

    const active =
        m.days === 'daily' ||
        (Array.isArray(m.days) && m.days.includes(weekday));

    if (!active) continue;

    for (const t of m.times) {
      list.push({
        id: `${m.id}@${today}@${t}`,
        medicationId: m.id,
        medicationName: m.name,
        scheduledTime: t,
        taken: false,
        date: today,
        dosage: m.dosage,
      });
    }
  }

  const taken: Record<string, boolean> = {};
  for (const it of list) taken[it.id] = false;

  await writeJSON(K.TODAY, { date: today, taken });
}

export async function getTodayTakes(): Promise<MedicationTake[]> {
  const [meds, todayState] = await Promise.all([
    readJSON<Medication[]>(K.MEDS, []),
    readJSON<{ date: string; taken: Record<string, boolean> }>(K.TODAY, {
      date: isoToday(),
      taken: {},
    }),
  ]);

  const today = todayState.date || isoToday();
  const ret: MedicationTake[] = [];

  for (const m of meds) {
    if (m.paused) continue;

    for (const t of m.times ?? []) {
      const id = `${m.id}@${today}@${t}`;
      const taken = todayState.taken[id] === true;

      ret.push({
        id,
        medicationId: m.id,
        medicationName: m.name,
        scheduledTime: t,
        taken,
        date: today,
        dosage: m.dosage,
      });
    }
  }

  ret.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  return ret;
}

// Alias pour compatibilité
export async function getTodaySchedule(): Promise<MedicationTake[]> {
  return getTodayTakes();
}

export async function markAsTaken(takeId: string, taken: boolean): Promise<void> {
  const todayState = await readJSON<{ date: string; taken: Record<string, boolean> }>(
      K.TODAY,
      { date: isoToday(), taken: {} }
  );

  todayState.taken[takeId] = taken;
  await writeJSON(K.TODAY, todayState);

  // ✅ NOUVEAU: Sauvegarder dans l'historique
  await saveToHistory(todayState.date, todayState.taken);
}

// Alias pour compatibilité
export async function markTaken(takeId: string, taken: boolean): Promise<void> {
  return markAsTaken(takeId, taken);
}

// ==========================================
// ✅ NOUVEAU: SYSTÈME D'HISTORIQUE
// ==========================================

/**
 * Sauvegarde l'état des prises dans l'historique
 */
async function saveToHistory(date: string, taken: Record<string, boolean>): Promise<void> {
  try {
    const history = await readJSON<Record<string, Record<string, boolean>>>(K.HISTORY, {});
    history[date] = taken;
    await writeJSON(K.HISTORY, history);
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

/**
 * Récupère l'historique pour une date spécifique
 */
export async function getHistoryForDate(date: string): Promise<Record<string, boolean>> {
  try {
    const history = await readJSON<Record<string, Record<string, boolean>>>(K.HISTORY, {});
    return history[date] || {};
  } catch (error) {
    console.error('Error getting history for date:', error);
    return {};
  }
}

/**
 * Récupère l'historique pour une période
 */
export async function getHistoryForPeriod(startDate: string, endDate: string): Promise<HistoryDay[]> {
  try {
    const [meds, history] = await Promise.all([
      getMedications(),
      readJSON<Record<string, Record<string, boolean>>>(K.HISTORY, {}),
    ]);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const result: HistoryDay[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const weekday = (d.getDay() + 6) % 7 + 1;
      const dayTaken = history[dateStr] || {};
      const takes: MedicationTake[] = [];

      for (const med of meds) {
        if (med.paused) continue;
        if (med.startISO && dateStr < med.startISO) continue;
        if (med.endISO && med.endISO < dateStr) continue;

        const active = med.days === 'daily' || (Array.isArray(med.days) && med.days.includes(weekday));
        if (!active) continue;

        for (const time of med.times) {
          const takeId = `${med.id}@${dateStr}@${time}`;
          takes.push({
            id: takeId,
            medicationId: med.id,
            medicationName: med.name,
            scheduledTime: time,
            taken: dayTaken[takeId] === true,
            date: dateStr,
            dosage: med.dosage,
          });
        }
      }

      takes.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
      result.push({ date: dateStr, takes });
    }

    return result;
  } catch (error) {
    console.error('Error getting history for period:', error);
    return [];
  }
}

/**
 * Nettoie un médicament de l'historique
 */
async function cleanMedicationFromHistory(medicationId: string): Promise<void> {
  try {
    const history = await readJSON<Record<string, Record<string, boolean>>>(K.HISTORY, {});

    for (const date in history) {
      const dayTaken = history[date];
      const cleanedDay: Record<string, boolean> = {};

      for (const takeId in dayTaken) {
        if (!takeId.startsWith(medicationId + '@')) {
          cleanedDay[takeId] = dayTaken[takeId];
        }
      }

      history[date] = cleanedDay;
    }

    await writeJSON(K.HISTORY, history);
  } catch (error) {
    console.error('Error cleaning medication from history:', error);
  }
}

/**
 * Nettoie l'historique ancien (garde uniquement les 90 derniers jours)
 */
export async function cleanOldHistory(): Promise<void> {
  try {
    const history = await readJSON<Record<string, Record<string, boolean>>>(K.HISTORY, {});
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const cleanedHistory: Record<string, Record<string, boolean>> = {};

    for (const date in history) {
      if (date >= cutoffStr) {
        cleanedHistory[date] = history[date];
      }
    }

    await writeJSON(K.HISTORY, cleanedHistory);
    console.log('Old history cleaned successfully');
  } catch (error) {
    console.error('Error cleaning old history:', error);
  }
}