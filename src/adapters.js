const starts=new Set(['UserPromptSubmit','PreToolUse','PostToolUse','TaskStart','TaskResume','agent_start','agent_resume','prompt_submit','tool_call','tool_result']);
const stops=new Set(['Stop','StopFailure','Interrupt','SessionEnd','PermissionRequest','TaskComplete','TaskCancel','TaskError','SessionShutdown','agent_end','agent_abort','agent_error','session_shutdown']);
export function normalize(agent,event,payload){
 let state=starts.has(event)?'start':stops.has(event)?'stop':null;
 const tool=payload.tool_name||payload.preToolUse?.toolName||payload.tool_call?.name;
 if(['PreToolUse','tool_call'].includes(event)&&['AskUserQuestion','request_user_input','ask_followup_question'].includes(tool))state='stop';
 if(agent==='opencode'){
  if(event==='session.status'){const s=payload.properties?.status?.type;state=s==='busy'||s==='retry'?'start':s==='idle'?'stop':null;}
  if(['session.idle','session.error','session.deleted','permission.asked','question.asked'].includes(event))state='stop';
  if(['permission.replied','question.replied'].includes(event))state='start';
 }
 if(!state)return null;
 const project=payload.cwd||payload.directory||payload.workspaceRoots?.[0];
 const session=payload.session_id||payload.taskId||payload.properties?.sessionID||payload.properties?.info?.id;
 if(typeof project!=='string'||typeof session!=='string'||!session)return null;
 return {project,session,agent,state};
}
