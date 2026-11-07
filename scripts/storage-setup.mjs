import { AwsClient } from 'aws4fetch';

/**
 * Crée les deux seaux R2 via l’API S3.
 *
 *   pnpm storage:setup --confirm
 *
 * Prérequis dans .env.local :
 *   OBJECT_STORE_ENDPOINT=https://<compte>.r2.cloudflarestorage.com
 *   OBJECT_STORE_ACCESS_KEY_ID=...
 *   OBJECT_STORE_SECRET_ACCESS_KEY=...
 *   OBJECT_STORE_BUCKET=union-public
 *   BACKUP_S3_BUCKET=union-backups
 *
 * Aucun secret n’est affiché. L’accès public du seau public se règle ensuite
 * dans la console R2 (domaine personnalisé recommandé, ou r2.dev).
 */
if (!process.argv.includes('--confirm')) {
  console.error('Refusé : ajoutez --confirm pour créer les seaux.');
  process.exit(1);
}

const endpoint = process.env.OBJECT_STORE_ENDPOINT?.replace(/\/$/, '');
const accessKeyId = process.env.OBJECT_STORE_ACCESS_KEY_ID;
const secretAccessKey = process.env.OBJECT_STORE_SECRET_ACCESS_KEY;
const publicBucket = process.env.OBJECT_STORE_BUCKET || 'union-public';
const privateBucket = process.env.BACKUP_S3_BUCKET || 'union-backups';

const missing = [
  ['OBJECT_STORE_ENDPOINT', endpoint],
  ['OBJECT_STORE_ACCESS_KEY_ID', accessKeyId],
  ['OBJECT_STORE_SECRET_ACCESS_KEY', secretAccessKey],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length > 0) {
  console.error(`Variables absentes : ${missing.join(', ')}. Rien n’a été créé.`);
  process.exit(1);
}

const client = new AwsClient({
  accessKeyId,
  secretAccessKey,
  service: 's3',
  region: 'auto',
});

async function createBucket(bucket) {
  const response = await client.fetch(`${endpoint}/${bucket}`, { method: 'PUT' });
  if (response.ok) return 'créé';
  if (response.status === 409) return 'déjà présent';
  const body = await response.text();
  throw new Error(`${bucket} : création refusée (${response.status}) ${body.slice(0, 120)}`);
}

const publicState = await createBucket(publicBucket);
const privateState = await createBucket(privateBucket);

console.log(`Seau public ${publicBucket} : ${publicState}.`);
console.log(`Seau privé ${privateBucket} : ${privateState}.`);
console.log('R2 : activer l’accès public du seau public (domaine personnalisé recommandé), puis renseigner OBJECT_STORE_PUBLIC_URL et SNAPSHOT_URL.');
