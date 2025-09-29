// frontend/services/barcode-service.ts - ✅ SERVICE BARCODE FONCTIONNEL

export type MedicationFromBarcode = {
  name: string;
  dosage?: string;
  cip13: string;
  confidence: number;
  source: 'barcode';
};

type CatalogEntry = {
  name: string;
  dosage?: string;
  form?: string;
  laboratoire?: string;
  cip13?: string;
  cip13_list?: string[];
};

type Catalog = {
  items: CatalogEntry[];
  indexByName: Record<string, number[]>;
  indexByCip13: Record<string, number>;
};

let medicationCatalog: Catalog | null = null;

/**
 * Charger le catalogue des médicaments
 */
export async function loadMedicationCatalog(): Promise<void> {
  try {
    if (medicationCatalog) return; // Déjà chargé

    medicationCatalog = require('./catalog_meds.json');
    console.log(`✅ Catalogue chargé : ${medicationCatalog?.items?.length || 0} médicaments`);
  } catch (error) {
    console.error('❌ Erreur chargement catalogue:', error);
    // Créer un catalogue vide pour éviter les erreurs
    medicationCatalog = {
      items: [],
      indexByName: {},
      indexByCip13: {},
    };
  }
}

/**
 * Rechercher un médicament par son code CIP13
 */
export async function findMedicationByBarcode(
    barcode: string
): Promise<MedicationFromBarcode | null> {
  try {
    // Charger le catalogue si pas déjà fait
    if (!medicationCatalog) {
      await loadMedicationCatalog();
    }

    // Valider le format CIP13 (13 chiffres)
    if (!isValidCIP13(barcode)) {
      console.warn('⚠️ Format CIP13 invalide:', barcode);
      return null;
    }

    // ✅ CORRECTIF: Rechercher dans l'index CIP13
    if (medicationCatalog && medicationCatalog.indexByCip13) {
      const itemIndex = medicationCatalog.indexByCip13[barcode];

      if (itemIndex !== undefined && medicationCatalog.items[itemIndex]) {
        const item = medicationCatalog.items[itemIndex];

        return {
          name: item.name,
          dosage: item.dosage,
          cip13: barcode,
          confidence: 0.98,
          source: 'barcode',
        };
      }
    }

    console.log(`ℹ️ Médicament non trouvé localement pour CIP13: ${barcode}`);

    // ✅ Si pas trouvé localement, essayer l'API publique
    return await queryOfficialMedicationDatabase(barcode);
  } catch (error) {
    console.error('❌ Erreur recherche médicament:', error);
    return null;
  }
}

/**
 * Interroger la base de données officielle des médicaments
 * (Base Claude Publique des Médicaments - BDPM)
 */
async function queryOfficialMedicationDatabase(
    cip13: string
): Promise<MedicationFromBarcode | null> {
  try {
    console.log(`🌐 Interrogation API officielle pour CIP13: ${cip13}`);

    // ✅ API publique française des médicaments
    // Note: Adaptez l'URL selon l'API disponible
    const response = await fetch(
        `https://api.openmedic.fr/medicaments/${cip13}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
    );

    if (!response.ok) {
      console.warn(`⚠️ Médicament non trouvé dans l'API officielle: ${cip13}`);
      return null;
    }

    const data = await response.json();

    // Parser la réponse de l'API
    return {
      name: data.name || data.denomination || 'Médicament inconnu',
      dosage: data.dosage || extractDosageFromName(data.name || ''),
      cip13,
      confidence: 0.95,
      source: 'barcode',
    };
  } catch (error) {
    console.error('❌ Erreur API BDPM:', error);
    return null;
  }
}

/**
 * Extraire le dosage d'un nom de médicament
 */
function extractDosageFromName(name: string): string | undefined {
  const match = name.match(/(\d+(?:[.,]\d+)?)\s*(mg|g|ml|µg|mcg|ui|%)/i);
  if (match) {
    return `${match[1].replace(',', '.')} ${match[2].toLowerCase()}`;
  }
  return undefined;
}

/**
 * Valider un code-barres avant traitement
 */
export function isValidCIP13(barcode: string): boolean {
  return /^\d{13}$/.test(barcode);
}

/**
 * Exemples de CIP13 pour tests
 */
export const SAMPLE_CIP13 = {
  DOLIPRANE_1000: '3400936195592',
  AMOXICILLINE_500: '3400936000124',
  IBUPROFENE_400: '3400934457845',
};

/**
 * Rechercher un médicament par son nom (pour autocomplete)
 */
export async function searchMedicationByName(query: string, limit = 10): Promise<CatalogEntry[]> {
  try {
    if (!medicationCatalog) {
      await loadMedicationCatalog();
    }

    if (!medicationCatalog || !medicationCatalog.items) {
      return [];
    }

    const queryLower = query.toLowerCase().trim();

    if (queryLower.length < 2) {
      return [];
    }

    // Recherche simple par nom
    const results = medicationCatalog.items.filter(item =>
        item.name.toLowerCase().includes(queryLower)
    );

    return results.slice(0, limit);
  } catch (error) {
    console.error('❌ Erreur recherche par nom:', error);
    return [];
  }
}

/**
 * Vérifier si le catalogue est chargé
 */
export function isCatalogLoaded(): boolean {
  return medicationCatalog !== null && medicationCatalog.items.length > 0;
}

/**
 * Obtenir les statistiques du catalogue
 */
export function getCatalogStats() {
  if (!medicationCatalog) {
    return {
      totalMedications: 0,
      totalCIP13: 0,
    };
  }

  return {
    totalMedications: medicationCatalog.items.length,
    totalCIP13: Object.keys(medicationCatalog.indexByCip13).length,
  };
}