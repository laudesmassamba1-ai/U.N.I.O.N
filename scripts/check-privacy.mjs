import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let failures = 0;

function fail(message) {
  console.error(message);
  failures += 1;
}

function walk(target) {
  const full = path.join(root, target);
  const stat = statSync(full);
  if (stat.isFile()) return [full];
  return readdirSync(full).flatMap((entry) => walk(path.join(target, entry)));
}

const types = readFileSync(path.join(root, 'src/types.ts'), 'utf8');
const personalFields = /^\s*(email|e-mail|courriel|phone|telephone|téléphone|ip|ipaddress|useragent|name|nom|prenom|prénom|address|adresse|whatsapp)\??\s*:/gim;

for (const typeName of ['Suggestion', 'SuggestionVote', 'SuggestionReport']) {
  const block = types.match(new RegExp(`export interface ${typeName} \\{([\\s\\S]*?)\\n\\}`));
  if (!block) {
    fail(`Interface ${typeName} introuvable dans src/types.ts.`);
    continue;
  }
  const field = block[1].match(personalFields);
  if (field) fail(`Interface ${typeName} contient un champ personnel : ${field[0].trim()}`);
}

const sourceFiles = walk('src').filter((file) => /\.(tsx?|mjs)$/.test(file));
for (const file of sourceFiles) {
  const content = readFileSync(file, 'utf8');
  if (/document\.cookie/.test(content)) fail(`${path.relative(root, file)} utilise document.cookie.`);
  if (/google-analytics|googletagmanager|gtag\(|plausible|matomo|umami|hotjar|facebook\.net/i.test(content)) {
    fail(`${path.relative(root, file)} contient un traceur ou une mesure d’audience.`);
  }
}

const content = readFileSync(path.join(root, 'src/content/fr.ts'), 'utf8');
if (!/stockage local/i.test(content)) fail('La page Vie privée ne mentionne pas le stockage local.');
if (!/serveur/i.test(content)) fail('La page Vie privée ne mentionne pas le stockage serveur en production.');

if (failures > 0) {
  console.error(`\nVie privée : ${failures} problème(s).`);
  process.exit(1);
}

console.log('Vie privée : aucun champ personnel, aucun cookie, aucun traceur ; divulgation présente.');
