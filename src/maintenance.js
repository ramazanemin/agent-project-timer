// Explicitly selected projects only; keep original interval rows for auditability.
export function mergeProjects(store, targetId, sourceIds) {
  if (!Array.isArray(sourceIds) || !sourceIds.length || sourceIds.includes(targetId)) {
    throw new Error('Select distinct source and target projects');
  }
  const ids = [...new Set(sourceIds)];
  store.db.exec('BEGIN IMMEDIATE');
  try {
    store.require(targetId);
    for (const id of ids) store.require(id);
    let corrected = 0;
    for (const id of ids) {
      const rows = store.db.prepare('SELECT * FROM intervals WHERE project=? ORDER BY start,id').all(id);
      for (const row of rows) {
        if (row.end !== null) continue;
        const stop = store.db.prepare('SELECT MIN(end) AS time FROM intervals WHERE project=? AND agent=? AND session=? AND end>=?')
          .get(targetId, row.agent, row.session, row.start)?.time;
        if (stop !== null && stop !== undefined) {
          store.db.prepare('UPDATE intervals SET end=? WHERE id=?').run(stop, row.id);
          corrected++;
        } else if (store.db.prepare('SELECT id FROM intervals WHERE project=? AND agent=? AND session=? AND end IS NULL')
          .get(targetId, row.agent, row.session)) {
          store.db.prepare('UPDATE intervals SET end=MAX(start,?) WHERE id=?').run(store.clock(), row.id);
        }
      }
      store.db.prepare('UPDATE intervals SET project=? WHERE project=?').run(targetId, id);
      const source = store.db.prepare('SELECT started FROM projects WHERE id=?').get(id);
      store.db.prepare('UPDATE projects SET started=MIN(started,?) WHERE id=?').run(source.started, targetId);
      store.db.prepare('DELETE FROM projects WHERE id=?').run(id);
    }
    store.db.exec('COMMIT');
    return { targetId, mergedIds: ids, correctedOrphans: corrected };
  } catch (error) {
    store.db.exec('ROLLBACK');
    throw error;
  }
}
