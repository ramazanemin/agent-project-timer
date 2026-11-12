import { TimerStore } from './store.js';
import { normalize } from './adapters.js';
export async function runHook(agent,event,project){let db;try{let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>4*1024*1024)throw new Error('Hook input too large');}const payload=JSON.parse(input||'{}');if(project)payload.cwd=project;const normalized=normalize(agent,event,payload);if(normalized){db=new TimerStore();db.event(normalized);}}catch(e){console.error('[agent-timer] '+e.message);}finally{db?.close();}if(agent==='cline')process.stdout.write('{}\n');}
