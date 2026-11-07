import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Crée app_public, app_studio et backup_ro, puis écrit les chaînes limitées
 * dans .env.local. Aucun mot de passe n’est affiché, ni dans argv, ni sur disque
 * ailleurs que dans .env.local (ignoré par Git).
 *
 * Prérequis : DATABASE_URL (propriétaire, directe) dans l’environnement.
 */

const root = process.cwd();
const envFile = path.join(root, '.env.local');
const ownerUrl = process.env.DATABASE_URL;

if (!ownerUrl) {
  console.error('DATABASE_URL absente. Rien n’a été modifié.');
  process.exit(1);
}
const connectionPattern = new RegExp('^postgres' + '(?:ql)?' + '://', 'i');
if (!connectionPattern.test(ownerUrl)) {
  console.error('DATABASE_URL doit être une URL de connexion complète.');
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(ownerUrl);
} catch {
  console.error('DATABASE_URL n’est pas une URL valide.');
  process.exit(1);
}
if (!parsed.hostname.endsWith('.neon.tech')) {
  console.warn('Hôte inattendu : la chaîne ne ressemble pas à un projet Neon.');
}

const passwords = {
  app_public: crypto.randomBytes(32).toString('base64url'),
  app_studio: crypto.randomBytes(32).toString('base64url'),
  backup_ro: crypto.randomBytes(32).toString('base64url'),
};

const header = Object.entries(passwords)
  .map(([role, password]) => `\\set ${role}_pw '${password}'`)
  .join('\n');
const body = readFileSync(path.join(root, 'scripts', 'db-roles.sql'), 'utf8');
const result = spawnSync('psql', [ownerUrl, '-v', 'ON_ERROR_STOP=1', '-f', '-'], {
  input: `${header}\n${body}`,
  encoding: 'utf8',
  stdio: ['pipe', 'pipe', 'pipe'],
});

if (result.status !== 0) {
  console.error('Création des rôles refusée par PostgreSQL.');
  console.error(result.stderr.replace(/password\s+'.*?'/gi, "password '<masqué>'"));
  process.exit(1);
}

function roleUrl(role, pooled = true) {
  const url = new URL(ownerUrl);
  url.username = role;
  url.password = passwords[role];
  url.searchParams.set('sslmode', 'require');
  url.searchParams.delete('channel_binding');
  if (pooled && !url.hostname.includes('-pooler')) {
    url.hostname = url.hostname.replace(/^(ep-[^.]+)\./, '$1-pooler.');
  }
  return url.toString();
}

const lines = [
  '# Ajouté par scripts/db-roles.mjs. Ne jamais versionner ce fichier.',
  `DATABASE_URL_APP="${roleUrl('app_public')}"`,
  `DATABASE_URL_STUDIO="${roleUrl('app_studio')}"`,
  '# À recopier dans les secrets GitHub, jamais sur Vercel.',
  `DATABASE_URL_BACKUP_RO="${roleUrl('backup_ro', false)}"`,
  '',
];
const current = existsSync(envFile) ? readFileSync(envFile, 'utf8') : '';
const kept = current
  .split('\n')
  .filter((line) => !/^DATABASE_URL_(APP|STUDIO|BACKUP_RO)=/.test(line))
  .join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .trimEnd();
writeFileSync(envFile, `${kept ? `${kept}\n\n` : ''}${lines.join('\n')}`);
console.log('Rôles créés. DATABASE_URL_APP et DATABASE_URL_STUDIO écrites dans .env.local (valeurs non affichées).');
console.log('Ajouter DATABASE_URL_BACKUP_RO comme secret GitHub.');
