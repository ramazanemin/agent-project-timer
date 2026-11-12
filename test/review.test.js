import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install } from '../src/install.js';
import { TimerStore } from '../src/store.js';
test('OpenCode installer uses a discoverable js extension',()=>{const dir=mkdtempSync(join(tmpdir(),'timer-oc-'));try{assert.ok(install('opencode',dir)[0].endsWith('/agent-project-timer.js')||install('opencode',dir)[0].endsWith('\\agent-project-timer.js'));}finally{rmSync(dir,{recursive:true,force:true});}});
test('Windows project identity ignores path casing',{skip:process.platform!=='win32'},()=>{const db=new TimerStore(':memory:');try{const project=process.cwd();db.event({project,agent:'codex',session:'a',state:'start'});db.event({project:project.toUpperCase(),agent:'claude',session:'b',state:'start'});assert.equal(db.list().length,1);}finally{db.close();}});

test('Windows installed Codex command executes in PowerShell with real stdin',{skip:process.platform!=='win32'},()=>{
 const dir=mkdtempSync(join(tmpdir(),'timer-win-hook-'));
 try{
  install('codex',dir);
  const cfg=JSON.parse(readFileSync(join(dir,'.codex/hooks.json'),'utf8'));
  const command=cfg.hooks.UserPromptSubmit[0].hooks[0].command;
  const result=spawnSync(process.env.PS_EXE||'pwsh',['-NoProfile','-NonInteractive','-Command',command],{input:JSON.stringify({cwd:dir,session_id:'windows-command'}),encoding:'utf8',env:{...process.env,AGENT_TIMER_DB:join(dir,'test.sqlite')}});
  assert.equal(result.status,0,result.stderr);
  const db=new TimerStore(join(dir,'test.sqlite'));assert.equal(db.list()[0]?.status,'running');db.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});


test('Codex allows Windows shell startup time while respecting terminal hook limits',()=>{
 const dir=mkdtempSync(join(tmpdir(),'timer-timeout-'));
 try{install('codex',dir);const cfg=JSON.parse(readFileSync(join(dir,'.codex/hooks.json'),'utf8'));assert.equal(cfg.hooks.Stop[0].hooks[0].timeout,15);assert.equal(cfg.hooks.Interrupt[0].hooks[0].timeout,3);assert.equal(cfg.hooks.SessionEnd[0].hooks[0].timeout,3);}finally{rmSync(dir,{recursive:true,force:true});}
});
