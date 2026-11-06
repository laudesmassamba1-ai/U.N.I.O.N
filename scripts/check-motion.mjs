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

const css = readFileSync(path.join(root, 'src/index.css'), 'utf8');
if (!/@media \(prefers-reduced-motion: reduce\)/.test(css)) {
  fail('src/index.css ne contient pas de règle prefers-reduced-motion.');
}
if (!/\.reduce-motion/.test(css) || !/\.data-saver/.test(css)) {
  fail('src/index.css ne couvre pas les modes reduce-motion et data-saver.');
}

const hooks = readFileSync(path.join(root, 'src/lib/hooks.ts'), 'utf8');
if (!/prefers-reduced-motion/.test(hooks)) fail('hooks.ts ne détecte pas prefers-reduced-motion.');
if (!/motionAllowed/.test(hooks)) fail('hooks.ts n’expose pas motionAllowed.');

const sourceFiles = walk('src').filter((file) => /\.(tsx?|mjs)$/.test(file));
for (const file of sourceFiles) {
  const content = readFileSync(file, 'utf8');
  if (/addEventListener\(['"]wheel['"]|addEventListener\(['"]touchmove['"]/.test(content)) {
    fail(`${path.relative(root, file)} intercepte le défilement natif.`);
  }
  if (/onWheel=|onTouchMove=/.test(content)) {
    fail(`${path.relative(root, file)} utilise un gestionnaire de défilement personnalisé.`);
  }
}

const opening = readFileSync(path.join(root, 'src/components/Opening.tsx'), 'utf8');
const duration = opening.match(/setTimeout\([\s\S]*?,\s*(\d+)\s*\)/);
if (!duration) fail('Opening.tsx ne déclare pas de durée d’ouverture.');
else if (Number(duration[1]) > 2700) fail(`Ouverture trop longue : ${duration[1]} ms (maximum 2700 ms).`);
if (!/Passer/.test(opening)) fail('L’ouverture ne propose pas de bouton pour la passer.');

if (failures > 0) {
  console.error(`\nMouvement : ${failures} problème(s).`);
  process.exit(1);
}

console.log('Mouvement : réduction, économie de données, ouverture passable et défilement natif vérifiés.');
