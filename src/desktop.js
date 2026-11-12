import { existsSync,mkdirSync,readFileSync,writeFileSync,copyFileSync } from 'node:fs';
import { resolve,dirname,join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
const cli=fileURLToPath(new URL('./cli.js',import.meta.url));
const events=['UserPromptSubmit','PreToolUse','PostToolUse','PermissionRequest','Stop','Interrupt','SessionEnd'];
function safe(value){if(/["'`$%!?&|<>\r\n]/.test(value))throw new Error('Unsupported shell character in Desktop hook path');return value;}
function quote(value){return '"'+safe(value)+'"';}
export function installDesktop({codexHome=process.env.CODEX_HOME||join(homedir(),'.codex'),database}={}){
 if(typeof database!=='string'||!database.trim())throw new Error('Desktop installation requires --db pointing to the panel database');
 const db=resolve(database);const file=join(resolve(codexHome),'hooks.json');const old=existsSync(file)?readFileSync(file,'utf8'):null;const config=old?JSON.parse(old.replace(/^\uFEFF/,'')):{};config.hooks??={};
 for(const event of events){
  const command=[process.platform==='win32'?'node':quote(process.execPath),quote(cli),'hook','codex',event,'--desktop','--db',quote(db)].join(' ');
  const psArgs=[process.execPath,cli].map(p=>"'"+safe(p)+"'").join(' ')+` hook codex ${event} --desktop --db '${safe(db)}'`;
  const commandWindows='powershell.exe -NoProfile -NonInteractive -Command "& '+psArgs+'"';
  const entry={type:'command',command,commandWindows,timeout:['Interrupt','SessionEnd'].includes(event)?3:15,statusMessage:'Agent Timer'};
  const existing=config.hooks[event]??[];
  config.hooks[event]=existing.map(group=>({...group,hooks:group.hooks?.filter(h=>!(h.statusMessage==='Agent Timer'&&h.command?.includes(quote(cli)+' hook codex ')))})).filter(group=>!Array.isArray(group.hooks)||group.hooks.length);
  config.hooks[event].push({hooks:[entry]});
 }
 const next=JSON.stringify(config,null,2)+'\n';if(old!==next){mkdirSync(dirname(file),{recursive:true});if(old!==null)copyFileSync(file,file+'.timer-backup');writeFileSync(file,next,'utf8');}
 return [file];
}

