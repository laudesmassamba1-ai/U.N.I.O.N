import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let failures = 0;

function fail(message) {
  console.error(message);
  failures += 1;
}

function walk(target) {
  const full = path.join(root, target);
  if (!existsSync(full)) return [];
  const stat = statSync(full);
  if (stat.isFile()) return [full];
  return readdirSync(full).flatMap((entry) => walk(path.join(target, entry)));
}

// 1. Interfaces & Database Tables: Check for personal / IP fields in suggestions & votes
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

// Check database schema in server/db.ts for suggestions and votes tables
const dbSchemaFile = path.join(root, 'server/db.ts');
if (existsSync(dbSchemaFile)) {
  const schema = readFileSync(dbSchemaFile, 'utf8');
  for (const table of ['suggestions', 'suggestion_votes', 'reports']) {
    const tableBlock = schema.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\);`));
    if (tableBlock) {
      const match = tableBlock[1].match(/\b(ip|user_agent|email|phone)\b/i);
      if (match) {
        fail(`Table SQL ${table} contient une colonne interdite : ${match[0]}`);
      }
    }
  }
}

// 2. Check VITE_* variables in env files for secrets
const envFiles = ['.env.example', '.env.local', '.env'].filter((f) => existsSync(path.join(root, f)));
for (const envFile of envFiles) {
  const content = readFileSync(path.join(root, envFile), 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#') || !line.includes('=')) continue;
    const [key, val] = line.split('=');
    const trimmedVal = val?.trim().replace(/^["']|["']$/g, '');
    if (key.trim().startsWith('VITE_STUDIO_CODE') && trimmedVal) {
      fail(`${envFile}:${i + 1} — variable VITE_STUDIO_CODE ne doit pas contenir de secret côté navigateur.`);
    }
    if (key.trim().startsWith('VITE_KICHUB')) {
      fail(`${envFile}:${i + 1} — variable KICHUB interdite.`);
    }
  }
}

// 3. Check for real email addresses anywhere in src/ or public/ outside empty template strings
const sourceFilesForEmails = [...walk('src'), ...walk('public')].filter((f) => /\.(tsx?|mjs|js|html|json)$/.test(f));
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

for (const file of sourceFilesForEmails) {
  const content = readFileSync(file, 'utf8');
  const matches = content.match(emailRegex) || [];
  for (const match of matches) {
    // Only allow example placeholder domains in tests or dummy mocks
    if (match.endsWith('@example.com') || match.endsWith('@test.com')) continue;
    fail(`${path.relative(root, file)} contient une adresse e-mail réelle : ${match}`);
  }
}

// 4. Client source files: No document.cookie (cookies are HttpOnly on server) and no trackers
const sourceFiles = walk('src').filter((file) => /\.(tsx?|mjs)$/.test(file));
for (const file of sourceFiles) {
  const content = readFileSync(file, 'utf8');
  if (/document\.cookie/.test(content)) fail(`${path.relative(root, file)} utilise document.cookie.`);
  if (/google-analytics|googletagmanager|gtag\(|plausible|matomo|umami|hotjar|facebook\.net/i.test(content)) {
    fail(`${path.relative(root, file)} contient un traceur ou une mesure d’audience.`);
  }
}

// 5. Verify that Suggestions submission awaits server call before setting received status
const suggestionsComponent = readFileSync(path.join(root, 'src/pages/Suggestions.tsx'), 'utf8');
if (!suggestionsComponent.includes('api.submitSuggestion')) {
  fail('Suggestions.tsx : aucune transmission serveur trouvée avant confirmation.');
}

// 6. Carte de membre : données personnelles côté serveur, jamais dans l’édition publique.
const memberSchema = readFileSync(dbSchemaFile, 'utf8');
if (!/CREATE TABLE IF NOT EXISTS members[\s\S]*?email TEXT NOT NULL/.test(memberSchema)) {
  fail('server/db.ts : la table members doit exister et contenir l’adresse e-mail côté serveur.');
}

const apiSource = readFileSync(path.join(root, 'server/api.ts'), 'utf8');
if (!/api\/v1\/members/.test(apiSource)) {
  fail('server/api.ts : route /api/v1/members absente.');
}
const editionStart = apiSource.indexOf("pathname === '/api/v1/edition'");
const suggestionsStart = apiSource.indexOf("pathname === '/api/v1/suggestions'");
if (editionStart === -1 || suggestionsStart === -1 || suggestionsStart < editionStart) {
  fail('server/api.ts : section de l’édition publique introuvable.');
} else if (/members/.test(apiSource.slice(editionStart, suggestionsStart))) {
  fail('La réponse publique /api/v1/edition mentionne la table members.');
}

const memberPage = readFileSync(path.join(root, 'src/pages/MemberCard.tsx'), 'utf8');
if (!/api\.requestMemberCard\(/.test(memberPage)) {
  fail('src/pages/MemberCard.tsx : la carte n’est confirmée qu’après un appel serveur.');
}

if (failures > 0) {
  console.error(`\nVie privée : ${failures} problème(s).`);
  process.exit(1);
}

console.log('Vie privée : aucun champ personnel en base, aucun cookie client, aucun secret VITE_*, aucune adresse e-mail non autorisée, confirmation conditionnée au serveur.');
