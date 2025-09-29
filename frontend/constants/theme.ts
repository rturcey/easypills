// frontend/constants/theme.ts - ✅ CORRECTIF: Toutes les couleurs
import { StyleSheet } from 'react-native';

export const Colors = {
  primary: {
    blue: '#2563EB',
    turquoise: '#5DAFA7',
    orange: '#F5A623',
    red: '#EF4444',
    green: '#10B981', // ✅ AJOUTÉ pour test.tsx
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F0F9FF',
    tertiary: '#F9FAFB',
    light: '#F8FAFC', // ✅ AJOUTÉ
  },
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#9CA3AF',
    white: '#FFFFFF',
    tertiary: '#CBD5E1', // ✅ AJOUTÉ pour test.tsx
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F5A623',
    info: '#2563EB',
  },
  border: {
    light: '#E1E8ED',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
  gradients: {
    primary: ['#2563EB', '#5DAFA7'] as [string, string], // ✅ Type corrigé
    danger: ['#EF4444', '#DC2626'] as [string, string], // ✅ Type corrigé
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

export const FontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Styles communs réutilisables
export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  backButton: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.base,
    color: Colors.text.primary,
  },
  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  // ✅ AJOUTÉ: Styles shadow réutilisables
  shadow: Shadow.medium,
  shadowSmall: Shadow.small,
  shadowLarge: Shadow.large,
});