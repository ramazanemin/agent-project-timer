import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';

function visibleName(value) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 150) : null;
}

function cleanPath(value) {
  if (typeof value !== 'string' || !value) return null;
  if (value.startsWith('\\\\?\\UNC\\')) value = '\\\\' + value.slice(8);
  else if (value.startsWith('\\\\?\\')) value = value.slice(4);
  return resolve(value);
}

// Read only names and workspace metadata, never messages or prompt contents.
export function readDesktopMetadata(session, { codexHome = process.env.CODEX_HOME || join(homedir(), '.codex') } = {}) {
  let files;
  try {
    files = readdirSync(codexHome)
      .filter(file => /^state_\d+\.sqlite$/.test(file))
      .sort((a, b) => Number(b.match(/\d+/)[0]) - Number(a.match(/\d+/)[0]));
  } catch { return null; }
  for (const file of files) {
    let db;
    try {
      db = new DatabaseSync(join(codexHome, file), { readOnly: true });
      db.exec('PRAGMA busy_timeout=100');
      const columns = new Set(db.prepare('PRAGMA table_info(threads)').all().map(column => column.name));
      if (!columns.has('id') || !columns.has('cwd')) continue;
      const fields = ['cwd', ...(columns.has('name') ? ['name'] : []), ...(columns.has('project_id') ? ['project_id'] : [])];
      const thread = db.prepare('SELECT ' + fields.join(',') + ' FROM threads WHERE id=?').get(session);
      if (!thread) continue;
      let name = null;
      if (thread.project_id) {
        const projectColumns = new Set(db.prepare('PRAGMA table_info(projects)').all().map(column => column.name));
        const label = ['display_name', 'name', 'label'].find(key => projectColumns.has(key));
        if (label && projectColumns.has('id')) {
          name = visibleName(db.prepare('SELECT ' + label + ' AS label FROM projects WHERE id=?').get(thread.project_id)?.label);
        }
      }
      return { project: cleanPath(thread.cwd), name: name || visibleName(thread.name) };
    } catch {
      // Metadata is optional and its local schema may change after app updates.
    } finally { db?.close(); }
  }
  return null;
}

export function syncDesktopNames(store, options = {}) {
  const changed = [];
  for (const project of store.list()) {
    const sessions = store.db.prepare("SELECT DISTINCT session FROM intervals WHERE project=? AND agent='codex' ORDER BY start DESC").all(project.id);
    for (const { session } of sessions) {
      const metadata = readDesktopMetadata(session, options);
      if (metadata?.name) {
        if (store.setAutomaticName(project.id, metadata.name)) changed.push({ id: project.id, name: metadata.name });
        break;
      }
    }
  }
  return changed;
}
