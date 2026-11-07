import { put } from '@vercel/blob';
import crypto from 'node:crypto';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface MemberDocumentsEnv {
  BLOB_PUBLIC_READ_WRITE_TOKEN?: string;
  BLOB_READ_WRITE_TOKEN?: string;
  BLOB_PRIVATE_READ_WRITE_TOKEN?: string;
  SELFIE_BLOB_BASE_URL?: string;
  PUBLIC_BLOB_BASE_URL?: string;
}

export interface StoredDocument {
  path: string;
  url: string | null;
  contentType: string;
}

function publicToken(env: MemberDocumentsEnv): string | undefined {
  return env.BLOB_PUBLIC_READ_WRITE_TOKEN || env.BLOB_READ_WRITE_TOKEN;
}

function privateToken(env: MemberDocumentsEnv): string | undefined {
  return env.BLOB_PRIVATE_READ_WRITE_TOKEN;
}

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function isImageContentType(value: string): boolean {
  return ACCEPTED_IMAGE_TYPES.has(value.toLowerCase());
}

export function describeImageError(reason: string): string {
  return `Document non valide : ${reason}`;
}

/** Titre de fichier sûr pour le stockage. */
function safeDocumentKey(prefix: string, suffix: string, maxLength = 64): string {
  const safe = suffix.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, maxLength);
  return `${prefix}/${crypto
    .createHash('sha256')
    .update(safe + crypto.randomUUID())
    .digest('hex')
    .slice(0, 16)}.bin`;
}

export interface MemberDocuments {
  /** Chemin de stockage du selfie (public). */
  selfie: StoredDocument | null;
  /** Chemin de stockage de la pièce d'identité (privé). */
  identity: StoredDocument | null;
}

export async function storeMemberDocuments(
  env: MemberDocumentsEnv = process.env,
  inputs: {
    selfie?: File | null;
    identity?: File | null;
  },
  now: Date = new Date(),
): Promise<MemberDocuments> {
  const selfie = inputs.selfie ?? null;
  const identity = inputs.identity ?? null;
  const datePrefix = now.toISOString().slice(0, 10);

  const selfieStored: StoredDocument | null = selfie && selfie.size > 0
    ? await storePublicImage(env, 'selfie', datePrefix, selfie)
    : null;

  const identityStored: StoredDocument | null = identity && identity.size > 0
    ? await storePrivateImage(env, 'identity', datePrefix, identity)
    : null;

  return { selfie: selfieStored, identity: identityStored };
}

async function storePublicImage(
  env: MemberDocumentsEnv,
  folder: 'selfie',
  datePrefix: string,
  file: File,
): Promise<StoredDocument> {
  if (!isImageContentType(file.type)) {
    throw new Error(describeImageError(`type non accepté (${file.type || 'inconnu'}). Les formats acceptés sont JPEG, PNG et WebP.`));
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(describeImageError('le fichier dépasse 5 Mo.'));
  }

  const token = publicToken(env);
  if (!token) {
    throw new Error('Token de stockage public absent.');
  }

  const key = safeDocumentKey(`documents/${folder}/${datePrefix}`, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  await put(key, buffer, {
    access: 'public',
    token,
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: file.type,
    cacheControlMaxAge: 60,
  });

  const baseUrl = process.env.SELFIE_BLOB_BASE_URL?.trim() || process.env.PUBLIC_BLOB_BASE_URL?.trim() || '';
  return {
    path: key,
    url: baseUrl ? `${baseUrl}/${key}` : null,
    contentType: file.type,
  };
}

async function storePrivateImage(
  env: MemberDocumentsEnv,
  folder: 'identity',
  datePrefix: string,
  file: File,
): Promise<StoredDocument> {
  if (!isImageContentType(file.type)) {
    throw new Error(describeImageError(`type non accepté (${file.type || 'inconnu'}). Les formats acceptés sont JPEG, PNG et WebP.`));
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(describeImageError('le fichier dépasse 5 Mo.'));
  }

  const token = privateToken(env);
  if (!token) {
    throw new Error('Token de stockage privé absent.');
  }

  const key = safeDocumentKey(`documents/${folder}/${datePrefix}`, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  await put(key, buffer, {
    access: 'private',
    token,
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: file.type,
    cacheControlMaxAge: 60,
  });

  return {
    path: key,
    url: null,
    contentType: file.type,
  };
}
