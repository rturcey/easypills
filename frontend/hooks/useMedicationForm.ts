// frontend/hooks/useMedicationForm.ts - ✅ MODALE + MENSUEL + HORAIRES CORRIGÉS

import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { saveMedication, updateMedication, getMedicationById, type Medication } from '@/services/storage';
import { scheduleMedicationNotifications } from '@/utils/notifications';
import { MEDICATION_ICONS } from '@/constants/medicationIcons';
import { Colors } from '@/constants/theme';

// Jours et mapping
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_MAP: Record<string, number> = {
  'Lun': 1, 'Mar': 2, 'Mer': 3, 'Jeu': 4, 'Ven': 5, 'Sam': 6, 'Dim': 7,
};
const DAYS_REVERSE_MAP: Record<number, string> = {
  1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam', 7: 'Dim',
};

// ✅ Horaires par défaut
const DEFAULT_TIMES: Record<string, string> = {
  'matin': '08:00',
  'midi': '12:00',
  'soir': '19:00',
  '1 fois par jour': '08:00',
  '2 fois par jour': '08:00,19:00',
  '3 fois par jour': '08:00,12:00,19:00',
};

interface UseMedicationFormOptions {
  medicationId?: string;
  onSuccess?: () => void;
}

export function useMedicationForm(options: UseMedicationFormOptions = {}) {
  const { medicationId, onSuccess } = options;
  const isEditMode = !!medicationId;
  const params = useLocalSearchParams();

  // États
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('pill');
  const [selectedColor, setSelectedColor] = useState(Colors.primary.blue);
  const [frequencyMode, setFrequencyMode] = useState<'weekly' | 'monthly'>('weekly');
  const [schedules, setSchedules] = useState([{ time: '08:00', days: [...DAYS] as string[] }]);
  const [monthlyDays, setMonthlyDays] = useState<number[]>([1]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<number | null>(null);

  // ✅ Charger params du scan
  useEffect(() => {
    if (params.fromScan === 'true') {
      if (params.name) setName(params.name as string);
      if (params.dosage) setDosage(params.dosage as string);

      if (params.frequency) {
        const freq = (params.frequency as string).toLowerCase();
        const times = DEFAULT_TIMES[freq];

        if (times) {
          const timesArray = times.split(',');
          setSchedules(timesArray.map(time => ({
            time,
            days: [...DAYS] as string[]
          })));
        }
      }
    }
  }, [params]);

  // Chargement en mode édition
  useEffect(() => {
    if (isEditMode && medicationId) {
      loadMedication();
    }
  }, [medicationId]);

  const loadMedication = async () => {
    try {
      if (!medicationId || ['undefined', 'null', null, undefined].includes(medicationId as any)) {
        Alert.alert('Erreur', 'ID du médicament invalide', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      const med = await getMedicationById(medicationId);

      if (!med) {
        Alert.alert('Erreur', 'Médicament introuvable', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      setName(med.name);
      setDosage(med.dosage || '');
      setSelectedColor(med.color || Colors.primary.blue);

      const iconData = MEDICATION_ICONS.find(i => i.icon === med.icon);
      setSelectedIcon(iconData?.id || 'pill');

      if (med.monthlyDays && med.monthlyDays.length > 0) {
        setFrequencyMode('monthly');
        setMonthlyDays(med.monthlyDays);
      } else {
        setFrequencyMode('weekly');

        const daysArray = med.days === 'daily'
            ? [...DAYS]
            : Array.isArray(med.days)
                ? med.days.map(d => DAYS_REVERSE_MAP[d as keyof typeof DAYS_REVERSE_MAP]).filter(Boolean)
                : [...DAYS];

        const loadedSchedules = med.times.map(time => ({
          time,
          days: [...daysArray]
        }));

        setSchedules(loadedSchedules.length > 0 ? loadedSchedules : [{ time: '08:00', days: [...DAYS] as string[] }]);
      }

      if (med.startISO) {
        setStartDate(new Date(med.startISO));
      }
      if (med.endISO) {
        setEndDate(new Date(med.endISO));
      }

    } catch (error) {
      console.error('Error loading medication:', error);
      Alert.alert('Erreur', 'Impossible de charger le médicament', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleIconSelect = (iconId: string, color: string) => {
    setSelectedIcon(iconId);
    setSelectedColor(color);
  };

  const addSchedule = () => {
    setSchedules([...schedules, { time: '12:00', days: [...DAYS] as string[] }]);
  };

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (scheduleIndex: number, event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(null);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      const updated = [...schedules];
      updated[scheduleIndex].time = timeString;
      setSchedules(updated);
    }
  };

  const toggleDay = (scheduleIndex: number, day: string) => {
    const updated = [...schedules];
    const schedule = updated[scheduleIndex];
    schedule.days = schedule.days.includes(day)
        ? schedule.days.filter((d) => d !== day)
        : [...schedule.days, day];
    setSchedules(updated);
  };

  const toggleMonthlyDay = (day: number) => {
    setMonthlyDays(monthlyDays.includes(day)
        ? monthlyDays.filter((d) => d !== day)
        : [...monthlyDays, day].sort((a, b) => a - b)
    );
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStartDatePicker(false);
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today && !isEditMode) {
        Alert.alert('Erreur', 'La date de début ne peut pas être dans le passé');
        return;
      }

      setStartDate(selectedDate);
      if (endDate && selectedDate > endDate) setEndDate(null);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndDatePicker(false);
    if (selectedDate) {
      selectedDate.setHours(0, 0, 0, 0);
      const startDateCopy = new Date(startDate);
      startDateCopy.setHours(0, 0, 0, 0);

      if (selectedDate < startDateCopy) {
        Alert.alert('Erreur', 'La date de fin doit être après la date de début');
        return;
      }

      setEndDate(selectedDate);
    }
  };

  const validate = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du médicament');
      return false;
    }

    if (frequencyMode === 'weekly') {
      const hasValidSchedule = schedules.some((s) => s.days.length > 0);
      if (!hasValidSchedule) {
        Alert.alert('Erreur', 'Veuillez sélectionner au moins un jour');
        return false;
      }
    } else {
      if (monthlyDays.length === 0) {
        Alert.alert('Erreur', 'Veuillez sélectionner au moins un jour du mois');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      const times = [...new Set(schedules.map((s) => s.time))];

      let days: number[] | 'daily' | undefined;
      let monthlyDaysToSave: number[] | undefined;

      if (frequencyMode === 'weekly') {
        const allSelectedDays = new Set<number>();
        schedules.forEach((schedule) => {
          schedule.days.forEach((day) => {
            allSelectedDays.add(DAYS_MAP[day as keyof typeof DAYS_MAP]);
          });
        });
        const daysArray = Array.from(allSelectedDays).sort();
        days = daysArray.length === 7 ? 'daily' : daysArray;
      } else {
        monthlyDaysToSave = monthlyDays;
      }

      const iconToSave = MEDICATION_ICONS.find((i) => i.id === selectedIcon)?.icon || 'pill';

      const medicationData: Partial<Medication> = {
        name: name.trim(),
        dosage: dosage.trim() || undefined,
        times,
        days: frequencyMode === 'weekly' ? days : undefined,
        monthlyDays: frequencyMode === 'monthly' ? monthlyDaysToSave : undefined,
        startISO: startDate.toISOString().split('T')[0],
        endISO: endDate ? endDate.toISOString().split('T')[0] : null,
        color: selectedColor,
        icon: iconToSave,
      };

      if (isEditMode && medicationId) {
        await updateMedication(medicationId, medicationData);

        const updatedMed = await getMedicationById(medicationId);
        if (updatedMed && !updatedMed.paused) {
          await scheduleMedicationNotifications(updatedMed);
        }

        // ✅ CORRECTIF: Fermeture modale avec replace au lieu de back
        Alert.alert('Succès', 'Médicament modifié avec succès !', [
          {
            text: 'OK',
            onPress: () => {
              onSuccess?.();
              router.replace('/manage-medications');
            }
          },
        ]);
      } else {
        const newMedication: Medication = {
          id: Date.now().toString(),
          paused: false,
          ...(medicationData as Omit<Medication, 'id' | 'paused'>),
        };

        await saveMedication(newMedication);
        await scheduleMedicationNotifications(newMedication);

        if (params.hasMore === 'true' && params.remainingMeds) {
          try {
            const remaining = JSON.parse(params.remainingMeds as string);

            Alert.alert(
                '✅ Médicament ajouté',
                `${name} a été ajouté.\n\nIl reste ${remaining.length} médicament(s).`,
                [
                  {
                    text: 'Continuer',
                    onPress: () => {
                      onSuccess?.();
                      if (remaining.length > 0) {
                        const [next, ...rest] = remaining;
                        router.replace({
                          pathname: '/add-medication',
                          params: {
                            fromScan: 'true',
                            name: next.name,
                            dosage: next.dosage || '',
                            frequency: next.frequency || '',
                            hasMore: rest.length > 0 ? 'true' : 'false',
                            remainingMeds: JSON.stringify(rest),
                          }
                        });
                      }
                    }
                  }
                ]
            );
          } catch (e) {
            // ✅ CORRECTIF: Utiliser replace
            Alert.alert('Succès', 'Médicament ajouté avec succès !', [
              {
                text: 'OK',
                onPress: () => {
                  onSuccess?.();
                  router.replace('/manage-medications');
                }
              },
            ]);
          }
        } else {
          // ✅ CORRECTIF: Utiliser replace au lieu de back
          Alert.alert('Succès', 'Médicament ajouté avec succès !', [
            {
              text: 'OK',
              onPress: () => {
                onSuccess?.();
                router.replace('/manage-medications');
              },
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert(
          'Erreur',
          isEditMode ? 'Impossible de modifier le médicament.' : 'Impossible d\'ajouter le médicament.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ✅ CORRECTIF: Générer le texte des jours pour affichage
  const getDaysDisplay = (): string => {
    if (frequencyMode === 'monthly') {
      if (monthlyDays.length === 0) return 'Aucun jour sélectionné';
      if (monthlyDays.length === 31) return 'Tous les jours du mois';
      return monthlyDays.join(', ');
    } else {
      const allSelectedDays = new Set<string>();
      schedules.forEach((schedule) => {
        schedule.days.forEach((day) => allSelectedDays.add(day));
      });
      const daysArray = Array.from(allSelectedDays);
      if (daysArray.length === 7) return 'Tous les jours';
      if (daysArray.length === 0) return 'Aucun jour sélectionné';
      return daysArray.join(', ');
    }
  };

  return {
    loading,
    saving,
    isEditMode,
    name,
    setName,
    dosage,
    setDosage,
    selectedIcon,
    selectedColor,
    frequencyMode,
    setFrequencyMode,
    schedules,
    monthlyDays,
    startDate,
    endDate,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    showTimePicker,
    setShowTimePicker,
    handleIconSelect,
    addSchedule,
    removeSchedule,
    handleTimeChange,
    toggleDay,
    toggleMonthlyDay,
    handleStartDateChange,
    handleEndDateChange,
    handleSubmit,
    validate,
    getDaysDisplay, // ✅ NOUVEAU: Pour afficher les jours
  };
}