import { describe, expect, it } from 'vitest';
import { DB_STORAGE_LIMIT_BYTES, buildHealthReport } from '../server/health';

const now = Date.parse('2026-11-07T12:00:00.000Z');

describe('santé de la base', () => {
  it('n’alerte pas sous 70 %', () => {
    const report = buildHealthReport({
      dbSizeBytes: DB_STORAGE_LIMIT_BYTES * 0.5,
      snapshotUpdatedAt: '2026-11-07T11:55:00.000Z',
      backupAt: '2026-11-06T03:15:00.000Z',
      now,
    });
    expect(report.storage.usedPercent).toBe(50);
    expect(report.alerts).toEqual([]);
    expect(report.writesBlocked).toBe(false);
  });

  it('alerte à 70 %, puis à 85 %', () => {
    const watch = buildHealthReport({
      dbSizeBytes: DB_STORAGE_LIMIT_BYTES * 0.71,
      snapshotUpdatedAt: '2026-11-07T11:55:00.000Z',
      backupAt: '2026-11-06T03:15:00.000Z',
      now,
    });
    expect(watch.alerts.map((alert) => alert.code)).toContain('storage_watch');
    expect(watch.alerts[0]?.level).toBe('warn');

    const pressure = buildHealthReport({
      dbSizeBytes: DB_STORAGE_LIMIT_BYTES * 0.86,
      snapshotUpdatedAt: '2026-11-07T11:55:00.000Z',
      backupAt: '2026-11-06T03:15:00.000Z',
      now,
    });
    expect(pressure.alerts.map((alert) => alert.code)).toContain('storage_pressure');
  });

  it('bloque doucement les écritures à 95 %', () => {
    const report = buildHealthReport({
      dbSizeBytes: DB_STORAGE_LIMIT_BYTES * 0.96,
      snapshotUpdatedAt: '2026-11-07T11:55:00.000Z',
      backupAt: '2026-11-06T03:15:00.000Z',
      now,
    });
    expect(report.writesBlocked).toBe(true);
    expect(report.alerts.map((alert) => alert.code)).toContain('storage_full');
  });

  it('signale une sauvegarde absente ou de plus de dix jours', () => {
    const missing = buildHealthReport({
      dbSizeBytes: 1024,
      snapshotUpdatedAt: null,
      backupAt: null,
      now,
    });
    expect(missing.alerts.map((alert) => alert.code)).toContain('backup_missing');
    expect(missing.alerts.find((alert) => alert.code === 'backup_missing')?.level).toBe(
      'critical',
    );
    expect(missing.alerts.map((alert) => alert.code)).toContain('snapshot_missing');

    const stale = buildHealthReport({
      dbSizeBytes: 1024,
      snapshotUpdatedAt: '2026-11-07T11:55:00.000Z',
      backupAt: '2026-10-20T03:15:00.000Z',
      now,
    });
    expect(stale.backup.ageDays).toBe(18.4);
    expect(stale.alerts.map((alert) => alert.code)).toContain('backup_stale');
  });
});
