const origins=new Set(['http://127.0.0.1:4178','http://127.0.0.1:4180','https://pulse-vendas-demo.netlify.app']);
export function panelOrigin(value){try{const u=new URL(value);return origins.has(u.origin)&&['/','/panel.html','/index.html'].includes(u.pathname)?u.origin:null}catch{return null}}
export function panelCarKey(id,url){const origin=panelOrigin(url);if(!origin||typeof id!=='string'||!id||id.length>160)throw new Error('Origem ou cadastro não autorizado.');return 'panel:'+origin+':'+id}
export function isFacebookUrl(value){try{const u=new URL(value);return ['https://www.facebook.com','https://web.facebook.com'].includes(u.origin)&&u.pathname.startsWith('/marketplace/')}catch{return false}}
