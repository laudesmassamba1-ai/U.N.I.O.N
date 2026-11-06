import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const target = path.join(root, 'public/data/edition.json');
const formats = new Set(['union-edition', 'union-backup']);

function fail(message) {
  console.error(`Édition : ${message}`);
  process.exit(1);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validate(document, file) {
  if (!isRecord(document)) fail(`${file} ne contient pas un objet JSON.`);
  if (!formats.has(document.format)) {
    fail(`${file} : format inconnu. Attendu : union-edition ou union-backup.`);
  }
  if (document.version !== 1) fail(`${file} : version attendue 1.`);
  if (!Number.isFinite(document.revision) || document.revision < 0) {
    fail(`${file} : révision invalide.`);
  }
  if (typeof document.updatedAt !== 'string') fail(`${file} : date de mise à jour manquante.`);
  for (const key of ['articles', 'suggestions', 'votes', 'reports', 'audit']) {
    if (!Array.isArray(document[key])) fail(`${file} : tableau « ${key} » manquant.`);
  }
  if (!isRecord(document.settings)) fail(`${file} : réglages manquants.`);
  document.articles.forEach((article, index) => {
    if (!isRecord(article) || typeof article.id !== 'string' || !article.id) {
      fail(`${file} : article ${index + 1} sans identifiant.`);
    }
    if (!Array.isArray(article.body)) fail(`${file} : article ${index + 1} sans corps.`);
    if (!['draft', 'published', 'archived'].includes(article.status)) {
      fail(`${file} : article ${index + 1} avec statut inconnu.`);
    }
  });
  document.suggestions.forEach((suggestion, index) => {
    if (!isRecord(suggestion) || typeof suggestion.id !== 'string' || !suggestion.id) {
      fail(`${file} : suggestion ${index + 1} sans identifiant.`);
    }
    if (typeof suggestion.text !== 'string' || !suggestion.text.trim()) {
      fail(`${file} : suggestion ${index + 1} sans texte.`);
    }
  });
}

function read(file) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    fail(`fichier introuvable : ${file}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail(`JSON invalide : ${file}`);
  }
  validate(parsed, file);
  return parsed;
}

function summary(document) {
  const lines = [
    `format : ${document.format}`,
    `révision : ${document.revision}`,
    `mise à jour : ${document.updatedAt}`,
    `articles : ${document.articles.length}`,
    `suggestions : ${document.suggestions.length}`,
  ];
  return lines.join('\n');
}

const command = process.argv[2] ?? 'check';
const input = process.argv[3];

if (command === 'check') {
  const file = input ? path.resolve(root, input) : target;
  const document = read(file);
  console.log(`Édition valide : ${path.relative(root, file)}`);
  console.log(summary(document));
  process.exit(0);
}

if (command === 'publish') {
  if (!input) fail('usage : pnpm edition:publish <fichier.json>');
  const file = path.resolve(root, input);
  const document = read(file);
  const force = process.argv.includes('--force');
  if (document.format === 'union-backup' && !force) {
    fail(
      'une sauvegarde complète contient les brouillons et le journal d’audit. Utilisez une édition publique, ou ajoutez --force.',
    );
  }
  let currentRevision = 0;
  try {
    const current = read(target);
    currentRevision = current.revision;
  } catch {
    currentRevision = 0;
  }
  const next = {
    ...document,
    revision: Math.max(document.revision, currentRevision + 1),
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(target, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Édition publiée dans ${path.relative(root, target)}`);
  console.log(summary(next));
  console.log('Redéployez le site ou remplacez le fichier sur l’hébergement.');
  process.exit(0);
}

fail(`commande inconnue : ${command}. Commandes : check, publish.`);
