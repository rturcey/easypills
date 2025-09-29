// scripts/build_catalog_from_bdpm.ts
// Construit catalog_meds.json depuis BDPM (CIS + CIS_CIP) et, optionnellement,
// ANMV (médicaments vétérinaires, XML v2 avec GTIN).
//
// Usage recommandé :
//   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/build_catalog_from_bdpm.ts \
//     --out ./services/catalog_meds.json --pretty --vet
//
// Options :
//   --out <path>         chemin de sortie (def: ./catalog_meds.json)
//   --pretty             JSON indenté
//   --timeout <ms>       timeout HTTP (def: 20000)
//   --bdpm <url>         page de téléchargement BDPM (def: https://bdpm.ansm.sante.fr/telechargement)
//   --cis <url>          URL directe du CIS_bdpm.(csv|txt)
//   --ciscip <url>       URL directe du CIS_CIP_bdpm.(csv|txt)
//   --vet                inclut l’ANMV (médicaments vétérinaires)
//   --anmv <url>         URL directe XML ANMV (v2 recommandé)
//   --vetpage <url>      page data.gouv ANMV (def: https://www.data.gouv.fr/datasets/base-de-donnees-publique-des-medicaments-veterinaires-autorises-en-france-1/)
//
// Notes :
// - Nécessite fast-xml-parser (XML ANMV) : npm i fast-xml-parser
// - Les GTIN (ANMV v2) sont fusionnés dans cip13_list quand ils font 13 chiffres.

import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import zlib from "zlib";

type CatalogEntry = {
  name: string;           // UPPERCASE sans accents
  aliases?: string[];
  dosage?: string;
  form?: string;
  laboratoire?: string;
  cip13?: string;
  cip13_list?: string[];
  // Enrichissements vétérinaires :
  isVeterinary?: boolean;
  species?: string[];     // espèces cibles (si trouvées)
  eu_ids?: {              // identifiants UE (si présents dans l'XML v2)
    product_id?: string;
    permanent_id?: string;
    package_ids?: string[];
  };
};
type Catalog = {
  items: CatalogEntry[];
  indexByName: Record<string, number[]>;
  indexByCip13: Record<string, number>; // clé: 13 chiffres (CIP/EAN/GTIN)
};

// ---------- CLI ----------
const args = new Map<string, string | boolean>();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const v =
        process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
            ? process.argv[++i]
            : true;
    args.set(k, v);
  }
}

const OUT_PATH = String(args.get("out") || "catalog_meds.json");
const BDPM_DL_PAGE = String(args.get("bdpm") || "https://bdpm.ansm.sante.fr/telechargement");
const CIS_URL_OVERRIDE = args.get("cis") ? String(args.get("cis")) : null;
const CISCIP_URL_OVERRIDE = args.get("ciscip") ? String(args.get("ciscip")) : null;
const PRETTY = Boolean(args.get("pretty") || false);
const HTTP_TIMEOUT_MS = Number(args.get("timeout") || 20000);

// Vétérinaire (ANMV)
const INCLUDE_VET = Boolean(args.get("vet") || false);
const ANMV_XML_OVERRIDE = args.get("anmv") ? String(args.get("anmv")) : null;
const ANMV_PAGE = String(
    args.get("vetpage") ||
    "https://www.data.gouv.fr/datasets/base-de-donnees-publique-des-medicaments-veterinaires-autorises-en-france-1/"
);

// ---------- utils ----------
function stripDiacritics(s: string) {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}
function canonicalizeName(s: string): string {
  return stripDiacritics(s)
      .replace(/[^\p{L}\s'-]/gu, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .toUpperCase();
}
function normHeader(s: string): string {
  return stripDiacritics(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
}
const DOSAGE_RE = /(\d+(?:[.,]\d+)?)\s*(mg|g|ml|µg|mcg|ui|%)/gi;
function parseMedicationName(full: string): { name: string; dosage?: string } {
  if (!full) return { name: "" };
  const base = full.split(",")[0];
  const nm = canonicalizeName(base.split(/\d/)[0].trim());
  const dosageMatches = [...full.matchAll(DOSAGE_RE)].map(
      (m) => `${m[1]} ${m[2].toLowerCase()}`
  );
  return {
    name: nm || canonicalizeName(base),
    dosage: dosageMatches.length ? dosageMatches.join(" + ") : undefined,
  };
}

async function httpBuffer(url: string): Promise<Buffer> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal } as any);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } finally {
    clearTimeout(id);
  }
}
async function httpText(url: string): Promise<string> {
  const buf = await httpBuffer(url);

  // ZIP (PK) non géré ici (on veut .xml ou .xml.gz)
  if (buf.slice(0,2).toString() === "PK") {
    throw new Error(`Le fichier ${url} est un ZIP. Fournis une URL .xml/.xml.gz via --anmv ou dézippe en amont.`);
  }

  const isGzip = buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
  const raw = isGzip ? zlib.gunzipSync(buf) : buf;

  let txt = raw.toString("utf-8");
  if (/[�]/.test(txt)) txt = raw.toString("latin1");
  txt = txt.replace(/^\ufeff/, "");
  const i = txt.indexOf("<");
  if (i > 0) txt = txt.slice(i);
  return txt;
}

function detectSepFromSample(lines: string[]): string {
  const seps = ["\t", ";", ","];
  const counts: Record<string, number> = { "\t": 0, ";": 0, ",": 0 };
  for (const l of lines) {
    for (const s of seps) counts[s] += l.split(s).length - 1;
  }
  const best = seps.sort((a, b) => counts[b] - counts[a])[0];
  return best || "\t";
}
function stripBOM(s: string): string {
  return s.replace(/^\ufeff/, "");
}
function splitCSVLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === sep && !inQ) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out.map((c) => c.replace(/^"|"$/g, ""));
}
function parseDelimited(content: string): string[][] {
  const data = stripBOM(content);
  const lines = data.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const sep = detectSepFromSample(lines.slice(0, Math.min(20, lines.length)));
  return lines.map((l) => splitCSVLine(l, sep));
}
function onlyDigits(s?: string | null): string | null {
  if (!s) return null;
  const d = String(s).replace(/\D/g, "");
  return d || null;
}
function is13Digits(s?: string | null): s is string {
  return !!s && /^\d{13}$/.test(s);
}

// ---------- 1) Localiser les URLs BDPM ----------
async function findBdpmFiles(pageUrl: string): Promise<{ cisURL: string; ciscipURL: string }> {
  if (CIS_URL_OVERRIDE && CISCIP_URL_OVERRIDE) {
    return { cisURL: CIS_URL_OVERRIDE, ciscipURL: CISCIP_URL_OVERRIDE };
  }
  const html = await httpText(pageUrl);
  const hrefs = Array.from(html.matchAll(/href="([^"]+)"/gi)).map((m) => m[1]);
  const abs = (u: string) => (u.startsWith("http") ? u : new URL(u, pageUrl).toString());
  const cis =
      hrefs.find((h) => /CIS[_-]bdpm\.(csv|txt)$/i.test(h)) ||
      hrefs.find((h) => /CIS[_-]bdpm\.(csv|txt|zip)/i.test(h));
  const ciscip =
      hrefs.find((h) => /CIS[_-]CIP[_-]bdpm\.(csv|txt)$/i.test(h)) ||
      hrefs.find((h) => /CIS[_-]CIP[_-]bdpm\.(csv|txt|zip)/i.test(h));
  if (!cis || !ciscip) {
    throw new Error(
        "Impossible de localiser CIS_bdpm et/ou CIS_CIP_bdpm sur la page BDPM. Utilise --cis et --ciscip pour fournir les URLs directes."
    );
  }
  return { cisURL: abs(cis), ciscipURL: abs(ciscip) };
}

// ---------- 1bis) Localiser l’XML ANMV (data.gouv) ----------
async function sniffText(url: string, maxBytes = 4096): Promise<string> {
  const res = await fetch(url, { method: "GET", headers: { Range: `bytes=0-${maxBytes-1}` } } as any);
  const buf = Buffer.from(await res.arrayBuffer());
  const isGzip = buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
  const raw = isGzip ? zlib.gunzipSync(buf) : buf;
  let txt = raw.toString("utf-8");
  if (/[�]/.test(txt)) txt = raw.toString("latin1");
  txt = txt.replace(/^\ufeff/, "");
  const i = txt.indexOf("<");
  if (i > 0) txt = txt.slice(i);
  return txt;
}

async function findAnmvXml(pageUrl: string): Promise<string> {
  if (ANMV_XML_OVERRIDE) return ANMV_XML_OVERRIDE;

  const html = await httpText(pageUrl);
  const hrefs = Array.from(html.matchAll(/href="([^"]+)"/gi)).map(m => m[1]);
  const abs = (u: string) => (u.startsWith("http") ? u : new URL(u, pageUrl).toString());

  // candidates: API proxies + liens directs
  const candidates = [
    ...hrefs.filter(h => /\/api\/1\/datasets\/r\/[0-9a-f-]+/i.test(h)).map(abs),
    ...hrefs.filter(h => /\.xml(\.gz)?(\?|$)/i.test(h)).map(abs),
  ];
  if (!candidates.length) throw new Error("Aucune ressource .xml/.xml.gz trouvée pour l’ANMV.");

  // Classement initial par extension, puis filtrage par sniff
  const extScore = (fn: string) =>
      /\.xml\.gz$/i.test(fn) ? 0 : /\.xml$/i.test(fn) ? 1 : 2;

  // Sniff: on rejette les XSD (xs:schema) et on favorise les fichiers contenant des balises de données
  const scored: Array<{ url: string; score: number }> = [];
  for (const url of candidates) {
    try {
      const snippet = await sniffText(url, 4096);
      const lower = snippet.toLowerCase();
      if (/<xs:schema\b/i.test(snippet)) continue;             // c’est un schéma XSD → skip
      const hasDataish =
          /<medicinal-product-group\b/i.test(lower) ||
          /<medicinal-product\b/i.test(lower) ||
          /<veterinary.*product\b/i.test(lower);
      const score =
          (hasDataish ? 0 : 1) + // données détectées → mieux
          extScore(url);         // .xml.gz préféré à .xml
      scored.push({ url, score });
    } catch {
      // ignore si erreur
    }
  }

  if (!scored.length) {
    // fallback: premier candidat
    return candidates[0];
  }

  scored.sort((a, b) => a.score - b.score);
  const best = scored[0];
  console.log(`[ANMV] Choix ressource (post-sniff): ${best.url}`);
  return best.url;
}




// ---------- 2) Build catalog BDPM (avec/sans en-têtes) ----------
function findColumn(headRow: string[], aliases: string[]): number {
  const normed = headRow.map(normHeader);
  for (const alias of aliases) {
    const idx = normed.indexOf(alias);
    if (idx >= 0) return idx;
  }
  return -1;
}

// ---------- 3) Parsing ANMV XML (générique v2, robuste aux renommages) ----------
type AnyObject = Record<string, any>;

function collectStringsDeep(v: any): string[] {
  const out: string[] = [];
  const visit = (x: any) => {
    if (x == null) return;
    if (typeof x === "string") out.push(x);
    else if (typeof x === "object") {
      if (typeof x["#text"] === "string") out.push(x["#text"]);
      for (const k of Object.keys(x)) visit(x[k]);
    }
  };
  visit(v);
  return out;
}

function deepFindAll(obj: AnyObject, pred: (k: string, v: any) => boolean, acc: any[] = []): any[] {
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (pred(k, v)) acc.push(v);
      if (v && typeof v === "object") deepFindAll(v as AnyObject, pred, acc);
    }
  }
  return acc;
}

// plus tolérant aux variantes de schéma/namespaces
function extractVetEntriesFromXml(root: AnyObject): CatalogEntry[] {
  const entries: CatalogEntry[] = [];

  // On considère « produit vétérinaire » s’il y a au moins un GTIN ou un identifiant UE dans la sous-arborescence
  const candidateNodes = deepFindAll(root, (k, v) => {
    if (typeof v !== "object") return false;
    const kk = k.toLowerCase();
    if (/product/.test(kk)) return true;
    // parfois les conteneurs ne s'appellent pas "product" → on acceptera plus large et filtrera après
    return false;
  }) as AnyObject[];

  const seen = new Set<string>();

  for (const node of candidateNodes) {
    // Noms possibles
    const nameCandidates =
        collectStringsDeep(
            deepFindAll(node, (k) => /(nom|name|denomination|productname)$/i.test(k))
        )
            .concat(collectStringsDeep((node as any)["name"]))
            .filter(Boolean);

    const rawName = nameCandidates[0];
    if (!rawName) continue;
    const { name, dosage } = parseMedicationName(String(rawName));

    // Titulaire
    const holder =
        collectStringsDeep(deepFindAll(node, (k) => /(holder|titulaire|marketing.*authorisation.*holder)/i.test(k)))[0] ||
        undefined;

    // Espèces
    const speciesArr = collectStringsDeep(deepFindAll(node, (k) => /(species|targetspecies)/i.test(k)))
        .map((s) => canonicalizeName(s))
        .filter(Boolean);
    const species = Array.from(new Set(speciesArr));

    // Identifiants UE
    const product_id =
        collectStringsDeep(deepFindAll(node, (k) => /product.*identifier/i.test(k)))[0] || undefined;
    const permanent_id =
        collectStringsDeep(deepFindAll(node, (k) => /permanent.*identifier/i.test(k)))[0] || undefined;
    const package_ids = Array.from(new Set(
        collectStringsDeep(deepFindAll(node, (k) => /package.*identifier/i.test(k)))
    ));
    const eu_ids = (product_id || permanent_id || package_ids.length)
        ? { product_id, permanent_id, package_ids: package_ids.length ? package_ids : undefined }
        : undefined;

    // GTIN : texte + attributs (@_gtin, @_code, etc.) + chiffres dans libellés
    const gtinCandidates: string[] = [];
    // 1) champs nommés gtin
    deepFindAll(node, (k, v) => {
      if (/gtin/i.test(k)) {
        if (typeof v === "string") gtinCandidates.push(v);
        else if (v && typeof v === "object") {
          if (typeof v["#text"] === "string") gtinCandidates.push(v["#text"]);
          for (const [ak, av] of Object.entries(v)) {
            if (ak.startsWith("@_") && typeof av === "string") gtinCandidates.push(av);
          }
        }
        return true;
      }
      return false;
    });
    // 2) attributs susceptibles de contenir un GTIN
    deepFindAll(node, (_k, v) => {
      if (v && typeof v === "object") {
        for (const [ak, av] of Object.entries(v)) {
          if (ak.startsWith("@_") && typeof av === "string" && /\d{13,14}/.test(av)) gtinCandidates.push(av);
        }
      }
      return false;
    });

    const gtins = Array.from(new Set(
        gtinCandidates
            .map((s) => (s || "").toString())
            .map((s) => s.replace(/\D/g, ""))
            .filter((s) => s.length === 13 || s.length === 14)
    ));
    const cip13_list = gtins.filter((g) => g.length === 13);

    const key = `${name}::${holder || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    entries.push({
      name,
      dosage,
      form: undefined,
      laboratoire: holder,
      cip13: cip13_list[0],
      cip13_list: cip13_list.length ? cip13_list : undefined,
      isVeterinary: true,
      species: species.length ? species : undefined,
      eu_ids,
    });
  }

  return entries;
}

function toArray<T>(x: T | T[] | undefined | null): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

// Construit automatiquement des maps code -> libellé en parcourant tout l’arbre.
// Principe : quand un objet a à la fois "term-xxx" et "lib-xxx", on ajoute pairs[xxx][term] = lib
function buildLabelIndex(root: Record<string, any>) {
  const pairs: Record<string, Record<string, string>> = {};

  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(visit); return; }

    const keys = Object.keys(node);
    // trouve toutes les paires ("term-xxx", "lib-xxx") présentes au même niveau
    const termKeys = keys.filter(k => /^term-[\w-]+$/i.test(k));
    for (const tk of termKeys) {
      const suffix = tk.slice("term-".length); // ex: "tit", "esp", "sa", ...
      const lk = `lib-${suffix}`;
      if (lk in node) {
        const termVal = node[tk];
        const libVal  = node[lk];
        // supporte tableaux et scalaires
        const terms = toArray(termVal).map(v => String(v));
        const libs  = toArray(libVal).map(v => (typeof v === "string" ? v : (v && v["#text"]) || String(v)));
        // zipper en pairs 1-1 quand possible, sinon map chaque term au premier lib non vide
        if (!pairs[suffix]) pairs[suffix] = {};
        if (terms.length && libs.length && terms.length === libs.length) {
          for (let i = 0; i < terms.length; i++) {
            const t = terms[i]; const l = libs[i];
            if (t) pairs[suffix][t] = l;
          }
        } else {
          const l = libs.find(x => !!x) || "";
          for (const t of terms) if (t) pairs[suffix][t] = l;
        }
      }
    }

    // descente récursive
    for (const k of keys) visit(node[k]);
  };

  visit(root);
  return pairs; // ex: pairs["tit"]["294"] => "LABO XXX", pairs["esp"]["22"] => "CANIDAE", ...
}


function extractFromAnmvV1(json: Record<string, any>): CatalogEntry[] {
  const root = json["medicinal-product-group"];
  if (!root) return [];

  const labelIndex = buildLabelIndex(root); // code -> libellé (tit, esp, sa, etc.)
  const prods = toArray(root["medicinal-product"]);
  const out: CatalogEntry[] = [];
  const seen = new Set<string>();

  for (const p of prods) {
    const rawName =
        p?.["nom"] ?? p?.["name"] ?? p?.["denomination"] ?? p?.["productname"];
    if (!rawName) continue;

    const { name, dosage } = parseMedicationName(String(rawName));

    // Titulaire : code dans term-tit → libellé via labelIndex["tit"]
    const titCode = p?.["term-tit"] ? String(p["term-tit"]) : undefined;
    const titulaire =
        (titCode && labelIndex["tit"] && labelIndex["tit"][titCode]) ||
        titCode || undefined;

    // Espèces : codes dans especes/term-esp -> libellés via labelIndex["esp"]
    const espCodes = toArray(p?.["especes"]?.["term-esp"]).map((x) => String(x));
    const espLabels = espCodes
        .map((c) => (labelIndex["esp"] && labelIndex["esp"][c]) || c)
        .filter(Boolean);
    const species = Array.from(new Set(espLabels.map(canonicalizeName)));
    const speciesOut = species.length ? species : undefined;

    // Dédup par (name + titulaire) pour éviter les doublons exacts
    const dedupKey = `${name}::${titulaire || ""}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    out.push({
      name,
      dosage,
      laboratoire: titulaire,
      isVeterinary: true,
      species: speciesOut,
      // v1: pas de GTIN → pas de cip13/cip13_list
    });
  }

  return out;
}



async function parseAnmvXmlToEntries(xmlText: string): Promise<CatalogEntry[]> {
  const { XMLParser } = await import("fast-xml-parser");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
    trimValues: true,
    parseTagValue: true,
    parseAttributeValue: true,
    ignoreDeclaration: true,
  });
  const json = parser.parse(xmlText);

  // 1) tentative générique (v2/vx)
  let list = extractVetEntriesFromXml(json);

  // 2) fallback v1 (ton fichier courant)
  if (list.length === 0) {
    list = extractFromAnmvV1(json);
  }

  if (list.length === 0) {
    console.warn("[ANMV] 0 entrée après v2+v1. Extrait XML (1000 chars):");
    console.warn(xmlText.slice(0, 1000));
  }
  return list;
}




// ---------- MAIN ----------
async function main() {
  // ------------- BDPM (humain) -------------
  console.log(`[BDPM] Recherche des liens...`);
  const { cisURL, ciscipURL } = await findBdpmFiles(BDPM_DL_PAGE);
  console.log(`[BDPM] CIS: ${cisURL}`);
  console.log(`[BDPM] CIS_CIP: ${ciscipURL}`);

  console.log(`[BDPM] Téléchargement CIS...`);
  const cisText = await httpText(cisURL);
  console.log(`[BDPM] Téléchargement CIS_CIP...`);
  const ciscipText = await httpText(ciscipURL);

  console.log(`[BDPM] Parsing...`);
  const cisRows = parseDelimited(cisText);
  const cipRows = parseDelimited(ciscipText);
  if (!cisRows.length) throw new Error("CIS: fichier vide");
  if (!cipRows.length) throw new Error("CIS_CIP: fichier vide");

  // --- Détection "avec en-têtes" vs "sans en-têtes" pour CIS ---
  let iCIS = -1,
      iDen = -1,
      iForme = -1,
      iTit = -1,
      startRowCIS = 1;

  const CIS_ALIASES = {
    codecis: ["codecis", "cis", "codecismedicament", "codecismedicaments", "codeciscode"],
    denomination: [
      "denomination",
      "denominationdumedicament",
      "denominationmedicament",
      "denominationduproduit",
      "denominationdespecialite",
      "denominationdespecialitepharmaceutique",
    ],
    forme: ["formepharmaceutique", "forme", "formepharma"],
    titulaire: ["titulaire", "titulairamm", "titulairedelamm"],
  };

  const firstRow = cisRows[0];
  const firstRowIsData =
      firstRow.every((c) => /^\d+$/.test(c) || c.length === 0) ||
      (firstRow[0] && /^\d+$/.test(firstRow[0]) && firstRow.length >= 3);

  if (!firstRowIsData) {
    iCIS = findColumn(firstRow, CIS_ALIASES.codecis);
    iDen = findColumn(firstRow, CIS_ALIASES.denomination);
    iForme = findColumn(firstRow, CIS_ALIASES.forme);
    iTit = findColumn(firstRow, CIS_ALIASES.titulaire);
  }

  if (iCIS < 0 || iDen < 0) {
    // format "sans en-têtes" BDPM officiel (positions fixes)
    iCIS = 0;
    iDen = 1;
    iForme = 2;
    iTit = 10;
    startRowCIS = 0;
  }

  // --- Pour CIS_CIP (souvent CIP7) ---
  let iCIS2 = -1,
      iCIP13 = -1,
      iCIP7 = -1,
      startRowCIP = 1;

  const cipFirstRow = cipRows[0];
  const cipFirstRowIsData = cipFirstRow[0] && /^\d+$/.test(cipFirstRow[0]);

  if (!cipFirstRowIsData) {
    const CIP_ALIASES = {
      codecis: ["codecis", "cis", "codecismedicament", "codecismedicaments"],
      cip13: ["codecip13", "cip13", "ean13", "ean", "codeean13", "codecic13"],
      cip7: ["codecip7", "cip7", "codecip"],
    };
    iCIS2 = findColumn(cipFirstRow, CIP_ALIASES.codecis);
    iCIP13 = findColumn(cipFirstRow, CIP_ALIASES.cip13);
    iCIP7 = findColumn(cipFirstRow, CIP_ALIASES.cip7);
  }

  if (iCIS2 < 0) {
    iCIS2 = 0;
    iCIP7 = 1;
    startRowCIP = 0;
  }

  // 3.a) map CIS -> infos (name/dosage/form/labo)
  const byCIS = new Map<string, { name: string; dosage?: string; form?: string; titulaire?: string }>();
  for (let i = startRowCIS; i < cisRows.length; i++) {
    const r = cisRows[i];
    const cis = (r[iCIS] || "").trim();
    const denom = (r[iDen] || "").trim();
    if (!cis || !denom) continue;
    const { name, dosage } = parseMedicationName(denom);
    const form = (r[iForme] || "").trim() || undefined;
    const titulaire = (r[iTit] || "").trim() || undefined;
    if (!byCIS.has(cis)) byCIS.set(cis, { name, dosage, form, titulaire });
  }

  // 3.b) map CIS -> CIP13[]
  const cipsByCIS = new Map<string, Set<string>>();
  for (let i = startRowCIP; i < cipRows.length; i++) {
    const r = cipRows[i];
    const cis = (r[iCIS2] || "").trim();
    if (!cis) continue;

    let cip13: string | null = null;
    if (iCIP13 >= 0) {
      const raw = onlyDigits(r[iCIP13]);
      if (is13Digits(raw)) cip13 = raw;
    }
    if (!cipsByCIS.has(cis)) cipsByCIS.set(cis, new Set<string>());
    if (cip13) cipsByCIS.get(cis)!.add(cip13);
  }

  // 3.c) construire les entrées humaines
  const items: CatalogEntry[] = [];
  for (const [cis, info] of byCIS) {
    const set = cipsByCIS.get(cis);
    const cip13_list = set ? Array.from(set) : [];
    items.push({
      name: info.name,
      dosage: info.dosage,
      form: info.form,
      laboratoire: info.titulaire,
      cip13: cip13_list[0],
      cip13_list: cip13_list.length ? cip13_list : undefined,
    });
  }

  // ------------- ANMV (vétérinaire) -------------
  let vetItems: CatalogEntry[] = [];
  if (INCLUDE_VET) {
    try {
      console.log(`[ANMV] Recherche ressource XML...`);
      const anmvXmlUrl = await findAnmvXml(ANMV_PAGE);
      console.log(`[ANMV] Fetching... ${anmvXmlUrl}`);
      const xml = await httpText(anmvXmlUrl);
      console.log(`[ANMV] Taille XML (chars) = ${xml.length}`);
      console.log(`[ANMV] Parsing XML...`);
      const parsed = await parseAnmvXmlToEntries(xml);
      vetItems = parsed;
      console.log(`[ANMV] Médicaments vétérinaires trouvés: ${vetItems.length}`);
    } catch (e) {
      console.warn(`[ANMV] Avertissement: ${e}`);
    }
  }

  // ------------- Fusion & dédup par nom -------------
  const all = [...items, ...vetItems];

  const byName = new Map<string, CatalogEntry>();
  for (const e of all) {
    const key = canonicalizeName(e.name);
    const cur = byName.get(key);
    if (!cur) {
      byName.set(key, { ...e, name: key });
    } else {
      if (!cur.dosage && e.dosage) cur.dosage = e.dosage;
      if (!cur.form && e.form) cur.form = e.form;
      if (!cur.laboratoire && e.laboratoire) cur.laboratoire = e.laboratoire;
      // merge species / eu_ids / flags
      const species = Array.from(new Set([...(cur.species || []), ...(e.species || [])]));
      cur.species = species.length ? species : undefined;
      cur.isVeterinary = cur.isVeterinary || e.isVeterinary || undefined;
      if (e.eu_ids) {
        cur.eu_ids = cur.eu_ids || {};
        if (e.eu_ids.product_id && !cur.eu_ids!.product_id) cur.eu_ids!.product_id = e.eu_ids.product_id;
        if (e.eu_ids.permanent_id && !cur.eu_ids!.permanent_id) cur.eu_ids!.permanent_id = e.eu_ids.permanent_id;
        const pk = Array.from(new Set([...(cur.eu_ids!.package_ids || []), ...(e.eu_ids.package_ids || [])]));
        cur.eu_ids!.package_ids = pk.length ? pk : undefined;
      }
      // merge CIP/GTIN
      const merged = Array.from(new Set([...(cur.cip13_list || []), ...(e.cip13_list || [])]));
      cur.cip13_list = merged.length ? merged : undefined;
      if (!cur.cip13 && cur.cip13_list?.length) cur.cip13 = cur.cip13_list[0];
    }
  }
  const finalItems = Array.from(byName.values());

  // ------------- Index -------------
  const indexByName: Record<string, number[]> = {};
  const indexByCip13: Record<string, number> = {};
  finalItems.forEach((e, i) => {
    const key = canonicalizeName(e.name);
    (indexByName[key] = indexByName[key] || []).push(i);
    (e.cip13_list || []).forEach((c) => {
      if (is13Digits(c)) indexByCip13[c] = i;
    });
  });

  const catalog: Catalog = { items: finalItems, indexByName, indexByCip13 };
  fs.writeFileSync(
      path.resolve(OUT_PATH),
      PRETTY ? JSON.stringify(catalog, null, 2) : JSON.stringify(catalog),
      "utf-8"
  );

  console.log(
      `✅ Catalog écrit : ${path.resolve(OUT_PATH)} (items=${finalItems.length}, vet=${vetItems.length}, humains=${items.length})`
  );
}

main().catch((e) => {
  console.error("❌ Erreur:", e);
  process.exit(1);
});
