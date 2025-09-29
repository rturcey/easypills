// Dans frontend/services/ocr-service.ts
// REMPLACER tout le début du fichier :

import { createWorker } from 'tesseract.js';
import * as ImageManipulator from "expo-image-manipulator";
import { getOCRConfig } from './ocr-config';

// 🔥 IMPORT DU CATALOGUE COMPLET
import catalogMeds from './catalog_meds.json';

export type ExtractedMedication = {
  name: string;
  dosage?: string;
  frequency?: string;
  confidence: number;
  source: "barcode" | "ocr";
  matchedLabel?: string;
};

// ==========================================
// CHARGER LA LISTE COMPLÈTE DES MÉDICAMENTS
// ==========================================

// Extraire tous les noms de médicaments du catalogue
const ALL_MEDICATION_NAMES: string[] = Object.keys(catalogMeds).map(name =>
    name.toUpperCase().trim()
);

console.log(`📚 Catalogue chargé: ${ALL_MEDICATION_NAMES.length} médicaments disponibles`);

// ==========================================
// DONNÉES MOCK POUR LES TESTS
// ==========================================

const MOCK_MEDICATIONS: ExtractedMedication[] = [
  {
    name: 'DOLIPRANE',
    dosage: '1000 mg',
    frequency: '3 fois par jour',
    confidence: 0.95,
    source: 'ocr',
    matchedLabel: 'DOLIPRANE 1000 mg',
  },
  {
    name: 'AMOXICILLINE',
    dosage: '500 mg',
    frequency: '2 fois par jour',
    confidence: 0.88,
    source: 'ocr',
    matchedLabel: 'AMOXICILLINE 500 mg',
  },
];

// ==========================================
// TESSERACT.JS WORKER (SINGLETON)
// ==========================================

let _worker: Tesseract.Worker | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (_worker) return _worker;

  console.log('🔧 Initialisation de Tesseract.js (langue: fra)...');
  _worker = await createWorker('fra', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        console.log(`📊 OCR: ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  console.log('✅ Tesseract.js initialisé');

  return _worker;
}

// ==========================================
// CONSTANTES POUR LE PARSING
// ==========================================

const DOSAGE_PATTERNS = [
  /(\d+(?:[.,]\d+)?)\s*(mg|g|ml|µg|mcg|ui|%|iu)\b/gi,
  /(\d+)\s*(?:milli|micro)?(?:gramme|litre)s?\b/gi,
];

const FREQUENCY_PATTERNS = [
  /(\d+)\s*(?:fois?|x)\s*(?:par|\/)\s*jour/gi,
  /(?:matin|midi|soir|nuit)/gi,
  /(?:toutes?\s+les?\s+)?(\d+)\s*h(?:eure)?s?/gi,
  /(?:pendant|durant)\s+(\d+)\s*jours?/gi,
];

const PHARMA_KEYWORDS = [
  'comprime', 'comprimes', 'comprimé', 'comprimés',
  'gelule', 'gelules', 'gélule', 'gélules',
  'cachet', 'cachets',
  'sirop', 'sirops',
  'solution', 'solutions',
  'cp', 'cps', 'gel', 'gels',
  'mg', 'g', 'ml', 'µg', 'mcg', 'ui',
  'fois', 'jour', 'matin', 'midi', 'soir', 'heure', 'heures',
];

const STOPWORDS = [
  'DOCTEUR', 'DR', 'MEDECIN', 'PATIENT', 'PATIENTE',
  'PHARMACIE', 'ORDONNANCE', 'RPPS', 'CABINET',
  'BOULEVARD', 'BD', 'AVENUE', 'RUE', 'PLACE',
  'TELEPHONE', 'TEL', 'FAX',
  'ASSURE', 'RCS', 'SECRETARIAT'
];

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

function normalizeText(text: string): string {
  return text
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Enlever accents seulement
}

// Normalisation pour comparaison (écrase espaces)
function normalizeForComparison(text: string): string {
  return normalizeText(text)
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
}

function lineContainsStopword(line: string): boolean {
  const normalized = normalizeForComparison(line);
  return STOPWORDS.some(stopword => normalized.includes(stopword));
}

function hasPharmaContext(text: string): boolean {
  const normalized = normalizeForComparison(text);
  return PHARMA_KEYWORDS.some(keyword =>
      normalized.includes(keyword.toUpperCase())
  );
}

function cleanLineStart(line: string): string {
  return line.replace(/^[\s\-–—•·*]+/, '').trim();
}

function findMedicationNames(text: string): string[] {
  console.log('🔍 Recherche de médicaments dans le texte...');
  console.log('📄 Texte complet:', text.substring(0, 300) + '...');

  // Normaliser SANS écraser les \n
  const normalized = normalizeText(text);

  // Split par lignes
  const rawLines = normalized
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

  console.log(`📋 ${rawLines.length} lignes détectées`);

  const foundMeds: string[] = [];
  const stopwordSet = new Set(STOPWORDS);

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const line = cleanLineStart(rawLine);

    console.log(`\n📝 Ligne ${i + 1}/${rawLines.length}: "${line.substring(0, 60)}${line.length > 60 ? '...' : ''}"`);

    // Rejeter lignes avec stopwords
    if (lineContainsStopword(line)) {
      console.log(`   ❌ Rejetée (stopword)`);
      continue;
    }

    // 1. 🔥 Chercher dans le catalogue complet
    let foundInCatalog = false;
    for (const medName of ALL_MEDICATION_NAMES) {
      // Chercher le nom exact comme mot complet
      const lineNormalized = normalizeForComparison(line);
      const regex = new RegExp(`\\b${medName}\\b`, 'i');

      if (regex.test(lineNormalized)) {
        console.log(`   ✅ TROUVÉ dans catalogue: ${medName}`);
        foundMeds.push(medName);
        foundInCatalog = true;
        break;
      }
    }

    if (foundInCatalog) continue;

    // 2. Chercher avec contexte pharma
    if (hasPharmaContext(line)) {
      console.log(`   💊 Contexte pharma détecté`);

      const lineNormalized = normalizeForComparison(line);
      const words = lineNormalized.split(/\s+/);

      for (let j = 0; j < Math.min(words.length, 3); j++) {
        const word = words[j].replace(/[^\w]/g, '');

        if (word.length < 4) continue;
        if (stopwordSet.has(word)) continue;

        // Vérifier mot simple
        if (ALL_MEDICATION_NAMES.includes(word)) {
          console.log(`   ✅ Validé (1 mot): ${word}`);
          foundMeds.push(word);
          break;
        }

        // Vérifier 2 mots consécutifs
        if (j + 1 < words.length) {
          const twoWords = `${word} ${words[j + 1].replace(/[^\w]/g, '')}`;
          if (ALL_MEDICATION_NAMES.includes(twoWords)) {
            console.log(`   ✅ Validé (2 mots): ${twoWords}`);
            foundMeds.push(twoWords);
            break;
          }
        }
      }

      // Si rien trouvé dans le catalogue mais contexte pharma, garder le premier mot
      if (!foundInCatalog && words.length > 0) {
        const firstWord = words[0].replace(/[^\w]/g, '');
        if (firstWord.length >= 4 && !stopwordSet.has(firstWord)) {
          console.log(`   ⚠️ Candidat hors catalogue: ${firstWord}`);
          foundMeds.push(firstWord);
        }
      }
    } else {
      console.log(`   ⚠️ Pas de contexte pharma`);
    }
  }

  const uniqueMeds = [...new Set(foundMeds)];
  console.log(`\n🎯 RÉSULTAT FINAL: ${uniqueMeds.length} médicaments:`, uniqueMeds);

  return uniqueMeds;
}

function extractDosage(text: string): string | undefined {
  for (const pattern of DOSAGE_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return undefined;
}

function extractFrequency(text: string): string | undefined {
  const frequencies: string[] = [];
  for (const pattern of FREQUENCY_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      frequencies.push(match[0].trim());
    }
  }
  return frequencies.length > 0 ? frequencies[0] : undefined;
}

function parseOCRText(ocrText: string): ExtractedMedication[] {
  console.log('📝 Parsing du texte OCR...');
  console.log('Texte brut:', ocrText.substring(0, 200) + '...');

  const medicationNames = findMedicationNames(ocrText);
  console.log('💊 Médicaments détectés:', medicationNames);

  if (medicationNames.length === 0) {
    console.log('⚠️ Aucun médicament détecté');
    return [];
  }

  const medications: ExtractedMedication[] = [];
  const lines = ocrText.split('\n');

  for (const medName of medicationNames) {
    const relevantLines = lines.filter(line =>
        normalizeForComparison(line).includes(normalizeForComparison(medName))
    );

    const context = relevantLines.join(' ');
    const dosage = extractDosage(context);
    const frequency = extractFrequency(context);

    let confidence = 0.7;
    if (dosage) confidence += 0.2;
    if (frequency) confidence += 0.1;

    medications.push({
      name: medName,
      dosage,
      frequency,
      confidence: Math.min(confidence, 0.99),
      source: 'ocr',
    });
  }

  console.log(`✅ ${medications.length} médicament(s) extrait(s)`);
  return medications;
}

// ==========================================
// CONVERSION IMAGE
// ==========================================

export async function convertToBase64(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    base64: true,
  });
  return `data:image/jpeg;base64,${result.base64}`;
}

// ==========================================
// FONCTION PRINCIPALE
// ==========================================

export async function extractMedicationsFromImage(
    imageUri: string
): Promise<ExtractedMedication[]> {
  const config = getOCRConfig();

  console.log('🎯 Extraction des médicaments');
  console.log('Mode:', config.mockMode ? 'MOCK' : 'RÉEL');

  if (config.mockMode) {
    console.log('📋 Mode Mock');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return MOCK_MEDICATIONS;
  }

  try {
    console.log('🔬 Mode Réel - Tesseract.js');
    const base64Image = await convertToBase64(imageUri);
    const worker = await getWorker();

    console.log('🔍 Reconnaissance...');
    const { data } = await worker.recognize(base64Image);

    console.log('✅ OCR terminé');
    console.log(`📊 Confiance: ${Math.round(data.confidence)}%`);

    const medications = parseOCRText(data.text);

    if (medications.length === 0) {
      console.log('⚠️ Aucun médicament trouvé');
    }

    return medications;

  } catch (error) {
    console.error('❌ Erreur OCR:', error);
    throw new Error(`Échec: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

// ==========================================
// NETTOYAGE
// ==========================================

export async function terminateOCR(): Promise<void> {
  if (_worker) {
    console.log('🔄 Arrêt de Tesseract.js...');
    await _worker.terminate();
    _worker = null;
    console.log('✅ Tesseract.js arrêté');
  }
}