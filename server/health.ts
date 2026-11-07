/**
 * Budget de stockage et fraîcheur des sauvegardes. Le rapport est calculé sans
 * toucher à la base : l’appelant fournit la taille et la dernière sauvegarde
 * lorsqu’il les connaît.
 */

export const DB_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;

export type HealthAlertLevel = 'info' | 'warn' | 'critical';

export interface HealthAlert {
  level: HealthAlertLevel;
  code: string;
  message: string;
}

export interface HealthInput {
  dbSizeBytes: number | null;
  snapshotUpdatedAt: string | null;
  backupAt: string | null;
  backupSizeBytes?: number | null;
  now?: number;
}

export interface HealthReport {
  storage: {
    sizeBytes: number | null;
    limitBytes: number;
    usedPercent: number | null;
  };
  snapshot: { updatedAt: string | null; ageSeconds: number | null };
  backup: { at: string | null; ageDays: number | null; sizeBytes: number | null };
  alerts: HealthAlert[];
  /** Blocage doux : le Studio propose de nettoyer avant d’accepter du contenu. */
  writesBlocked: boolean;
}

function ageSeconds(iso: string | null, now: number): number | null {
  if (!iso) return null;
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round((now - parsed) / 1000));
}

export function buildHealthReport(input: HealthInput): HealthReport {
  const now = input.now ?? Date.now();
  const size = input.dbSizeBytes;
  const usedPercent =
    typeof size === 'number' ? Math.round((size / DB_STORAGE_LIMIT_BYTES) * 1000) / 10 : null;
  const snapshotAge = ageSeconds(input.snapshotUpdatedAt, now);
  const backupAge = ageSeconds(input.backupAt, now);
  const backupAgeDays = backupAge === null ? null : Math.round((backupAge / 86400) * 10) / 10;
  const alerts: HealthAlert[] = [];
  let writesBlocked = false;

  if (usedPercent !== null) {
    if (usedPercent >= 95) {
      writesBlocked = true;
      alerts.push({
        level: 'critical',
        code: 'storage_full',
        message: 'Stockage à 95 % : nettoyez les révisions et les images avant de publier.',
      });
    } else if (usedPercent >= 85) {
      alerts.push({
        level: 'critical',
        code: 'storage_pressure',
        message: 'Stockage à 85 % : purgez les archives et les anciennes révisions.',
      });
    } else if (usedPercent >= 70) {
      alerts.push({
        level: 'warn',
        code: 'storage_watch',
        message: 'Stockage à 70 % : surveillez les révisions et les images.',
      });
    }
  }

  if (snapshotAge === null) {
    alerts.push({
      level: 'warn',
      code: 'snapshot_missing',
      message: 'Aucun instantané public en mémoire : la prochaine lecture le reconstruira.',
    });
  } else if (snapshotAge > 86400) {
    alerts.push({
      level: 'warn',
      code: 'snapshot_stale',
      message: 'L’instantané public date de plus de 24 heures.',
    });
  }

  if (backupAgeDays === null) {
    alerts.push({
      level: 'critical',
      code: 'backup_missing',
      message: 'Aucune sauvegarde enregistrée : lancez le workflow de sauvegarde.',
    });
  } else if (backupAgeDays > 10) {
    alerts.push({
      level: 'critical',
      code: 'backup_stale',
      message: 'La dernière sauvegarde a plus de dix jours.',
    });
  }

  return {
    storage: { sizeBytes: size, limitBytes: DB_STORAGE_LIMIT_BYTES, usedPercent },
    snapshot: { updatedAt: input.snapshotUpdatedAt, ageSeconds: snapshotAge },
    backup: {
      at: input.backupAt,
      ageDays: backupAgeDays,
      sizeBytes: input.backupSizeBytes ?? null,
    },
    alerts,
    writesBlocked,
  };
}
