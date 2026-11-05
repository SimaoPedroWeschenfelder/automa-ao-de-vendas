import {readFile,readdir} from 'node:fs/promises';
import {inflateRawSync} from 'node:zlib';
import path from 'node:path';
import {supportsFacebook} from '../facebook.js';

export async function sourceFiles(directory,prefix=''){
  const files=new Map();
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const name=prefix+entry.name,absolute=path.join(directory,entry.name);
    if(entry.isDirectory())for(const [key,value] of await sourceFiles(absolute,name+'/'))files.set(key,value);
    else if(entry.isFile())files.set(name,await readFile(absolute));
    else throw new Error('Entrada não suportada no conector: '+name);
  }
  return files;
}

export function zipFiles(bytes){
  const end=bytes.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  if(end<0||end+22>bytes.length)throw new Error('ZIP do conector inválido.');
  const count=bytes.readUInt16LE(end+10),files=new Map();let offset=bytes.readUInt32LE(end+16);
  for(let n=0;n<count;n++){
    if(bytes.readUInt32LE(offset)!==0x02014b50)throw new Error('Índice do ZIP inválido.');
    const flags=bytes.readUInt16LE(offset+8),method=bytes.readUInt16LE(offset+10),compressed=bytes.readUInt32LE(offset+20),size=bytes.readUInt32LE(offset+24);
    const length=bytes.readUInt16LE(offset+28),extra=bytes.readUInt16LE(offset+30),comment=bytes.readUInt16LE(offset+32),local=bytes.readUInt32LE(offset+42);
    const name=bytes.subarray(offset+46,offset+46+length).toString('utf8').replaceAll('\\','/');
    offset+=46+length+extra+comment;
    if(name.endsWith('/'))continue;
    if(flags&1||!name||name.startsWith('/')||name.split('/').includes('..')||files.has(name)||size>10*1024*1024)throw new Error('Entrada inválida no ZIP: '+name);
    if(bytes.readUInt32LE(local)!==0x04034b50)throw new Error('Cabeçalho do ZIP inválido: '+name);
    const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28),data=bytes.subarray(start,start+compressed);
    const decoded=method===0?data:method===8?inflateRawSync(data,{maxOutputLength:10*1024*1024}):null;
    if(!decoded||decoded.length!==size)throw new Error('Conteúdo do ZIP inválido: '+name);
    files.set(name,decoded);
  }
  return files;
}

const normalized=bytes=>bytes.toString('utf8').replace(/^\uFEFF/,'').replaceAll('\r\n','\n');
export async function checkRelease(root,archive=path.join(root,'pulse-conector.zip')){
  const source=await sourceFiles(path.join(root,'extension'));
  const packaged=zipFiles(await readFile(archive));
  const manifest=JSON.parse(normalized(source.get('manifest.json')));
  if(!supportsFacebook(manifest.version))throw new Error('A versão do conector não é compatível com o painel.');
  if(source.size!==packaged.size)throw new Error('O ZIP não contém os mesmos arquivos de extension/. Execute npm run package:connector.');
  for(const [name,contents] of source){
    if(!packaged.get(name)?.equals(contents))throw new Error('O ZIP está desatualizado: '+name+'. Execute npm run package:connector.');
  }
  for(const name of ['bridge-client.js','model.js','task-state.js']){
    if(normalized(await readFile(path.join(root,name)))!==normalized(source.get(name)))throw new Error('Painel e extensão divergem em '+name+'. Atualize as duas cópias antes do commit.');
  }
  return {version:manifest.version,files:source.size};
}
