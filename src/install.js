import { existsSync,mkdirSync,readFileSync,writeFileSync,copyFileSync } from 'node:fs';
import { resolve,dirname,join } from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
const cli=fileURLToPath(new URL('./cli.js',import.meta.url));
const mark='agent-project-timer generated';
function quoted(s){if(/["`$%!?&|<>\r\n]/.test(s))throw new Error('Hook paths contain unsupported shell characters');return '"'+s+'"';}
function save(file,text){mkdirSync(dirname(file),{recursive:true});writeFileSync(file,text,{encoding:'utf8',mode:0o755});}
function owned(file,text){if(existsSync(file)){const old=readFileSync(file,'utf8');if(old===text)return;if(!old.includes(mark))throw new Error('Existing file preserved: '+file);copyFileSync(file,file+'.timer-backup');}save(file,text);}
export function install(agent,project){project=resolve(project);if(!existsSync(project))throw new Error('Project directory not found');
 if(['codex','claude'].includes(agent)){
 const events=agent==='codex'?['UserPromptSubmit','PreToolUse','PostToolUse','PermissionRequest','Stop','Interrupt','SessionEnd']:['UserPromptSubmit','PreToolUse','PostToolUse','PermissionRequest','Stop','StopFailure','SessionEnd'];
 const file=join(project,agent==='codex'?'.codex/hooks.json':'.claude/settings.local.json');const old=existsSync(file)?readFileSync(file,'utf8'):null;const config=old?JSON.parse(old.replace(/^\uFEFF/,'')):{};config.hooks??={};
 for(const event of events){const command=[quoted(process.execPath),quoted(cli),'hook',agent,event,'--project',quoted(project)].join(' ');const group={hooks:[{type:'command',command,timeout:3}]};config.hooks[event]??=[];if(!config.hooks[event].some(g=>g.hooks?.some(h=>h.command===command)))config.hooks[event].push(group);}
 const next=JSON.stringify(config,null,2)+'\n';if(old!==next){if(old!==null)copyFileSync(file,file+'.timer-backup');save(file,next);}return [file];
 }
 if(agent==='opencode'){const plugin=pathToFileURL(fileURLToPath(new URL('./opencode.js',import.meta.url))).href;const file=join(project,'.opencode/plugins/agent-project-timer.js');owned(file,`// ${mark}\nimport { plugin } from ${JSON.stringify(plugin)};\nexport default plugin;\n`);return [file];}
 if(['cline','cline-legacy'].includes(agent)){
 // Modern Cline CLI SDK loads JS hooks on Windows. Legacy VS Code hooks require POSIX.
 if(agent==='cline-legacy'&&process.platform==='win32')throw new Error('Legacy Cline VS Code hooks require WSL/Linux/macOS. Use cline for the current SDK/CLI.');
 const dir=join(project,agent==='cline'?'.cline/hooks':'.clinerules/hooks');const events=['TaskStart','TaskResume','UserPromptSubmit','PreToolUse','PostToolUse','TaskComplete','TaskCancel',...(agent==='cline'?['TaskError','SessionShutdown']:[])];
 const files=events.map(event=>{const file=join(dir,event+(agent==='cline'?'.mjs':''));const code=`#!/usr/bin/env node\n// ${mark}\nimport { runHook } from ${JSON.stringify(pathToFileURL(fileURLToPath(new URL('./hook.js',import.meta.url))).href)};\nawait runHook('cline',${JSON.stringify(event)},${JSON.stringify(project)});\n`;return {file,code};});
 for(const {file,code} of files)if(existsSync(file)&&!readFileSync(file,'utf8').includes(mark)&&readFileSync(file,'utf8')!==code)throw new Error('Existing hook preserved: '+file);
 for(const {file,code} of files)owned(file,code);return files.map(f=>f.file);
 }
 throw new Error('Agent must be codex, claude, cline, cline-legacy or opencode');
}
