// frontend/services/ocr-config.ts
// Configuration centralisée pour l'OCR

export type OCRProvider = 'tesseract' | 'mock';

export type OCRConfig = {
  provider: OCRProvider;
  tesseractLanguage: string;
  enableFallback: boolean;
  mockMode: boolean;
  confidenceThreshold: number;
  maxRetries: number;
  timeout: number;
};

// Configuration par défaut
export const defaultOCRConfig: OCRConfig = {
  provider: 'tesseract',
  tesseractLanguage: 'fra',
  enableFallback: true,
  mockMode: false,
  confidenceThreshold: 0.6,
  maxRetries: 2,
  timeout: 30000, // 30 secondes
};

// Configuration actuelle (peut être modifiée au runtime)
let currentConfig: OCRConfig = { ...defaultOCRConfig };

/**
 * Obtenir la configuration actuelle
 */
export function getOCRConfig(): OCRConfig {
  return { ...currentConfig };
}

/**
 * Mettre à jour la configuration
 */
export function setOCRConfig(config: Partial<OCRConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  console.log('🔧 Configuration OCR mise à jour:', currentConfig);
}

/**
 * Réinitialiser la configuration par défaut
 */
export function resetOCRConfig(): void {
  currentConfig = { ...defaultOCRConfig };
}

/**
 * Configurations prédéfinies
 */
export const presetConfigs = {
  // Développement avec Tesseract
  development: {
    provider: 'tesseract' as OCRProvider,
    enableFallback: false,
    mockMode: false,
    confidenceThreshold: 0.5,
  },

  // Tests avec données simulées
  testing: {
    provider: 'mock' as OCRProvider,
    mockMode: true,
    enableFallback: false,
  },

  // Mode hors-ligne (Tesseract uniquement)
  offline: {
    provider: 'tesseract' as OCRProvider,
    enableFallback: false,
    mockMode: false,
  },
};

/**
 * Appliquer une configuration prédéfinie
 */
export function usePresetConfig(preset: keyof typeof presetConfigs): void {
  const config = presetConfigs[preset];
  if (config) {
    setOCRConfig(config);
    console.log(`✅ Configuration "${preset}" appliquée`);
  } else {
    console.error(`❌ Configuration "${preset}" introuvable`);
  }
}

/**
 * Obtenir les statistiques de configuration
 */
export function getConfigStats() {
  return {
    provider: currentConfig.provider,
    isConfigured: true,
    mockMode: currentConfig.mockMode,
    confidenceThreshold: currentConfig.confidenceThreshold,
  };
}

/**
 * Valider la configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (currentConfig.confidenceThreshold < 0 || currentConfig.confidenceThreshold > 1) {
    errors.push('Seuil de confiance doit être entre 0 et 1');
  }

  if (currentConfig.timeout < 1000) {
    errors.push('Timeout doit être >= 1000ms');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Variables d'environnement
export const env = {
  GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY,
  OCR_PROVIDER: (process.env.OCR_PROVIDER as OCRProvider) || 'tesseract',
  MOCK_MODE: process.env.MOCK_MODE === 'true',
  DEBUG_OCR: process.env.DEBUG_OCR === 'true',
};

// Initialiser la config depuis les variables d'environnement
if (env.OCR_PROVIDER) {
  setOCRConfig({ provider: env.OCR_PROVIDER });
}

if (env.MOCK_MODE) {
  setOCRConfig({ mockMode: true });
}

// Exemple d'utilisation dans l'app
export const ocrConfigExamples = {
  // Développement local
  setupDevelopment: () => {
    usePresetConfig('development');
    setOCRConfig({ mockMode: true });
  },

  // Tests
  setupTesting: () => {
    usePresetConfig('testing');
  },

  // Mode hors-ligne
  setupOffline: () => {
    usePresetConfig('offline');
  },
};

// Logs de debug
if (env.DEBUG_OCR) {
  console.log('🔍 Configuration OCR actuelle:');
  console.log(JSON.stringify(getConfigStats(), null, 2));
}
