import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const css = readFileSync(path.join(root, 'src/index.css'), 'utf8');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
let failures = 0;

function fail(message) {
  console.error(message);
  failures += 1;
}

const tokens = {
  '--ink': '#0b0b0b',
  '--paper': '#ffffff',
  '--green': '#328445',
  '--yellow': '#f0d33a',
  '--red': '#bc2425',
};

for (const [name, value] of Object.entries(tokens)) {
  const pattern = new RegExp(`${name}:\\s*${value}\\s*;`, 'i');
  if (!pattern.test(css)) fail(`Jeton de couleur manquant ou modifié : ${name} ${value}.`);
}

if (/box-shadow\s*:/i.test(css)) fail('src/index.css utilise une ombre (box-shadow).');
if (/(?:linear|radial|conic)-gradient\(/i.test(css)) fail('src/index.css utilise un dégradé.');
if (/backdrop-filter\s*:/i.test(css)) fail('src/index.css utilise backdrop-filter.');

const radii = [...css.matchAll(/border-radius\s*:\s*([^;]+);/gi)].map((match) =>
  match[1].trim().toLowerCase(),
);
for (const radius of radii) {
  if (!['0', '0px', '50%'].includes(radius)) fail(`Rayon non autorisé : ${radius}.`);
}

if (!/Bitter/.test(css) || !/Public Sans/.test(css)) {
  fail('Les typographies Bitter et Public Sans ne sont pas déclarées dans src/index.css.');
}
if (!/Bitter/.test(html) || !/Public(?:\+|%20| )Sans/.test(html)) {
  fail('index.html ne charge pas Bitter et Public Sans.');
}

if (failures > 0) {
  console.error(`\nDesign : ${failures} problème(s).`);
  process.exit(1);
}

console.log('Design : palette, typographies, angles et absence d’effets décoratifs vérifiés.');
