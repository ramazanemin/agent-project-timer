import { TimerStore } from './store.js';
import { normalize } from './adapters.js';
import { readDesktopMetadata } from './desktop-metadata.js';
export async function runHook(agent,event,project,pinSession=false){
 let db;
 try{
  let input='';
  for await(const chunk of process.stdin){input+=chunk;if(input.length>4*1024*1024)throw new Error('Hook input too large');}
  const payload=JSON.parse(input||'{}');
  if(project)payload.cwd=project;
  const normalized=normalize(agent,event,payload);
  if(normalized){
   db=new TimerStore();
   let metadata=null;
   if(pinSession){
    metadata=readDesktopMetadata(normalized.session);
    const anchor=db.db.prepare('SELECT p.path FROM intervals i JOIN projects p ON p.id=i.project WHERE i.agent=? AND i.session=? ORDER BY i.start,i.id LIMIT 1').get(normalized.agent,normalized.session);
    normalized.project=metadata?.project||anchor?.path||normalized.project;
   }
   const id=db.event(normalized);
   if(id&&metadata?.name)db.setAutomaticName(id,metadata.name);
  }
 }catch(e){console.error('[agent-timer] '+e.message);}finally{db?.close();}
 if(agent==='cline')process.stdout.write('{}\n');
}

