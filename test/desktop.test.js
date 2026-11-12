import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { installDesktop } from '../src/desktop.js';
import { TimerStore } from '../src/store.js';
test('Desktop hooks preserve existing settings and track payload cwd into one explicit database',()=>{
 const root=mkdtempSync(join(tmpdir(),'timer-desktop-'));
 try{const home=join(root,'codex');mkdirSync(home);const file=join(home,'hooks.json');writeFileSync(file,JSON.stringify({description:'existing',hooks:{Stop:[{hooks:[{type:'command',command:'echo keep'}]}]}}));const dbFile=join(root,'panel.sqlite');installDesktop({codexHome:home,database:dbFile});installDesktop({codexHome:home,database:dbFile});const config=JSON.parse(readFileSync(file,'utf8'));assert.equal(config.description,'existing');assert.equal(config.hooks.Stop.length,2);assert.equal(config.hooks.Stop[0].hooks[0].command,'echo keep');assert.ok(existsSync(file+'.timer-backup'));const hook=config.hooks.UserPromptSubmit[0].hooks[0];assert.ok(hook.command.includes('--db'));assert.ok(!hook.command.includes('--project'));
 const cwd=join(root,'İstanbul');mkdirSync(cwd);const child=join(cwd,'child');mkdirSync(child);const run=(event)=>{const h=config.hooks[event].at(-1).hooks[0];return spawnSync(process.platform==='win32'?'powershell.exe':'sh',process.platform==='win32'?['-NoProfile','-NonInteractive','-Command',h.commandWindows]:['-c',h.command],{input:JSON.stringify({cwd:event==='UserPromptSubmit'?cwd:child,session_id:'desktop-fixture'}),encoding:'utf8'});};for(const event of ['UserPromptSubmit','PreToolUse','Stop']){const r=run(event);assert.equal(r.status,0,r.stderr);}const db=new TimerStore(dbFile);try{assert.equal(db.list().length,1);assert.equal(db.list()[0].path,cwd);assert.equal(db.list()[0].status,'paused');}finally{db.close();}
 }finally{rmSync(root,{recursive:true,force:true});}
});


