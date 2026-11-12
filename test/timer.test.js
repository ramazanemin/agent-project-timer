import test from 'node:test';
import assert from 'node:assert/strict';
import { TimerStore } from '../src/store.js';
import { normalize } from '../src/adapters.js';
const project=process.cwd();
function setup(){let now=1000;const db=new TimerStore(':memory:',()=>now);return {db,set:n=>now=n,send:(state,session='s',agent='codex')=>db.event({project,session,agent,state})};}
test('pause and resume excludes the waiting gap and duplicate starts',()=>{const t=setup();t.send('start');t.set(2000);t.send('start');t.set(4000);t.send('stop');t.set(9000);t.send('start');t.set(11000);t.send('stop');assert.equal(t.db.list()[0].activeMs,5000);t.db.close();});
test('overlapping agents count once in project total',()=>{const t=setup();t.send('start');t.set(2000);t.send('start','b','claude');t.set(4000);t.send('stop');t.set(6000);t.send('stop','b','claude');assert.equal(t.db.list()[0].activeMs,5000);assert.equal(t.db.list()[0].agentMs.codex,3000);t.db.close();});
test('completion closes activity and refuses new work until reopened',()=>{const t=setup();t.send('start');t.set(4000);const id=t.db.list()[0].id;t.db.complete(id);t.set(6000);t.send('start');assert.equal(t.db.list()[0].status,'completed');assert.equal(t.db.list()[0].activeMs,3000);t.db.reopen(id);t.send('start');assert.equal(t.db.list()[0].status,'running');t.db.close();});
test('stop before start creates no phantom project',()=>{const t=setup();t.send('stop');assert.equal(t.db.list().length,0);t.db.close();});
test('reject invalid state and missing session',()=>{const t=setup();assert.throws(()=>t.send('bad'));assert.throws(()=>t.db.event({project,agent:'codex',state:'start'}));t.db.close();});
test('Codex and Claude hook fixtures normalize session identity',()=>{for(const agent of ['codex','claude']){assert.deepEqual(normalize(agent,'UserPromptSubmit',{cwd:project,session_id:'a'}),{project,session:'a',agent,state:'start'});assert.equal(normalize(agent,'Stop',{cwd:project,session_id:'a'}).state,'stop');assert.equal(normalize(agent,'PermissionRequest',{cwd:project,session_id:'a'}).state,'stop');}});
test('Cline task completion is only a session stop',()=>{assert.equal(normalize('cline','TaskComplete',{workspaceRoots:[project],taskId:'a'}).state,'stop');assert.equal(normalize('cline','agent_resume',{workspaceRoots:[project],taskId:'a'}).state,'start');});
test('OpenCode busy and idle events normalize',()=>{assert.equal(normalize('opencode','session.status',{directory:project,properties:{sessionID:'a',status:{type:'busy'}}}).state,'start');assert.equal(normalize('opencode','session.idle',{directory:project,properties:{sessionID:'a'}}).state,'stop');});
