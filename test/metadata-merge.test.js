import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync,mkdirSync,rmSync,realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { TimerStore } from '../src/store.js';
import { readDesktopMetadata, syncDesktopNames } from '../src/desktop-metadata.js';
import { mergeProjects } from '../src/maintenance.js';
function metadataRoot(){const root=mkdtempSync(join(tmpdir(),'timer-meta-'));mkdirSync(join(root,'home'));const db=new DatabaseSync(join(root,'home','state_5.sqlite'));db.exec('CREATE TABLE threads(id TEXT PRIMARY KEY,name TEXT,cwd TEXT,project_id TEXT); CREATE TABLE projects(id TEXT PRIMARY KEY,name TEXT);');return {root,db,home:join(root,'home')};}
test('real Desktop hook CLI stores visible name and canonical workspace across tool directories',()=>{
 const fixture=metadataRoot();
 try{
  const workspace=join(fixture.root,'opaque');mkdirSync(workspace);
  fixture.db.prepare('INSERT INTO threads VALUES(?,?,?,?)').run('live-name','Desktop proje adı',workspace,null);
  const file=join(fixture.root,'timer.sqlite');
  const cli=fileURLToPath(new URL('../src/cli.js',import.meta.url));
  for(const event of ['UserPromptSubmit','Stop']){
   const result=spawnSync(process.execPath,[cli,'hook','codex',event,'--desktop','--db',file],{input:JSON.stringify({cwd:event==='Stop'?fixture.root:workspace,session_id:'live-name'}),encoding:'utf8',env:{...process.env,CODEX_HOME:fixture.home}});
   assert.equal(result.status,0,result.stderr);
  }
  const timer=new TimerStore(file);
  try{assert.equal(timer.list().length,1);assert.equal(timer.list()[0].name,'Desktop proje adı');assert.equal(timer.list()[0].path,realpathSync.native(workspace));assert.equal(timer.list()[0].status,'paused');}finally{timer.close();}
 }finally{fixture.db.close();rmSync(fixture.root,{recursive:true,force:true});}
});
test('Desktop uses visible name instead of opaque folder; named workspace wins',()=>{const f=metadataRoot();try{f.db.prepare('INSERT INTO threads VALUES(?,?,?,?)').run('s','AI proje süresi paneli oluştur',process.cwd(),null);assert.equal(readDesktopMetadata('s',{codexHome:f.home}).name,'AI proje süresi paneli oluştur');f.db.prepare('INSERT INTO projects VALUES(?,?)').run('p','İş projesi');f.db.prepare('UPDATE threads SET project_id=? WHERE id=?').run('p','s');assert.equal(readDesktopMetadata('s',{codexHome:f.home}).name,'İş projesi');}finally{f.db.close();rmSync(f.root,{recursive:true,force:true});}});
test('Metadata is optional and does not interpret title/prompt as a name',()=>{const f=metadataRoot();try{f.db.prepare('INSERT INTO threads VALUES(?,?,?,?)').run('s',null,process.cwd(),null);assert.equal(readDesktopMetadata('missing',{codexHome:f.home}),null);assert.equal(readDesktopMetadata('s',{codexHome:f.home}).name,null);}finally{f.db.close();rmSync(f.root,{recursive:true,force:true});}});
test('name sync fills existing records, follows Desktop renames, preserves manual names',()=>{const f=metadataRoot();const timer=new TimerStore(':memory:');try{f.db.prepare('INSERT INTO threads VALUES(?,?,?,?)').run('s','Gerçek sohbet adı',process.cwd(),null);timer.event({project:process.cwd(),agent:'codex',session:'s',state:'start'});syncDesktopNames(timer,{codexHome:f.home});let p=timer.list()[0];assert.equal(p.name,'Gerçek sohbet adı');f.db.prepare('UPDATE threads SET name=? WHERE id=?').run('Yeni sohbet adı','s');syncDesktopNames(timer,{codexHome:f.home});assert.equal(timer.list()[0].name,'Yeni sohbet adı');timer.rename(p.id,'Benim adım');syncDesktopNames(timer,{codexHome:f.home});assert.equal(timer.list()[0].name,'Benim adım');}finally{timer.close();f.db.close();rmSync(f.root,{recursive:true,force:true});}});
test('merge avoids overlap and closes stale duplicate using recorded stop evidence',()=>{let now=1000;const d=new TimerStore(':memory:',()=>now);try{const a=join(process.cwd(),'a'),b=join(process.cwd(),'b');d.event({project:a,agent:'codex',session:'s',state:'start'});now=2000;d.event({project:b,agent:'codex',session:'s',state:'start'});now=4000;d.event({project:a,agent:'codex',session:'s',state:'stop'});now=6000;d.event({project:a,agent:'codex',session:'s',state:'start'});now=7000;d.event({project:a,agent:'codex',session:'s',state:'stop'});now=999999;const aId=d.list().find(p=>p.path===a).id,bId=d.list().find(p=>p.path===b).id;mergeProjects(d,aId,[bId]);const [p]=d.list();assert.equal(d.list().length,1);assert.equal(p.activeMs,4000);assert.equal(p.status,'paused');assert.equal(d.db.prepare('SELECT COUNT(*) AS n FROM intervals').get().n,3);}finally{d.close();}});
test('invalid merge rolls back without losing source records',()=>{const d=new TimerStore(':memory:');try{d.event({project:process.cwd(),agent:'codex',session:'s',state:'start'});assert.throws(()=>mergeProjects(d,1,[999]));assert.equal(d.list().length,1);assert.equal(d.list()[0].status,'running');}finally{d.close();}});
