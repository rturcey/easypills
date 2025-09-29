// On garde @expo/vector-icons mais on utilise MaterialCommunityIcons (riche en pictos médicaux)
import { MaterialCommunityIcons as Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export interface MedicationIcon {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

/**
 * Légende palette par voie :
 * - Orale: Colors.primary.blue
 * - Injectable: Colors.primary.red
 * - Topique (peau): Colors.primary.turquoise
 * - Inhalée: Colors.primary.green
 * - Gynéco / muqueuse: Colors.primary.orange
 * - Autre: Colors.text.secondary
 */
export const MEDICATION_ICONS: MedicationIcon[] = [
  // --- Orale
  { id: 'pill',       name: 'Comprimé',     icon: 'pill',                 color: Colors.primary.blue },
  { id: 'capsule',    name: 'Gélule',       icon: 'capsule',              color: Colors.primary.blue },
  { id: 'syrup',      name: 'Sirop',        icon: 'bottle-tonic-outline', color: Colors.primary.blue },
  { id: 'powder',     name: 'Poudre',       icon: 'beaker-outline',       color: Colors.primary.blue },
  { id: 'drops',      name: 'Gouttes',      icon: 'water',                color: Colors.primary.blue }, // par défaut: gouttes orales

  // --- Injectable
  { id: 'injection',  name: 'Injection',    icon: 'needle',               color: Colors.primary.red },

  // --- Topique (peau)
  { id: 'cream',      name: 'Crème',        icon: 'tube',                 color: Colors.primary.turquoise },
  { id: 'gel',        name: 'Gel',          icon: 'flask-outline',        color: Colors.primary.turquoise },
  { id: 'spray',      name: 'Spray',        icon: 'spray-bottle',         color: Colors.primary.turquoise },
  { id: 'patch',      name: 'Patch',        icon: 'bandage',              color: Colors.primary.turquoise },

  // --- Inhalée
  { id: 'inhaler',    name: 'Inhalateur',   icon: 'inhaler',              color: Colors.primary.green },

  // --- Gynéco / muqueuse
  { id: 'suppository',name: 'Suppositoire', icon: 'arrow-down-circle-outline', color: Colors.primary.orange },
  { id: 'ovule',      name: 'Ovule',        icon: 'gender-female',        color: Colors.primary.orange },

  // --- Autre
  { id: 'other',      name: 'Autre',        icon: 'help-circle-outline',  color: Colors.text.secondary },
];

export const getIconById = (id: string): MedicationIcon => {
  return MEDICATION_ICONS.find(icon => icon.id === id) || MEDICATION_ICONS[0];
};
