#!/usr/bin/env node
import { TimerStore,defaultDatabase } from './store.js';
import { createTimerServer } from './server.js';
import { install } from './install.js';
import { runHook } from './hook.js';
const args=process.argv.slice(2);const option=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
try{
 const command=args[0]||'help';
 if(command==='hook')await runHook(args[1],args[2],option('project'));
 else if(command==='install'){console.log(install(args[1],option('project',process.cwd())).join('\n'));console.log('Restart your agent and enable/trust hooks. See README for client-specific support.');}
 else if(command==='serve'){const port=Number(option('port',4317));if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');const db=new TimerStore();const server=createTimerServer(db);server.on('error',e=>{console.error(e.message);db.close();process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log(`Agent Timer: http://127.0.0.1:${port}\nDatabase: ${defaultDatabase()}`));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));}
 else if(command==='list'){const db=new TimerStore();try{console.log(JSON.stringify(db.list(),null,2));}finally{db.close();}}
 else console.log('agent-timer serve [--port 4317]\nagent-timer install <codex|claude|cline|cline-legacy|opencode> [--project PATH]\nagent-timer list\nEnvironment: AGENT_TIMER_DB (shared by dashboard and hooks)');
}catch(e){console.error(e.message);process.exitCode=1;}
