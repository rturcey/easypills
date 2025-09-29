// frontend/constants/medications.ts

export const MEDICATION_ICONS = [
  { id: 'pill', icon: 'medical', label: 'Comprimé', color: '#2563EB' },
  { id: 'syringe', icon: 'fitness', label: 'Injection', color: '#EF4444' },
  { id: 'heart', icon: 'heart', label: 'Cardiaque', color: '#DC2626' },
  { id: 'vitamins', icon: 'nutrition', label: 'Vitamine', color: '#F59E0B' },
  { id: 'drops', icon: 'water', label: 'Gouttes', color: '#3B82F6' },
  { id: 'inhaler', icon: 'thermometer', label: 'Inhalateur', color: '#06B6D4' },
  { id: 'cream', icon: 'color-palette', label: 'Crème', color: '#EC4899' },
  { id: 'eye', icon: 'eye', label: 'Ophtalmique', color: '#8B5CF6' },
  { id: 'antibiotic', icon: 'shield-checkmark', label: 'Antibiotique', color: '#10B981' },
] as const;

export const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

export const DAYS_MAP: Record<string, number> = {
  'Lun': 1,
  'Mar': 2,
  'Mer': 3,
  'Jeu': 4,
  'Ven': 5,
  'Sam': 6,
  'Dim': 7,
};

export const DAYS_REVERSE_MAP: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Jeu',
  5: 'Ven',
  6: 'Sam',
  7: 'Dim',
};

export type MedicationIcon = typeof MEDICATION_ICONS[number];
export type DayName = typeof DAYS[number];
