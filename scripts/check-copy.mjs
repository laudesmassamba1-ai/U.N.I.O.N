import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function walk(target) {
  const full = path.join(root, target);
  const stat = statSync(full);
  if (stat.isFile()) return [full];
  return readdirSync(full).flatMap((entry) => walk(path.join(target, entry)));
}

// Exclude internal team notes file from public copy check
const files = [
  ...walk('src/content').filter((f) => !f.endsWith('notes-internes.ts')),
  ...walk('src/pages'),
  ...walk('src/components'),
  path.join(root, 'src/App.tsx'),
  path.join(root, 'index.html'),
  path.join(root, 'metadata.json'),
].filter((file) => /\.(tsx?|html|json)$/.test(file));

const forbidden = [
  { label: 'tiret cadratin', pattern: /—/ },
  { label: 'Découvrir', pattern: /\bdécouvrir\b/i },
  { label: 'En savoir plus', pattern: /en\s+savoir\s+plus/i },
  { label: 'affirmation de statut « enregistré »', pattern: /\b(?:parti|mouvement)\s+enregistré(?:e|s|es)?\b/i },
  { label: 'affirmation de statut « agréé »', pattern: /\bagréé(?:e|s|es)?(?:\s+par)?\b/i },
  { label: 'affirmation de statut « parti reconnu »', pattern: /\b(?:parti|mouvement)\s+reconnu\b/i },
  { label: 'appel de fonds / don', pattern: /\b(?:faire\s+un\s+don|dons?\s+en\s+ligne|appel\s+aux?\s+dons?)\b/i },
  { label: 'cotisation en ligne', pattern: /cotisation\s+en\s+ligne/i },
  { label: 'lorem ipsum', pattern: /lorem\s+ipsum/i },
  {
    label: 'construction « Ce n’est pas X, c’est Y »',
    pattern: /ce\s+n['’]est\s+pas[\s\S]{0,120}?c['’]est\b/i,
  },
  // Notes internes interdites dans les textes publics
  { label: 'note interne « Conseil au bureau »', pattern: /conseil\s+au\s+bureau/i },
  { label: 'note interne « à confirmer par le bureau »', pattern: /à\s+confirmer\s+par\s+le\s+bureau/i },
  { label: 'note interne « valeurs de départ »', pattern: /valeurs\s+de\s+départ/i },
  { label: 'mention d’entreprise privée « Kichub »', pattern: /\bkichub\b/i },
  { label: 'mention « créateur(s) » (construction du site)', pattern: /\bcréateurs?\b/i },
  { label: 'mention « Version sans serveur »', pattern: /version\s+sans\s+serveur/i },
  { label: 'faute « bonni »', pattern: /\bbonni\b/i },
  { label: 'contradiction « validés par les trois »', pattern: /validés?\s+par\s+les\s+trois/i },
];

// Law mentions are checked: allowed only in legal pages with citations
const lawPattern = /\bloi\b/i;

const forbiddenLexicon = JSON.parse(
  readFileSync(path.join(root, 'forbidden-ethnonyms.json'), 'utf8'),
);
for (const term of forbiddenLexicon.ethnonyms) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  forbidden.push({ label: `ethnonyme « ${term} »`, pattern: new RegExp(`\\b${escaped}\\b`, 'i') });
}

let failures = 0;
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const isLegalPage = file.includes('Legal.tsx') || file.includes('mentions-legales');

  for (const rule of forbidden) {
    const match = content.match(rule.pattern);
    if (!match) continue;
    const line = content.slice(0, match.index).split('\n').length;
    console.error(`${path.relative(root, file)}:${line} : ${rule.label} (« ${match[0].trim()} »)`);
    failures += 1;
  }

  // Check law citations outside legal pages
  if (!isLegalPage) {
    const match = content.match(lawPattern);
    if (match) {
      const line = content.slice(0, match.index).split('\n').length;
      console.error(`${path.relative(root, file)}:${line} : citation de loi hors des pages juridiques (« ${match[0].trim()} »)`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`\nCopy : ${failures} problème(s) de vocabulaire.`);
  process.exit(1);
}

console.log(`Copy : ${files.length} fichier(s) vérifié(s), aucun terme interdit.`);
