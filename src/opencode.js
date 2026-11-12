import { TimerStore } from './store.js';
import { normalize } from './adapters.js';
export const plugin=async({directory})=>({event:async({event})=>{let db;try{const input=normalize('opencode',event.type,{directory,properties:event.properties});if(input){db=new TimerStore();db.event(input);}}catch(e){console.error('[agent-timer] '+e.message);}finally{db?.close();}}});
