import { AwsClient } from 'aws4fetch';

export interface ObjectStoreEnv {
  OBJECT_STORE_ENDPOINT?: string;
  OBJECT_STORE_BUCKET?: string;
  OBJECT_STORE_ACCESS_KEY_ID?: string;
  OBJECT_STORE_SECRET_ACCESS_KEY?: string;
}

export interface ObjectStore {
  put(key: string, body: string, contentType?: string): Promise<void>;
}

/**
 * Écriture serveur dans le seau public R2. Le seau reste privé au niveau S3 :
 * l’accès public est accordé par le domaine personnalisé ou r2.dev côté R2.
 */
export function createObjectStore(env: ObjectStoreEnv = process.env): ObjectStore | null {
  const endpoint = env.OBJECT_STORE_ENDPOINT?.replace(/\/$/, '');
  const bucket = env.OBJECT_STORE_BUCKET;
  const accessKeyId = env.OBJECT_STORE_ACCESS_KEY_ID;
  const secretAccessKey = env.OBJECT_STORE_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;

  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: 's3',
    region: 'auto',
  });

  return {
    async put(key, body, contentType = 'application/octet-stream') {
      const encodedKey = key.split('/').map(encodeURIComponent).join('/');
      const response = await client.fetch(`${endpoint}/${bucket}/${encodedKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body,
      });
      if (!response.ok) {
        throw new Error(`Écriture R2 refusée (${response.status}).`);
      }
    },
  };
}
