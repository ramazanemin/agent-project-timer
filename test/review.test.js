import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install } from '../src/install.js';
import { TimerStore } from '../src/store.js';
test('OpenCode installer uses a discoverable js extension',()=>{const dir=mkdtempSync(join(tmpdir(),'timer-oc-'));try{assert.ok(install('opencode',dir)[0].endsWith('/agent-project-timer.js')||install('opencode',dir)[0].endsWith('\\agent-project-timer.js'));}finally{rmSync(dir,{recursive:true,force:true});}});
test('Windows project identity ignores path casing',{skip:process.platform!=='win32'},()=>{const db=new TimerStore(':memory:');try{const project=process.cwd();db.event({project,agent:'codex',session:'a',state:'start'});db.event({project:project.toUpperCase(),agent:'claude',session:'b',state:'start'});assert.equal(db.list().length,1);}finally{db.close();}});
