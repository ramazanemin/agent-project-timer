import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const assets={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
export function createTimerServer(store){return createServer(async(req,res)=>{
 const send=(code,data,type='application/json; charset=utf-8')=>{res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"});res.end(type.startsWith('application/json')?JSON.stringify(data):data);};
 try{const address=res.socket.localPort;const allowed=new Set([`127.0.0.1:${address}`,`localhost:${address}`]);if(!allowed.has(req.headers.host))return send(403,{error:'Invalid host'});if(req.headers.origin&&!['http://127.0.0.1:'+address,'http://localhost:'+address].includes(req.headers.origin))return send(403,{error:'Invalid origin'});if(req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'Cross-site request'});
 const path=new URL(req.url,'http://localhost').pathname;
 if(req.method==='GET'&&path==='/api/projects')return send(200,store.list());
 if(req.method==='GET'&&assets[path]){const [file,type]=assets[path];return send(200,readFileSync(new URL('../public/'+file,import.meta.url)),type);}
 const match=path.match(/^\/api\/projects\/(\d+)\/(complete|reopen|pause|rename)$/);
 if(req.method==='POST'&&match){const id=Number(match[1]);if(match[2]==='rename'){let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)return send(413,{error:'Body too large'});}store.rename(id,JSON.parse(body).name);}else store[match[2]](id);return send(200,{ok:true});}
 return send(404,{error:'Not found'});
 }catch(e){return send(400,{error:e.message});}
 });}
