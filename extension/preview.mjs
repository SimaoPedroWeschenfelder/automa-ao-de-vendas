import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const allowed=new Set(['panel.html','style.css','panel.js','model.js','task-state.js','task-manager.js','bridge-policy.js','preview-store.js','bridge-client.js','panel-bridge.js','background.js','content.js','fixture.html','fixture.js','bridge-test.html','bridge-test.js']);
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let name=url.pathname.slice(1)||'panel.html';if(url.pathname==='/'&&url.searchParams.has('bridge-test'))name='bridge-test.html';if(name==='marketplace/create/vehicle')name='fixture.html';if(!allowed.has(name)){res.writeHead(404);res.end();return}const source=['fixture.html','fixture.js','bridge-test.html','bridge-test.js'].includes(name)?path.join(root,'tests',name):path.join(root,name);const data=await readFile(source);res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':'text/javascript');res.end(data)}catch{res.writeHead(404);res.end()}}).listen(4178,'127.0.0.1',()=>console.log('Prévia local: http://127.0.0.1:4178'));
