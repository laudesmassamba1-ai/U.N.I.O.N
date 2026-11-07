import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const SELF = 'scripts/check-secrets.mjs';
let failures = 0;

function fail(message) {
  console.error(message);
  failures += 1;
}

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'buffer' })
      .toString('utf8')
      .split('\0')
      .filter(Boolean);
  } catch {
    return [];
  }
}

function walk(target) {
  const full = path.join(root, target);
  if (!existsSync(full)) return [];
  const stat = statSync(full);
  if (stat.isFile()) return [path.relative(root, full)];
  return readdirSync(full).flatMap((entry) => walk(path.join(target, entry)));
}

function isText(file) {
  try {
    const buffer = readFileSync(path.join(root, file));
    if (buffer.length > 2 * 1024 * 1024) return false;
    const sample = buffer.subarray(0, 4096);
    return !sample.includes(0);
  } catch {
    return false;
  }
}

// Les motifs sont assemblés pour que ce fichier ne se détecte pas lui-même.
const CONNECTION = 'postgres' + '(?:ql)?' + '://';
const patterns = [
  { label: 'chaîne de connexion PostgreSQL', pattern: new RegExp(CONNECTION) },
  { label: 'clé Neon', pattern: /npg_[A-Za-z0-9]{12,}/ },
  { label: 'clé age privée', pattern: /AGE-SECRET-KEY-1[A-Z0-9]{20,}/ },
  { label: 'clé privée PEM', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: 'clé de service', pattern: /sk_(?:live|test)_[A-Za-z0-9]{16,}/ },
];

const files = [...new Set([...trackedFiles(), ...walk('dist')])].filter(
  (file) => file !== SELF && isText(file),
);

for (const file of files) {
  const content = readFileSync(path.join(root, file), 'utf8');
  for (const rule of patterns) {
    const match = content.match(rule.pattern);
    if (match) {
      const line = content.slice(0, match.index).split('\n').length;
      fail(`${file}:${line} : ${rule.label} détectée.`);
    }
  }
}

// Une variable VITE_ ne doit jamais porter un nom de secret.
const vitePattern = /\bVITE_[A-Z0-9_]*(?:SECRET|PASSWORD|TOKEN|KEY|DATABASE)[A-Z0-9_]*\s*=/;
for (const file of files) {
  const content = readFileSync(path.join(root, file), 'utf8');
  const match = content.match(vitePattern);
  if (match) {
    fail(`${file} : variable publique interdite (${match[0].replace(/\s*=$/, '')}).`);
  }
}

// Rappel de rotation du mot de passe propriétaire.
const localEnv = path.join(root, '.env.local');
let rotated = false;
if (existsSync(localEnv)) {
  const content = readFileSync(localEnv, 'utf8');
  rotated = /^OWNER_PASSWORD_ROTATED=true$/m.test(content);
}
if (!rotated) {
  console.warn(
    'Rappel : changer le mot de passe de neondb_owner avant la mise en ligne, puis poser OWNER_PASSWORD_ROTATED=true dans .env.local.',
  );
}

if (failures > 0) {
  console.error(`Secrets : ${failures} problème(s).`);
  process.exit(1);
}

console.log(
  `Secrets : ${files.length} fichier(s) vérifié(s), aucune chaîne de connexion ni clé privée, aucune variable VITE_ sensible.`,
);
