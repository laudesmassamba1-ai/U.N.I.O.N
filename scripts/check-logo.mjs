import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const copies = ['assets/logo-union.jpg', 'public/assets/logo-union.jpg'];

let failures = 0;

function fail(message) {
  console.error(message);
  failures += 1;
}

function hash(file) {
  return createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex');
}

for (const file of copies) {
  if (!existsSync(path.join(root, file))) fail(`Logo manquant : ${file}`);
}

if (copies.every((file) => existsSync(path.join(root, file)))) {
  const [a, b] = copies.map(hash);
  if (a !== b) fail('Les deux copies du logo ne sont pas identiques.');
  else console.log(`Logo : copies identiques (${a.slice(0, 16)}…).`);
}

function walk(target) {
  const full = path.join(root, target);
  const stat = statSync(full);
  if (stat.isFile()) return [full];
  return readdirSync(full).flatMap((entry) => walk(path.join(target, entry)));
}

const sourceFiles = [...walk('src'), path.join(root, 'index.html')].filter((file) =>
  /\.(tsx?|html)$/.test(file),
);

const imageReferences = [];
for (const file of sourceFiles) {
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(/logo[-_][\w.-]*\.(?:jpg|jpeg|png|webp)/gi)) {
    imageReferences.push({
      file: path.relative(root, file),
      reference: match[0].toLowerCase(),
    });
  }
}

for (const { file, reference } of imageReferences) {
  if (reference !== 'logo-union.jpg') {
    fail(`${file} référence une variante de logo non autorisée : ${reference}`);
  }
}

const logoComponent = readFileSync(path.join(root, 'src/components/Logo.tsx'), 'utf8');
if (!logoComponent.includes('/assets/logo-union.jpg')) {
  fail('src/components/Logo.tsx ne pointe pas vers /assets/logo-union.jpg.');
}
if (!/<img/.test(logoComponent)) {
  fail('src/components/Logo.tsx doit rendre le logo avec une balise img.');
}

if (failures > 0) {
  console.error(`\nLogo : ${failures} problème(s).`);
  process.exit(1);
}

console.log('Logo : rendu uniquement par Logo.tsx, aucune variante non autorisée.');
