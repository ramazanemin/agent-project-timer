import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, realpathSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { homedir } from 'node:os';
export function defaultDatabase(){return process.env.AGENT_TIMER_DB || resolve(homedir(),'.agent-project-timer','timer.sqlite');}
export function unionMs(intervals){let total=0,end=-Infinity;for(const [a,b] of intervals.sort((x,y)=>x[0]-y[0])){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}return total;}
export class TimerStore {
 constructor(file=defaultDatabase(),clock=Date.now){
  this.clock=clock;
  if(file!==':memory:')mkdirSync(dirname(resolve(file)),{recursive:true});
  this.db=new DatabaseSync(file);
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY,path TEXT UNIQUE NOT NULL,name TEXT NOT NULL,started INTEGER NOT NULL,completed INTEGER); CREATE TABLE IF NOT EXISTS intervals(id INTEGER PRIMARY KEY,project INTEGER NOT NULL,agent TEXT NOT NULL,session TEXT NOT NULL,start INTEGER NOT NULL,end INTEGER); CREATE UNIQUE INDEX IF NOT EXISTS one_active ON intervals(project,agent,session) WHERE end IS NULL;`);
  if(!this.db.prepare('PRAGMA table_info(projects)').all().some(column=>column.name==='name_source')){
   this.db.exec("ALTER TABLE projects ADD COLUMN name_source TEXT NOT NULL DEFAULT 'folder'");
   for(const project of this.db.prepare('SELECT id,path,name FROM projects').all()){
    if(project.name!==(basename(project.path)||project.path))this.db.prepare("UPDATE projects SET name_source='manual' WHERE id=?").run(project.id);
   }
  }
 }
 event({project,agent,session,state}){if(typeof project!=='string'||!project.trim()||typeof session!=='string'||!session.trim()||!['codex','claude','cline','opencode','manual'].includes(agent)||!['start','stop'].includes(state))throw new Error('Invalid event: project, agent, session and start/stop required');project=resolve(project);try{project=realpathSync.native(project);}catch{} const now=this.clock();this.db.exec('BEGIN IMMEDIATE');try{let p=this.db.prepare('SELECT * FROM projects WHERE path=?'+(process.platform==='win32'?' COLLATE NOCASE':'')).get(project);if(!p&&state==='start'){this.db.prepare('INSERT INTO projects(path,name,started) VALUES(?,?,?)').run(project,basename(project)||project,now);p=this.db.prepare('SELECT * FROM projects WHERE path=?'+(process.platform==='win32'?' COLLATE NOCASE':'')).get(project);}if(p&&p.completed===null){if(state==='start')this.db.prepare('INSERT OR IGNORE INTO intervals(project,agent,session,start) VALUES(?,?,?,?)').run(p.id,agent,session,now);else this.db.prepare('UPDATE intervals SET end=MAX(start,?) WHERE project=? AND agent=? AND session=? AND end IS NULL').run(now,p.id,agent,session);}this.db.exec('COMMIT');return p?.id;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 list(){const now=this.clock();return this.db.prepare('SELECT * FROM projects ORDER BY started DESC,id DESC').all().map(p=>{const rows=this.db.prepare('SELECT * FROM intervals WHERE project=? ORDER BY start').all(p.id);const pairs=rows.map(i=>[i.start,Math.max(i.start,i.end??now)]);const agentMs={};for(const a of new Set(rows.map(i=>i.agent)))agentMs[a]=unionMs(rows.filter(i=>i.agent===a).map(i=>[i.start,Math.max(i.start,i.end??now)]));return {...p,status:p.completed!==null?'completed':rows.some(i=>i.end===null)?'running':'paused',activeMs:unionMs(pairs),elapsedMs:Math.max(0,(p.completed??now)-p.started),agentMs,sessions:rows.filter(i=>i.end===null).map(({agent,session,start})=>({agent,session,start}))};});}
 pause(id){this.require(id);this.db.prepare('UPDATE intervals SET end=MAX(start,?) WHERE project=? AND end IS NULL').run(this.clock(),id);}
 complete(id){this.require(id);this.db.exec('BEGIN IMMEDIATE');try{this.pause(id);this.db.prepare('UPDATE projects SET completed=COALESCE(completed,?) WHERE id=?').run(this.clock(),id);this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}}
 reopen(id){this.require(id);this.db.prepare('UPDATE projects SET completed=NULL WHERE id=?').run(id);}
 rename(id,name){this.require(id);if(typeof name!=='string'||!name.trim()||name.length>150)throw new Error('Name must contain 1–150 characters');this.db.prepare("UPDATE projects SET name=?,name_source='manual' WHERE id=?").run(name.trim(),id);}
 setAutomaticName(id,name){if(typeof name!=='string'||!name.trim()||name.length>150)return false;return this.db.prepare("UPDATE projects SET name=?,name_source='desktop' WHERE id=? AND name_source!='manual' AND name!=?").run(name.trim(),id,name.trim()).changes>0;}
 require(id){if(!Number.isSafeInteger(id)||!this.db.prepare('SELECT id FROM projects WHERE id=?').get(id))throw new Error('Project not found');}
 close(){this.db.close();}
}
