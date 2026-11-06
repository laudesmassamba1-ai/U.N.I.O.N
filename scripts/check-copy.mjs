import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function walk(target) {
  const full = path.join(root, target);
  const stat = statSync(full);
  if (stat.isFile()) return [full];
  return readdirSync(full).flatMap((entry) => walk(path.join(target, entry)));
}

const files = [
  ...walk('src/content'),
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
  { label: 'enregistré', pattern: /\benregistré(?:e|s|es)?\b/i },
  { label: 'agréé', pattern: /\bagréé(?:e|s|es)?\b/i },
  { label: 'reconnu', pattern: /\breconnu(?:e|s|es)?\b/i },
  { label: 'loi', pattern: /\bloi\b/i },
  { label: 'don', pattern: /\bdon\b/i },
  { label: 'cotisation en ligne', pattern: /cotisation\s+en\s+ligne/i },
  { label: 'lorem ipsum', pattern: /lorem\s+ipsum/i },
  {
    label: 'construction « Ce n’est pas X, c’est Y »',
    pattern: /ce\s+n['’]est\s+pas[\s\S]{0,120}?c['’]est\b/i,
  },
];

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
  for (const rule of forbidden) {
    const match = content.match(rule.pattern);
    if (!match) continue;
    const line = content.slice(0, match.index).split('\n').length;
    console.error(`${path.relative(root, file)}:${line} : ${rule.label} (« ${match[0].trim()} »)`);
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`\nCopy : ${failures} problème(s) de vocabulaire.`);
  process.exit(1);
}

console.log(`Copy : ${files.length} fichier(s) vérifié(s), aucun terme interdit.`);
